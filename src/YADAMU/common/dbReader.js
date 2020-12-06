"use strict";
const Readable = require('stream').Readable;
const Yadamu = require('./yadamu.js')
const YadamuLibrary = require('./yadamuLibrary.js')
const YadamuWriter = require('./yadamuWriter.js')
const {DatabaseError, IterativeInsertError} = require('./yadamuError.js')
const { performance } = require('perf_hooks');

const util = require('util')
const stream = require('stream')
const pipeline = util.promisify(stream.pipeline);

const TableManager = require('../file/node/tableManager.js');
const YadamuConstants = require('./yadamuConstants.js')

class DBReader extends Readable {  

  /* 
  **
  ** The DBReader is responsibe for replicating the source data source to the target source.
  **
  ** The DBReader starts by sending "systemInformation", "ddl" "metadata" and "pause" messages directly to the DBWriter.
  ** Then it waits for the DBWriter to raise 'ddlCompelete' before sending the contents of the tables.
  **
  ** A seperate set of table level readers and writers are used to send the table contents.
  ** If the target is a database, the table level operations can execute sequentially or in parallel.
  ** If the target is a file the table level operations must operate sequentially.
  ** 
  ** When the DBWriter recieves a pause message it caches the associated callback instead of invoking it. This has the effect of pausing the DBWriter. 
  ** When the DBReader has finished processing all the tables it resumes the DBWriter by invoking the cached callback.
  **
  ** #### The following comments are outdated and need to be updated once regressions have been run successfully ###
  **
  ** Once the 'Metadata' event has been sent the reader pauses itself. When the DBWriter has executed all of the DDL statements
  ** it emits a 'ddlComplete' event indicating that the target envrironment is ready to consume data. At this point the DBReader starts sending data. 
  ** 
  ** For database backed data sources, the DBReader does not send the data iteself. It creates reader/writer pairs for each table to be processed. There can be executed serially, one table at a time, 
  ** on in parallel allowing multiple tables to be processed simultaneously. Serial readers and writers share a database connection with the DBReader and DBWriter. Parallel readers and writers are allocated a
  ** dedicated database connection. 
  **
  ** When processing a file, which, by its very nature is serial, the DBReader generates the data as well as the metadata. When the DBReader recieves the ddlComplete notifciation switches the DBReader pipe 
  ** switches the pipe to 
  **
  ** When reading data from a file the JSON Parser (TextParser or HTMLParser) is the event source. The parser sends the data directly to the DBWriter, bypassing the DBReader. 
  ** The 'systemInformation', 'ddl' and 'metadata' events are processed directly by the DBWriter. Since parallelism is not possible with a sequential event source, 
  ** such as a file or HTML stream, a single worker processes all the data sent by the parser. The event stream automatically switches from the DBWriter to the Worker
  ** when the DBWriter emits the 'ddlComplete' event.
  **
  ** When the parser reaches the end of the file it emits an 'eof' event. When the worker recieves the 'eof' event it invokes it's end() method. This causes the _final()
  ** method to be to be executed  and a 'workerComplete' message is sent to the DBWriter before the worker shuts down. 
  **
  ** Once the DBWriter has received 'workerComplete' messages from all workers, it emits a 'dataComplete' event.
  **
  ** When the DBReader receives the 'dataComplete' notification it finalizes the export, releasing all resources. 
  **
  ** For a parallel event source, such as a database, where the DBReader controls the event flow, the DBReaders pushes an 'exportComplete' message into the pipe and then
  ** sets nextPhase to 'done' so that the DBReader is destroyed on the next '_read' event.
  **
  ** For a sequential event source, the DBReader is not the event source so the 'exportComplete' message is generated by invoking the exportComplete() method on the underlying DBI.
  ** 
  ** When the DBWriter receives the 'exportComplete' message it releases all of it's resources and invokes it's end() method. This causes the DBWriters '_final()' method 
  ** to be executed and a 'close' event to be emitted by the DBWriter. 
  ** 
  ** When the Yadamu data pump receives notification of the 'close' event it resolves the promise that wraps the DBReader -> DBWriter pipe operation.
  **
  */

  constructor(dbi,yadamuLogger,options) {

    super({objectMode: true });  
 
    this.dbi = dbi;
    this.status = dbi.yadamu.STATUS
    this.yadamuLogger = yadamuLogger;
    this.yadamuLogger.info([`Reader`,dbi.DATABASE_VENDOR,dbi.DB_VERSION,this.dbi.MODE,this.dbi.getWorkerNumber()],`Ready.`)
  
    this.metadata = undefined
    this.schemaInfo = [];
  
    this.nextPhase = 'systemInformation'
    this.dbWriter = undefined;
	
	this.dataComplete = undefined;
    this.copyStarted = false
    this.copyComplete = false
	
  }

