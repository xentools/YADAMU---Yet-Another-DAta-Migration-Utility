"use strict" 

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { performance } = require('perf_hooks');

const {finished, Readable, PassThrough} = require('stream')
const {pipeline} = require('stream/promises')
const { createGzip, createGunzip, createDeflate, createInflate } = require('zlib');

/*
**
** Obtain YADAMU_DBI_PARAMETERS and YADAMU_CONFIGURATION directly from YadamuConstants to avoid circular depandancy between FileDBI.js and Yadamu.js. 
** Importing Yadamu into FileDBI sets up a circular dependancy that causes deferred resolution of Yadamu class. This means attempts to refereence
** static GETTER methods result in undefined values.
**

const Yadamu = require('../../common/yadamu.js');

**
*/
const YadamuConstants = require('../../common/yadamuConstants.js');
const YadamuLibrary = require('../../common/yadamuLibrary.js');
const YadamuDBI = require('../../common/yadamuDBI.js');
const DBIConstants = require('../../common/dbiConstants.js');
const JSONParser = require('./jsonParser.js');
const EventStream = require('./eventStream.js');
const JSONWriter = require('./jsonWriter.js');
const {FileError, FileNotFound, DirectoryNotFound} = require('./fileException.js');


/*
**
** YADAMU Database Inteface class skeleton
**
*/

class TableSwitcher extends PassThrough {

  constructor() {
	super()
  }
  
  pipe(os,options) {
    options = options || {}
	options.end = false;
	return super.pipe(os,options)
  }
  
  _transform(data,enc,callback) {
    this.push(data)
    callback()
  }
 
}

class FirstTableSwitcher extends TableSwitcher {

  constructor(exportFileHeader) {
	super()
    this.push(exportFileHeader) 
  }
 
}

class EndExportOperation extends Readable {

  constructor(exportFileFooter) {
	super()
    this.push(exportFileFooter) 
  }

  _read() {
   this.push(null)
  }
 
}

class IVWriter extends PassThrough {

  constructor(iv) {
	super()
	this.push(iv)
  }
    
}

class IVReader extends PassThrough {

  constructor(ivLength) {
	super()
	this.ivLength = ivLength
  }
   
  passthrough = (data,enc,callback) => {
    this.push(data)
    callback()
  }
  
  extractIV = (data,enc,callback) => {
	this.iv = Buffer.from(data,0,this.ivLength)
    this.push(data.slice(this.ivLength))
	this._transform = this.passthrough
    callback()
  }
  
  getInitializationVector() {
    return this.iv
  }
  
  _transform = this.extractIV
    
}

class FileDBI extends YadamuDBI {
 
  /*
  **
  ** !!! For the FileDBI an export operaton involves reading data from the file system and an Import operation involves writing data to the file system !!!
  **
  */

  static get DATABASE_KEY()          { return 'file' };
  static get DATABASE_VENDOR()       { return 'YABASC' };
  static get SOFTWARE_VENDOR()       { return 'YABASC - Yet Another Bay Area Software Compsny'};

  static #_YADAMU_DBI_PARAMETERS

  static get YADAMU_DBI_PARAMETERS()  {
	this.#_YADAMU_DBI_PARAMETERS = this.#_YADAMU_DBI_PARAMETERS || Object.freeze(Object.assign({},DBIConstants.YADAMU_DBI_PARAMETERS,YadamuConstants.YADAMU_CONFIGURATION[this.DATABASE_KEY] || {}))
	return this.#_YADAMU_DBI_PARAMETERS
  }
   
  get YADAMU_DBI_PARAMETERS() {
    return FileDBI.YADAMU_DBI_PARAMETERS
  }

  get DATABASE_KEY()               { return FileDBI.DATABASE_KEY };
  get DATABASE_VENDOR()            { return FileDBI.DATABASE_VENDOR };
  get SOFTWARE_VENDOR()            { return FileDBI.SOFTWARE_VENDOR };
  
  get PARALLEL_READ_OPERATIONS()   { return false };
  get PARALLEL_WRITE_OPERATIONS()  { return false }  
  
  get COMPRESSED_FILE()            { return this.yadamu.COMPRESSION !== 'NONE' }
  get ENCRYPTED_FILE()             { return this.yadamu.ENCRYPTION }
							      
  set PIPELINE_ENTRY_POINT(v)      { this._PIPELINE_ENTRY_POINT = v }
  get PIPELINE_ENTRY_POINT()       { return this._PIPELINE_ENTRY_POINT }
							      