  copyInProgress() {
	return this.copyStarted && !this.copyComplete
  }

  isDatabase() {
    return this.dbi.isDatabase()
  }
    
  
  pipe(outputStream,options) {
	this.dbWriter = outputStream
	return super.pipe(outputStream,options);
  } 
  
  async initialize() {
	await this.dbi.initializeExport() 
  }
  
  async getSystemInformation(version) {
    return this.dbi.getSystemInformation(version)
  }
  
  async getDDLOperations() {
	const startTime = performance.now();
    const ddl = await this.dbi.getDDLOperations()
	if (ddl !== undefined) {
      this.yadamuLogger.ddl([this.dbi.DATABASE_VENDOR],`Generated ${ddl.length} DDL statements. Elapsed time: ${YadamuLibrary.stringifyDuration(performance.now() - startTime)}s.`);
	}
	return ddl
  }
  
  async getMetadata() {
      
     const startTime = performance.now();
     this.schemaInfo = await this.dbi.getSchemaInfo('FROM_USER')
     this.yadamuLogger.ddl([this.dbi.DATABASE_VENDOR],`Generated metadata for ${this.schemaInfo.length} tables. Elapsed time: ${YadamuLibrary.stringifyDuration(performance.now() - startTime)}s.`);
     return this.dbi.generateMetadata(this.schemaInfo)
  }
 
  async pipelineTable(task,readerDBI,writerDBI) {
	 
    let tableInfo
	let mappedTableName
	let tableOutputStream
	let copyComplete

	const yadamuPipeline = []
	let streamEnded
	let streamFailed
   
    try {
      tableInfo = readerDBI.generateQueryInformation(task)
  
	  const inputStreams = await readerDBI.getInputStreams(tableInfo)
      yadamuPipeline.push(...inputStreams)
      mappedTableName = writerDBI.transformTableName(task.TABLE_NAME,readerDBI.getInverseTableMappings())
	  const outputStreams = await writerDBI.getOutputStreams(mappedTableName,this.dbWriter.ddlComplete)
	  yadamuPipeline.push(...outputStreams)

      /*
	  **
	  **  Event Tracing
	  **
	  
	  streamEnded = new Array(yadamuPipeline.length).fill(false);
      streamFailed = new Array(yadamuPipeline.length).fill(undefined);
      yadamuPipeline.forEach((s,idx) => {
		s.once('end',() => {
		  console.log(s.constructor.name,'end')
		  streamEnded[idx] = true
	    }).once('finish', (err) => {
		  console.log(s.constructor.name,'finish')
		  streamEnded[idx] = true
	    }).once('close', (err) => {
		  console.log(s.constructor.name,'close')
	    }).once('error', (err) => {
		  // console.log(s.constructor.name,'error',err)
		  console.log(s.constructor.name,'error',err.message)
		  streamFailed[idx] = err
		})
	  })

      **
	  */

      tableOutputStream = outputStreams[0]
      tableOutputStream.setReaderMetrics(readerDBI.INPUT_METRICS)
	  copyComplete = new Promise((resolve,reject) => {
		const target = outputStreams[outputStreams.length-1]
	    target.once('finish',() => {
		  resolve(true)
	    })
	    target.once('error',(err) => {
		  reject(err)
	    })
	  })
    } catch (e) {
      this.yadamuLogger.handleException(['PIPELINE','STREAM INITIALIZATION',task.TABLE_NAME,readerDBI.DATABASE_VENDOR,writerDBI.DATABASE_VENDOR],e)
      throw (e)
    }
	
    let cause
	let stream
    let errorDBI

	try {
	  // this.yadamuLogger.trace([this.constructor.name,'PIPELINE',mappedTableName,readerDBI.DATABASE_VENDOR,writerDBI.DATABASE_VENDOR],`${yadamuPipeline.map((proc) => { return proc.constructor.name }).join(' => ')}`)
      readerDBI.INPUT_METRICS.pipeStartTime = performance.now();
	  
	  if (writerDBI.PIPELINE_OPERATION_HANGS) {
  	    // For some reason pipelines built using the LoaderDBI never terminate, even though the lasst component in the pipeline emits it's 'close' event.
		// Dont' rely of the pipleine complete
	    await new Promise(async (resolve,rejct) => {
		  const target = yadamuPipeline[yadamuPipeline.length-1]
		  target.once('close',() => {
  	        // this.yadamuLogger.trace([this.constructor.name,'PIPELINE','CLOSE',mappedTableName,readerDBI.DATABASE_VENDOR,writerDBI.DATABASE_VENDOR],`${yadamuPipeline.map((proc) => { return `${proc.constructor.name}:${proc.destroyed}`}).join(' => ')}`)
		    resolve(true)
	      })
		  try {
	        await pipeline(yadamuPipeline)
		    this.yadamuLogger.trace(['PIPELINE',mappedTableName,readerDBI.DATABASE_VENDOR,writerDBI.DATABASE_VENDOR,'SUCCESS'],'### LoaderDBI based pipeline completed ###')
			resolve(true)
		  } catch (e) {
		    this.yadamuLogger.trace(['PIPELINE',mappedTableName,readerDBI.DATABASE_VENDOR,writerDBI.DATABASE_VENDOR,'FAILED'],`### LoaderDBI based pipeline failed ${e.message} ###`)
			reject (e)
		  }
	    })
	  }
	  else {
        await pipeline(yadamuPipeline)
	  }	  
	  
	  readerDBI.INPUT_METRICS.pipeEndTime = performance.now();
      // this.yadamuLogger.trace([this.constructor.name,'PIPELINE',mappedTableName,readerDBI.DATABASE_VENDOR,writerDBI.DATABASE_VENDOR,'SUCCESS'],copyComplete)
      return copyComplete
    } catch (e) {
	  // If the pipeline operation throws 'ERR_STREAM_PREMATURE_CLOSE' get the underlying cause from the outputStream;
  	  if ((e.code === 'ERR_STREAM_PREMATURE_CLOSE') && (tableOutputStream.underlyingError instanceof Error)) {
		e = tableOutputStream.underlyingError
	  }
	  // this.yadamuLogger.trace([this.constructor.name,'PIPELINE',mappedTableName,readerDBI.DATABASE_VENDOR,writerDBI.DATABASE_VENDOR],`${yadamuPipeline.map((proc) => { return `${proc.constructor.name}:${proc.destroyed}` }).join(' => ')}`)

      cause = e
	  stream = 'WRITER'
      errorDBI = writerDBI
       
      if (!((e instanceof DatabaseError) || (e instanceof IterativeInsertError))) {
		// yadamuPipeline.forEach((s,i) => { console.log(i,s.constructor.name); if (s.dbi ) console.log(s.dbi.firstError, s.dbi.latestError)})
        // ### "Quack Quack" ### Need a better method to determine whether the reader or writer is responsible for the error.. 
        // When an error occurs pipeline activates the on error events for all of the streams in the pipline
        // Reader Errors are surfaced as raw database errors and need to be wrapped with the approiate Yadamu Error class.
        // Writer Errors are handled inside the Yadamu Writer instance and are wrapped in the approriate Yadamu Error class prior to being surfaced
        // this.yadamuLogger.warning([`${+this.constructor.name}`,`${tableInfo.TABLE_NAME}`],`Reader failed at row: ${parser.getCounter()+1}.`)
        stream = 'READER'
    	errorDBI = readerDBI
        cause = readerDBI.streamingError(e,tableInfo.SQL_STATEMENT)
		// Ensure original error is processed before attempting reconection.
        this.yadamuLogger.handleException(['PIPELINE','STREAM READER',mappedTableName,readerDBI.DATABASE_VENDOR,writerDBI.DATABASE_VENDOR],cause)
        if ((YadamuConstants.CONTINUE_PROCESSING.includes(readerDBI.yadamu.ON_ERROR))  && cause.lostConnection()) {
          // Re-establish the input stream connection 
   		  await readerDBI.reconnect(cause,'READER')
        }
      }		
	  else {		  
        this.yadamuLogger.handleException(['PIPELINE','STREAM READER',mappedTableName,readerDBI.DATABASE_VENDOR,writerDBI.DATABASE_VENDOR],cause)
	  }
	  
      // ABORT processing of the current table if ON_ERROR handling is ABORT or SKIP 
      if (YadamuConstants.ABORT_CURRENT_TABLE.includes(writerDBI.yadamu.ON_ERROR)) {
		tableOutputStream.abortTable();
      } 
	  
	  // ABORT processing of all tables if the ddl phase did not complete successfully
	  // this.yadamuLogger.trace([this.constructor.name,'DLL_COMPLETE',this.dbi.getWorkerNumber()],'WAITING')
	  await this.dbWriter.ddlComplete
      // this.yadamuLogger.trace([this.constructor.name,'DLL_COMPLETE',this.dbi.getWorkerNumber()],'PROCESSING')
	
	  // Clean up the current table. Among other things this will flush any pending records. Note if abortTable() has been called there are no pending records but there is still housekeeping required
	  await tableOutputStream.forcedEnd();
	  
	  // Throw the error if ON_ERROR handling is ABORT
      if (YadamuConstants.CONTINUE_PROCESSING.includes(errorDBI.yadamu.ON_ERROR)) {
		return copyComplete
      }
	  throw cause;
    }
  }
  