  set EXPORT_FILE_HEADER(v)        { this._EXPORT_FILE_HEADER = v }
  get EXPORT_FILE_HEADER()         { return this._EXPORT_FILE_HEADER }
							      
  set INITIALIZATION_VECTOR(v)     { this._INITIALIZATION_VECTOR =  v }
  get INITIALIZATION_VECTOR()      { return this._INITIALIZATION_VECTOR }
  get IV_LENGTH()                  { return 16 }  
    
  get DIRECTORY()  { return this._DIRECTORY }
  set DIRECTORY(v) { this._DIRECTORY = v };
    
  get FILE()                     {

    /*
	**
	** Rules for File Location are as follows
	**
	
	Parameter FILE is absolute: FILE
    OTHERWISE: 
	
	  Parameter DIRECTORY is not supplied: conn:directory/FILE
	  OTHERWISE
    
        Paramter DIRECTORY is absolute: DIRECTORY/FILE
	    OTHERWISE: conn:directory/DIRECTORY/FILE
	
	**
	*/
	
    return this._FILE || (() => {
	  let file =  this.parameters.FILE || 'yadamu.json'
      if (!path.isAbsolute(file)) {
	  if (this.DIRECTORY) {
          if (path.isAbsolute(this.DIRECTORY)) {
			file = path.join(this.DIRECTORY,file)
          }
          else {
            file = path.join(this.vendorProperties.directory,this.DIRECTORY,file)
          }
		}
        else {
          file = path.join(this.vendorProperties.directory  || '',file)
		}
	  }
	  file = (this.COMPRESSED_FILE && (!file.endsWith('.gz'))) ? `${file}.gz` : file
	  file = YadamuLibrary.macroSubstitions(file,this.yadamu.MACROS)
	  this._FILE = path.resolve(file)
	  return this._FILE
    })()
  }
  
  set FILE(v)           { this._FILE = v }
  
  constructor(yadamu,settings,parameters) {
    super(yadamu,settings,parameters)
    this.outputStream = undefined;
    this.inputStream = undefined;
	this.firstTable = true;
	this.ddl = undefined;
	this.baseDirectory = path.resolve(this.vendorProperties.directory || "")
  }

  setDescription(description) {
    this.DESCRIPTION = description.indexOf(this.baseDirectory) === 0 ? description.substring(this.baseDirectory.length+1) : description
  }

  generateStatementCache() {
	this.statementCache = {}
  }
      
  executeDDL(ddl) {
	this.ddl = ddl
    return ddl
  }
  
  updateVendorProperties(vendorProperties) {

  // vendorProperties.directory   = this.parameters.DIRECTORY || vendorProperties.directory 

  }
  
  exportComplete(message) {
	this.eventManager.exportComplete(message);
  }
  
  closeInputStream() {      
    this.inputStream.close();
  }

  closeOutputStream() {
    this.outputStream.close();
  }
  
  // Override YadamuDBI - Any DDL is considered valid and written to the export file.
 
  isValidDDL() {
    return true;
  }
  
  // Override YadamuDBI
  
  isDatabase() {
    return false;
  }
  
  // Override YadamuDBI

  objectMode() {
     return false;  
  }

  getMetadata() {
	return []
  }
  
  getSystemInformation() {
	return Object.assign(
	  super.getSystemInformation()
	, {}
    )
  }

  setSystemInformation(systemInformation) {
	super.setSystemInformation(systemInformation) 
  }
    
  setMetadata(metadata) {
    // Object.values(metadata).forEach((table) => {delete table.source})
	super.setMetadata(metadata)
  }
 
  releaseConnection() {
  }
 
  initialize() {
    
    super.initialize(false);
	
  }

  createInputStream() {
    return new Promise((resolve,reject) => {
      this.inputStream = fs.createReadStream(this.FILE);
	  const stack = new Error().stack
      this.inputStream.on('open',() => {resolve()}).on('error',(err) => {reject(err.code === 'ENOENT' ? new FileNotFound(err,stack,this.FILE) : new FileError(err,stack,this.FILE) )})
    })
  }
  
  async initializeExport() {

    // For FileDBI Import is Reading data from the file system.
	this.DIRECTORY = this.SOURCE_DIRECTORY
	
	// this.yadamuLogger.trace([this.constructor.name],`initializeExport()`)
	super.initializeExport();
	this.setDescription(this.FILE)
	
	if (this.ENCRYPTED_FILE) {
      await this.loadInitializationVector();
    }

	await this.createInputStream()
  }

  finalizeExport() {
 	// this.yadamuLogger.trace([this.constructor.name,],'finalizeExport()')
	this.closeInputStream()
  }
  
  async createInitializationVector() {

	this.INITIALIZATION_VECTOR = await new Promise((resolve,reject) => {
      crypto.randomFill(new Uint8Array(this.IV_LENGTH), (err, iv) => {
		if (err) reject(err)
	    resolve(iv);
      })
	})	    
  } 
  
  createOutputStream() {
    return new Promise((resolve,reject) => {
      this.outputStream = fs.createWriteStream(this.FILE,{flags :"w"})
	  const stack = new Error().stack
      this.outputStream.on('open',() => {resolve()}).on('error',(err) => {reject(err.code === 'ENOENT' ? new DirectoryNotFound(err,stack,this.FILE) : new FileError(err,stack,this.FILE) )})
	})
  }

  getFileOutputStream(tableName) {
    return this.outputStream
  }

  createOutputStreams() {

    this.outputStreams = []
	
    if (this.COMPRESSED_FILE) {
      this.outputStreams.push(this.yadamu.COMPRESSION === 'GZIP' ? createGzip() : createDeflate())
    }
	
    if (this.ENCRYPTED_FILE) {
  	  // console.log('Cipher',this.yadamu.CIPHER,this.yadamu.ENCRYPTION_KEY,this.INITIALIZATION_VECTOR);
	  const cipherStream = crypto.createCipheriv(this.yadamu.CIPHER,this.yadamu.ENCRYPTION_KEY,this.INITIALIZATION_VECTOR)
	  this.outputStreams.push(cipherStream)
	  this.outputStreams.push(new IVWriter(this.INITIALIZATION_VECTOR))
	}
	
	this.outputStreams.push(this.getFileOutputStream())
	
    // this.outputStreams.forEach((s) => { console.log(s.constructor.name, s.eventNames().map((e) => {return `"${e}(${s.listenerCount(e)})"`}).join(','))})
	
	// Cache the set of listeners for the outputStreams. This allows the listeners to be restored. 

	this.defaultListeners = this.outputStreams.map((s) => { 
	   const eventList = {} 
	   s.eventNames().forEach((e) => { eventList[e] = s.listeners(e)})
	   return eventList
	 })
	 
  }

  checkDirectory() {
  }
	 
  
  async initializeImport() {

    // For FileDBI Import is Writing data to the file system.
	// this.yadamuLogger.trace([this.constructor.name],`initializeImport()`)
		
	this.DIRECTORY = this.TARGET_DIRECTORY
	super.initializeImport()
    this.setDescription(this.FILE)

	await this.createOutputStream()
	if (this.ENCRYPTED_FILE) {
      await this.createInitializationVector();
    }
	this.createOutputStreams()
	this.PIPELINE_ENTRY_POINT = this.outputStreams[0]
    this.yadamuLogger.info([this.DATABASE_VENDOR],`Writing data to "${this.FILE}".`)
  }
  
  async initializeData() {
  
	// Set up the pipeline and write the system information, ddl and metadata sections to the pipe...
    // this.yadamuLogger.trace([this.constructor.name],`initializeData()`)

    // Remove the source structure from each metadata object prior to serializing it. Put it back after the serialization has been completed.

    const sourceInfo = {}
    Object.keys(this.metadata).forEach((key) => {if (this.metadata[key].source) sourceInfo[key] = this.metadata[key].source; delete this.metadata[key].source})
    let exportFileHeader = `{"systemInformation":${JSON.stringify(this.systemInformation)}${this.ddl ? `,"ddl":${JSON.stringify(this.ddl)}` : ''},"metadata":${JSON.stringify(this.metadata)}`
	Object.keys(sourceInfo).forEach((key) => {this.metadata[key].source = sourceInfo[key]})

    if ((this.MODE === 'DDL_ONLY') || (YadamuLibrary.isEmpty(this.metadata))) {
	  const exportFileContents = `${exportFileHeader}}`
      const finalize = new EndExportOperation(exportFileContents)
      await pipeline(finalize,...this.outputStreams)
	}
    else {
	  exportFileHeader = `${exportFileHeader},"data":{` 
	} 
	 
	this.EXPORT_FILE_HEADER = exportFileHeader
	
  }

  traceStreamEvents(streams) {

    // Add event tracing to the streams
	  
	streams[0].once('readable',() => {
	  console.log(streams[0].constructor.name,'readable')
	})
	
    streams.forEach((s,idx) => {
	  s.once('end',() => {
	     console.log(s.constructor.name,'end')
	  }).once('finish', (err) => {
	    console.log(s.constructor.name,'finish')
	  }).once('close', (err) => {
        console.log(s.constructor.name,'close')
	  }).once('error', (err) => {
        console.log(s.constructor.name,'error',err.message)
      })
	})
  }
  