  async pipelineTables(readerDBI,writerDBI) {
	if (this.schemaInfo.length > 0) {
      this.yadamuLogger.info(['PIPELINE','SEQUENTIAL',readerDBI.DATABASE_VENDOR,writerDBI.DATABASE_VENDOR],`Processing Tables`);
	  for (const task of this.schemaInfo) {
        if (task.INCLUDE_TABLE === true) {
	      try {
            await this.pipelineTable(task,readerDBI,writerDBI)
	      } catch (cause) {
	        // this.yadamuLogger.trace(['PIPELINE','SEQUENTIAL',readerDBI.DATABASE_VENDOR,writerDBI.DATABASE_VENDOR],cause)
	        this.yadamuLogger.handleException(['PIPELINE','SEQUENTIAL',readerDBI.DATABASE_VENDOR,writerDBI.DATABASE_VENDOR],cause)
		    // Throwing here raises 'ERR_STREAM_PREMATURE_CLOSE' on the Writer. Cache the cause 
			this.underlyingError = cause;
            throw(cause)
          }
	    }
	  }
    }
  }
  	
  async pipelineTablesToFile(readerDBI,writerDBI) {
	

    try {
  	  await this.dbWriter.ddlComplete
  	  const tableManager = new TableManager(readerDBI,writerDBI,this.schemaInfo,0,this.yadamuLogger,readerDBI.INPUT_METRICS,[],{})
      this.yadamuLogger.info(['RECURSIVE',readerDBI.DATABASE_VENDOR,writerDBI.DATABASE_VENDOR],`Processing Tables`);
	  const yadamuPipeline = await tableManager.constructPipline(0);
	  yadamuPipeline.push(writerDBI.PIPELINE_ENTRY_POINT)
	  // this.yadamuLogger.trace([this.constructor.name,'EXPORT',this.dbi.DATABASE_VENDOR,this.dbi.parameters.FROM_USER,writerDBI.PIPELINE_ENTRY_POINT.constructor.name,writerDBI.PIPELINE_ENTRY_POINT.writableEnded],`Attaching Pipeline`)
	  pipeline(yadamuPipeline); 
	  await writerDBI.pipelineComplete;
      // this.yadamuLogger.trace([this.constructor.name,'EXPORT',this.dbi.DATABASE_VENDOR,this.dbi.parameters.FROM_USER],'SUCCESS')
    } catch (cause) {
      // Throwing here raises 'ERR_STREAM_PREMATURE_CLOSE' on the Writer. Cache the cause 
	  this.underlyingError = cause;
      this.yadamuLogger.handleException(['EXPORT',this.dbi.DATABASE_VENDOR,this.dbi.parameters.FROM_USER,readerDBI.yadamu.ON_ERROR],cause)
   	  throw cause;
    }
    
  }

  async generateStatementCache(metadata) {
    if (!YadamuLibrary.isEmpty(metadata)) {   
      // ### if the import already processed a DDL object do not execute DDL when generating statements.
      Object.keys(metadata).forEach((table) => {
         metadata[table].vendor = this.dbi.systemInformation.vendor;
      })
    }
    this.dbi.setMetadata(metadata)      
    await this.dbi.generateStatementCache('%%SCHEMA%%',false)
  }
  
  getInputStreams() {
	  
	/*
	**
	** For a database the DBReader class is repsonsible for generating the events in the required order. This is handled via the 'nextPhase' setting in the _read method.
	** Thus the DBReader becomes the event stream.
	**
	** For a File the events are generated according to the contents of the file.
	** The file parser becomes the event stream.
	*/
	
    if (this.dbi.isDatabase()){
      return [this]
    }
    else {
	  return this.dbi.getInputStreams()
    }

  }
 