  async finalizeData() {
    
	// this.yadamuLogger.trace([this.constructor.name],`finalizeData(${YadamuLibrary.isEmpty(this.metadata)})`)
	
	if (!YadamuLibrary.isEmpty(this.metadata)) {
      const finalize = new EndExportOperation('}}')
	  // Restore the default listeners to the outputStreams
      // this.traceStreamEvents([finalize,...this.outputStreams])
	  this.outputStreams.forEach((s,i) => { 
	    if (!YadamuLibrary.isEmpty(this.defaultListeners[i])) {
		  Object.keys(this.defaultListeners[i]).forEach((e) => {this.defaultListeners[i][e].forEach((l) => {s.on(e,l)})})
		}
	  })
      await pipeline(finalize,...this.outputStreams)
    }
  }
	
  finalizeImport() {}

    
  finalize() {
    if (this.inputStream !== undefined) {
      this.closeInputStream()
    }
  }

  /*
  **
  **  Abort the database connection.
  **
  */

  abort(e) {

    try {
      if (this.inputStream !== undefined) {
        this.closeInputStream()
	  }
    } catch (err) {
      this.yadamuLogger.handleException([`${this.DATABASE_VENDOR}`,'ABORT','InputStream'],err);
    }
	 
    try {
      if (this.outputStream !== undefined) {
        this.closeOutputStream()
	  }
    } catch (err) {
      this.yadamuLogger.handleException([`${this.DATABASE_VENDOR}`,'ABORT','OutputStream'],err);
    }
  }

  /*
  **
  **  Generate a set of DDL operations from the metadata generated by an Export operation
  **
  */
      
   generateStatementCache(schema,executeDDL) {
    this.statementCache = []
	return this.statementCache
  }

  getDDLOperations() {
    return []
  }
  
  
  getSchemaInfo(schema) {
    return []
  }
  
  getTableInfo(tableName) {
	
    if (tableName === null) {
	  // Hack to enable statisticsCollector to use the YadamuWriter interface to collect statistics about the cotnents of a YADAMU export file...
      return {}
    }

    if (this.metadata === undefined) {
      this.yadamuLogger.logInternalError([this.constructor.name,`getTableInfo()`,tableName],`Metadata undefined. Cannot obtain required information.`)
	}

	if (this.metadata[tableName] === undefined) {
      this.yadamuLogger.logInternalError([this.constructor.name,`getTableInfo()`,tableName],`No metadata entry for "${tableName}". Current entries: ${JSON.stringify(Object.keys(this.metadata))}`)
	}

	// ### Need to simplify and standardize DataTypes - Data type mapping for Files.. 
	
	// Include a dummy dataTypes array of the correct length to ensure the column count assertion does not throw
	return { 
	  tableName         : tableName
	, _SPATIAL_FORMAT   : this.systemInformation.typeMappings.spatialFormat 
    , columnNames       : [... this.metadata[tableName].columnNames]
    , targetDataTypes   : [... this.metadata[tableName].dataTypes]
    }
  }

  getInputStream() {  
    // Return the inputStream and the transform streams required to process it.
    const stats = fs.statSync(this.FILE)
    const fileSizeInBytes = stats.size
    this.yadamuLogger.info([this.DATABASE_VENDOR],`Processing file "${this.FILE}". Size ${fileSizeInBytes} bytes.`)
	return this.inputStream
  }
  
  async loadInitializationVector() {

    let cause	  
	try {
      cause = new FileError(new Error(`Unable to load Initialization Vector from "${this.FILE}".`))
	  const fd = await fsp.open(this.FILE)
      const iv = new Uint8Array(this.IV_LENGTH)
	  const results = await fd.read(iv,0,this.IV_LENGTH,0)
	  this.INITIALIZATION_VECTOR = iv;
	  await fd.close();
	} catch (e) {
	  cause.cause = e
	  throw cause
    }
	
  }	
	  