  async _read() {
    try {
 	  // this.yadamuLogger.trace([this.constructor.name,`_READ()`,this.dbi.DATABASE_VENDOR],this.nextPhase)
      switch (this.nextPhase) {
         case 'systemInformation' :
           const systemInformation = await this.getSystemInformation();
		   // Needed in case we have to generate DDL from the system information and metadata.
           this.dbi.setSystemInformation(systemInformation);
		   this.dbi.yadamu.REJECTION_MANAGER.setSystemInformation(systemInformation)
		   this.dbi.yadamu.WARNING_MANAGER.setSystemInformation(systemInformation)
           this.push({systemInformation : systemInformation});
           if (this.dbi.MODE === 'DATA_ONLY') {
             this.nextPhase = 'metadata';
           }
           else { 
             this.nextPhase = 'ddl';
           }
           break;
         case 'ddl' :
           let ddl = await this.getDDLOperations();
           if (ddl === undefined) {
             // Database does not provide mechansim to retrieve DDL statements used to create a schema (eg Oracle's DBMS_METADATA package)
             // Reverse Engineer DDL from metadata.
             this.metadata = await this.getMetadata();
             await this.generateStatementCache(this.metadata)
             ddl = Object.values(this.dbi.statementCache).map((table) => {
               return table.ddl
             })
           } 
           this.push({ddl: ddl});
		   this.nextPhase = 'metadata';
           break;
         case 'metadata' :
           this.metadata = this.metadata ? this.metadata : await this.getMetadata();
           this.push({metadata: this.dbi.transformMetadata(this.metadata,this.dbi.inverseTableMappings)});
		   this.dbi.yadamu.REJECTION_MANAGER.setMetadata(this.metadata)
		   this.dbi.yadamu.WARNING_MANAGER.setMetadata(this.metadata)
		   this.nextPhase = ((this.dbi.MODE === 'DDL_ONLY') || (this.schemaInfo.length === 0)) ? 'exportComplete' : 'copyData';
		   break;
		 case 'copyData':
   	 	   this.copyStarted = true;
           this.dataComplete = new Promise((resolve,reject) => {
             this.once('dataComplete',(status) => {
               // this.yadamuLogger.trace([this.constructor.name],`${this.constructor.name}.on(dataComplete): (${status instanceof Error}) "${status ? `${status.constructor.name}(${status.message})` : status}"`)
               this.copyComplete = true
           	   if (status instanceof Error) reject(status)
           	   resolve(true);
             })
           })	
           if (this.dbWriter.dbi.isDatabase()) {
		     await this.pipelineTables(this.dbi,this.dbWriter.dbi);
	       }
	       else {
	         await this.pipelineTablesToFile(this.dbi,this.dbWriter.dbi);
           }
		   this.emit('dataComplete')
		   // No 'break' - fall through to 'exportComplete'.
		 case 'exportComplete':
	       // this.yadamuLogger.trace([this.constructor.name,'DLL_COMPLETE',this.dbi.getWorkerNumber()],'WAITING')
	       await this.dbWriter.ddlComplete
           // this.yadamuLogger.trace([this.constructor.name,'DLL_COMPLETE',this.dbi.getWorkerNumber()],'PROCESSING')
		   this.dbWriter.callDeferredCallback()
		   this.push(null);
		   break;
	    default:
      }
    } catch (cause) {
	  // Don't pass the error to dataComplete or we get unhandled exceptions from the throw...
  	  this.emit('dataComplete');
	  this.yadamuLogger.handleException([`READER`,this.dbi.DATABASE_VENDOR,`_READ(${this.nextPhase})`,this.dbi.yadamu.ON_ERROR],cause);
	  this.underlyingError = cause;
	  await this.dbi.releasePrimaryConnection();
      this.destroy(cause)
    }
  }  
   
  async _destroy(cause,callback) {
    // this.yadamuLogger.trace([this.constructor.name,this.dbi.isDatabase()],'_destroy()')
    try {
      await this.dbi.finalizeExport();
	  await this.dbi.releasePrimaryConnection();
	  callback()
	} catch (e) {
      if (cause instanceof DatabaseError && cause.lostConnection()) {
        callback(cause)
	  }
	  else {
        this.yadamuLogger.handleException([`READER`,this.dbi.DATABASE_VENDOR,`_DESTROY()`,this.dbi.yadamu.ON_ERROR],e);		
        callback(e)
      }
    }
  }
  
}

module.exports = DBReader;