  getInputStreams() {
	const streams = []
	this.INPUT_METRICS = DBIConstants.NEW_TIMINGS
	this.INPUT_METRICS.DATABASE_VENDOR = this.DATABASE_VENDOR
	const is = this.getInputStream();
	is.once('readable',() => {
	  this.INPUT_METRICS.readerStartTime = performance.now()
	}).on('error',(err) => { 
      this.INPUT_METRICS.readerEndTime = performance.now()
	  this.INPUT_METRICS.readerError = err
	  this.INPUT_METRICS.failed = true
    }).on('end',() => {
      this.INPUT_METRICS.readerEndTime = performance.now()
    })
	streams.push(is)
	
	if (this.ENCRYPTED_FILE) {
	  streams.push(new IVReader(this.IV_LENGTH))
  	  // console.log('Decipher',this.yadamu.CIPHER,this.yadamu.ENCRYPTION_KEY,this.INITIALIZATION_VECTOR);
	  const decipherStream = crypto.createDecipheriv(this.yadamu.CIPHER,this.yadamu.ENCRYPTION_KEY,this.INITIALIZATION_VECTOR)
	  streams.push(decipherStream);
	}

	if (this.COMPRESSED_FILE) {
      streams.push(this.yadamu.COMPRESSION === 'GZIP' ? createGunzip() : createInflate())
	}
	
	const jsonParser = new JSONParser(this.yadamuLogger, this.MODE, this.FILE)
	jsonParser.once('readable',() => {
	  this.INPUT_METRICS.parserStartTime = performance.now()
	}).on('error',(err) => { 
      this.INPUT_METRICS.parserEndTime = performance.now()
	  this.INPUT_METRICS.parserError = err
	  this.INPUT_METRICS.failed = true
    })
	streams.push(jsonParser);
	
	const eventStream = new EventStream(this.yadamu)
	eventStream.on('error',(err) => { 
      this.INPUT_METRICS.parserEndTime = performance.now()
	  this.INPUT_METRICS.parserError =
	  err
	  this.INPUT_METRICS.failed = true
    }).on('end',() => {
      this.INPUT_METRICS.parserEndTime = performance.now()
    })
	streams.push(eventStream)

    // console.log(streams.map((s) => { return s.constructor.name }).join(' ==> '))
	return streams;
  }

  getOutputStream(tableName,ddlComplete) {
    // Override parent method to allow output stream to be passed to worker
    // this.yadamuLogger.trace([this.constructor.name],`getOutputStream(${tableName},${this.firstTable})`)
	const os =  new JSONWriter(this,tableName,ddlComplete,this.firstTable,this.status,this.yadamuLogger)
	return os
  }
      
  getOutputStreams(tableName) {

    const outputStreams = []

    // Create a JSON Writer
    const jsonWriter = this.getOutputStream(tableName,undefined)
    outputStreams.push(jsonWriter)
	 
    // The TableSwitcher is used to prevent 'end' events propegating to the output stream
    const tableSwitcher = this.firstTable ? new FirstTableSwitcher(this.EXPORT_FILE_HEADER) : new TableSwitcher() 
    outputStreams.push(tableSwitcher)
	
	outputStreams.push(...this.outputStreams)
	this.firstTable = false;
    // console.log(outputStreams.map((s) => { return s.constructor.name }).join(' ==> '))
    return outputStreams	
	
  }
  
  async createCloneStream(options) {
	await this.initialize()
	const streams = []
	await this.createInputStream();
	streams.push(this.inputStream)
	
	if (options.encryptedInput) {
	  await this.loadInitializationVector();
	  streams.push(new IVReader(this.IV_LENGTH))
	  const decipherStream = crypto.createDecipheriv(this.yadamu.CIPHER,this.yadamu.ENCRYPTION_KEY,this.INITIALIZATION_VECTOR)
	  streams.push(decipherStream);
	}
	
	if (options.compressedInput) {
      streams.push(this.yadamu.COMPRESSION === 'GZIP' ? createGunzip() : createInflate())
	}
      
	if (options.compressedOutput) {
      streams.push(this.yadamu.COMPRESSION === 'GZIP' ? createGzip() : createDeflate())
	}
	
	if (options.encryptedOutput) {
  	  await this.createInitializationVector()
	  const cipherStream = crypto.createCipheriv(this.yadamu.CIPHER,this.yadamu.ENCRYPTION_KEY,this.INITIALIZATION_VECTOR)
	  streams.push(cipherStream)
	  streams.push(new IVWriter(this.INITIALIZATION_VECTOR))
	}

    const outputFilePath = path.resolve(options.filename);
	const inputFilePath = this.FILE;
    this.FILE = outputFilePath
	await this.createOutputStream();
	streams.push(this.outputStream)
	this.yadamuLogger.info([this.DATABASE_VENDOR,options.encryptedInput ? 'DECRYPT' : 'ENCRYPT'],`File: "${inputFilePath}" ==> "${outputFilePath}"`)
	return streams;
  }
    
  getDatabaseConnection() { /* OVERRIDE */ }
  
  closeConnection() { /* OVERRIDE */ }
 
  
}

module.exports = FileDBI
