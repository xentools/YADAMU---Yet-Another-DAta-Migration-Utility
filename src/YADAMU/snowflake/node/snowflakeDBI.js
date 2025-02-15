"use strict" 
const fs = require('fs');
const { performance } = require('perf_hooks');

/* 
**
** Require Database Vendors API 
**
*/
const snowflake = require('snowflake-sdk');


const YadamuDBI = require('../../common/yadamuDBI.js');
const DBIConstants = require('../../common/dbiConstants.js');
const YadamuConstants = require('../../common/yadamuConstants.js');
const YadamuLibrary = require('../../common/yadamuLibrary.js')

const SnowflakeConstants = require('./snowflakeConstants.js');
const SnowflakeError = require('./snowflakeException.js')
const SnowflakeReader = require('./snowflakeReader.js');
const SnowflakeParser = require('./snowflakeParser.js');
const SnowflakeWriter = require('./snowflakeWriter.js');
const StatementGenerator = require('./statementGenerator.js');
const SnowflakeStatementLibrary = require('./snowflakeStatementLibrary.js');

class SnowflakeDBI extends YadamuDBI {

  static #_YADAMU_DBI_PARAMETERS

  static get YADAMU_DBI_PARAMETERS()  { 
	this.#_YADAMU_DBI_PARAMETERS = this.#_YADAMU_DBI_PARAMETERS || Object.freeze(Object.assign({},DBIConstants.YADAMU_DBI_PARAMETERS,SnowflakeConstants.DBI_PARAMETERS))
	return this.#_YADAMU_DBI_PARAMETERS
  }
   
  get YADAMU_DBI_PARAMETERS() {
	return SnowflakeDBI.YADAMU_DBI_PARAMETERS
  }

  // Instance level getters.. invoke as this.METHOD

  // Not available until configureConnection() has been called 
 
  // Define Getters based on configuration settings here
 
  // Override YadamuDBI

  get DATABASE_KEY()           { return SnowflakeConstants.DATABASE_KEY};
  get DATABASE_VENDOR()        { return SnowflakeConstants.DATABASE_VENDOR};
  get SOFTWARE_VENDOR()        { return SnowflakeConstants.SOFTWARE_VENDOR};
  get SQL_COPY_OPERATIONS()    { return true }
  get STATEMENT_TERMINATOR()   { return SnowflakeConstants.STATEMENT_TERMINATOR };

  // Enable configuration via command line parameters

  get SPATIAL_FORMAT()         { return this.parameters.SPATIAL_FORMAT || SnowflakeConstants.SPATIAL_FORMAT };
  
  // SNOWFLAKE XML TYPE can be set to TEXT to avoid multiple XML Fidelity issues with persisting XML data as VARIANT
  
  get SNOWFLAKE_XML_TYPE()     { return this.parameters.SNOWFLAKE_XML_TYPE || SnowflakeConstants.SNOWFLAKE_XML_TYPE }
  get SNOWFLAKE_JSON_TYPE()    { return this.parameters.SNOWFLAKE_JSON_TYPE || SnowflakeConstants.SNOWFLAKE_JSON_TYPE }

  get STAGING_PLATFORM()       { return this.parameters.STAGING_PLATFORM || VerticaConstants.STAGING_PLATFORM } 

  get SPATIAL_SERIALIZER()     { return this._SPATIAL_SERIALIZER || "ST_AsWKB"; }

  set SPATIAL_SERIALIZER(spatialFormat) {      
    switch (spatialFormat) {
      case "WKB":
        this._SPATIAL_SERIALIZER = "ST_AsWKB";
        break;
        this._SPATIAL_SERIALIZER = "ST_AsEWKB";
        break;
      case "WKT":
        this._SPATIAL_SERIALIZER = "ST_AsWKT";
        break;
      case "EWKT":
        this._SPATIAL_SERIALIZER = "ST_AsEWKT";
        break;
       case "GeoJSON":
         this._SPATIAL_SERIALIZER = "ST_AsGeoJSON"
         break;
     default:
        this._SPATIAL_SERIALIZER = "ST_AsWKB";
    }  
  }    

  constructor(yadamu,settings,parameters) {	  
    super(yadamu,settings,parameters);
	this.StatementLibrary = SnowflakeStatementLibrary
	this.statementLibrary = undefined
  }

  getSchemaIdentifer(key) {
	return `${this.parameters.YADAMU_DATABASE}"."${this.parameters[key]}`
  }  
  
  /*
  **
  ** Local methods 
  **
  */
  
  establishConnection(connection) {
      
    return new Promise((resolve,reject) => {
	  const stack = new Error().stack
      connection.connect((err,connection) => {
        if (err) {
          reject(this.trackExceptions(new SnowflakeError(err,stack,`snowflake-sdk.Connection.connect()`)))
        }
        resolve(connection);
      })
    })
  } 

  async testConnection(connectionProperties,parameters) {   
    super.setConnectionProperties(connectionProperties);
	this.setDatabase();
	try {
      let connection = snowflake.createConnection(this.vendorProperties);
      connection = await this.establishConnection(connection);
      connection.destroy()
	  super.setParameters(parameters)
	} catch (e) {
	  throw e
	}
  }
  
  async createConnectionPool() {	
  	// Snowflake-SDK does not support connection pooling
  }
  
  async useDatabase(database) {
	 await this.executeSQL(`use database "${database}"`)
  }
  
  async getConnectionFromPool() {
  	// Snowflake-SDK does not support connection pooling
  	// this.yadamuLogger.trace([this.DATABASE_VENDOR,this.getWorkerNumber()],`getConnectionFromPool()`)
    this.setDatabase();
    this.logConnectionProperties();
    let connection = snowflake.createConnection(this.vendorProperties);
    connection = await this.establishConnection(connection);
    const sqlStartTime = performance.now();
    this.traceTiming(sqlStartTime,performance.now())
    return connection
  }

  async getConnection() {
    // Get a direct connection to the database bypassing the connection pool.
    throw new Error('Unimplemented Method')
  }
  
  async configureConnection() {    

    // Perform connection specific configuration such as setting sesssion time zone to UTC...
	let results = await this.executeSQL(this.StatementLibrary.SQL_CONFIGURE_CONNECTION);
    results = await this.executeSQL(this.StatementLibrary.SQL_SYSTEM_INFORMATION,[]);    
    this._DB_VERSION = results[0].DATABASE_VERSION

    if ((this.isManager()) && (this.SNOWFLAKE_XML_TYPE !== SnowflakeConstants.SNOWFLAKE_XML_TYPE )) {
       this.yadamuLogger.info([`${this.DATABASE_VENDOR}`,`${this.DB_VERSION}`,`Configuration`],`XMLType storage model is ${this.SNOWFLAKE_XML_TYPE}.`)
    }	

    if ((this.isManager()) && (this.SNOWFLAKE_JSON_TYPE !== SnowflakeConstants.SNOWFLAKE_JSON_TYPE )) {
       this.yadamuLogger.info([`${this.DATABASE_VENDOR}`,`${this.DB_VERSION}`,`Configuration`],`XMLType storage model is ${this.SNOWFLAKE_JSON_TYPE}.`)
    }	

  }

  async closeConnection(options) {
	  
  	// this.yadamuLogger.trace([this.DATABASE_VENDOR,this.getWorkerNumber()],`closeConnection()`)
	  
    if (this.connection !== undefined && this.connection.destroy) {
      await this.connection.destroy();
	}
	
  }
	
  async closePool(options) {
  	// Snowflake-SDK does not support connection pooling
  }
    
  updateVendorProperties(vendorProperties) {

	// Convert supplied parameters to format expected by connection mechansim
	
    this.parameters.YADAMU_DATABASE = this.parameters.YADAMU_DATABASE || this.parameters.DATABASE
	
    vendorProperties.account           = this.parameters.ACCOUNT    || vendorProperties.account 
    vendorProperties.username          = this.parameters.USERNAME   || vendorProperties.username 
    vendorProperties.password          = this.parameters.PASSWORD   || vendorProperties.password  
    vendorProperties.warehouse         = this.parameters.WAREHOUSE  || vendorProperties.warehouse
    vendorProperties.database          = this.parameters.DATABASE   || vendorProperties.database   
     
  }

  executeSQL(sqlStatement,args) {
    
    let attemptReconnect = this.ATTEMPT_RECONNECTION;

    return new Promise((resolve,reject) => {

      this.status.sqlTrace.write(this.traceSQL(sqlStatement));

	  const stack = new Error().stack;
      const sqlStartTime = performance.now();
	  this.connection.execute({
        sqlText        : sqlStatement
      , binds          : args
	  , fetchAsString  : ['Number','Date','JSON']
      , complete       : async (err,statement,rows) => {
		                   const sqlEndTime = performance.now()
                           if (err) {
              		         const cause = this.trackExceptions(new SnowflakeError(err,stack,sqlStatement))
    		                 if (attemptReconnect && cause.lostConnection()) {
	      				       attemptReconnect = false
			   			       try {
                                 await this.reconnect(cause,'SQL')
                                 results = await this.executeSQL(sqlStatement,args);
							     resolve(results)
						       } catch (e) {
                                 reject(e);
                               } 							 
                             }
                             else {
                               reject(cause);
                             }
						   }
						   else {
					         // this.traceTiming(sqlStartTime,sqlEndTime)
                             resolve(rows);
						   }
				         }    
      })
    })
  }  

  async _executeDDL(ddl) {
	let results = []
	try {
      results = await Promise.all(ddl.map((ddlStatement) => {
        ddlStatement = ddlStatement.replace(/%%YADAMU_DATABASE%%/g,this.parameters.YADAMU_DATABASE);
        ddlStatement = ddlStatement.replace(/%%SCHEMA%%/g,this.parameters.TO_USER);
        return this.executeSQL(ddlStatement,[]);
      }))
    } catch (e) { 
	  this.yadamuLogger.handleException([this.DATABASE_VENDOR,'DDL'],e)
	  results = e
    }
    return results;
  }

  setDatabase() {  
    if ((this.parameters.YADAMU_DATABASE) && (this.parameters.YADAMU_DATABASE !== this.vendorProperties.database)) {
      this.vendorProperties.database = this.parameters.YADAMU_DATABASE
    }
  }  
  
  async initialize() {
    await super.initialize(true);   
	this.statementLibrary = new this.StatementLibrary(this)
	this.SPATIAL_SERIALIZER = this.SPATIAL_FORMAT
  }
    
  /*
  **
  ** Begin a transaction
  **
  */
  
  async beginTransaction() {

    // this.yadamuLogger.trace([`${this.constructor.name}.beginTransaction()`,this.getWorkerNumber()],``)
	 
	/*
	**
	** Sample implementaion show below assuming transaction is managed using SQL. Note that super.beginTransaction() is called after the transaction has been started
	** to perform housing keeping operations related to driver state and correctly tracking number of rows that have been processed.
	**
	*/
	
     await this.executeSQL(this.StatementLibrary.SQL_BEGIN_TRANSACTION,[]);
     super.beginTransaction();

  }

  /*
  **
  ** Commit the current transaction
  **
  */
  
  async commitTransaction() {
	  
    // this.yadamuLogger.trace([`${this.constructor.name}.commitTransaction()`,this.getWorkerNumber()],``)

    /*
	**
	** Sample implementaion show below assuming transaction is managed using SQL. Note that super.commitTransaction() is called after the transaction has been committed
	** to perform housing keeping operations related to driver state and correctly tracking number of rows that have been processed.
	**
	*/

	 super.commitTransaction();
     await this.executeSQL(this.StatementLibrary.SQL_COMMIT_TRANSACTION,[]);
	
  }

  /*
  **
  ** Abort the current transaction
  **
  */
  
  async rollbackTransaction(cause) {

   // this.yadamuLogger.trace([`${this.constructor.name}.rollbackTransaction()`,this.getWorkerNumber()],``)

    this.checkConnectionState(cause)

    /*
	**
	** Sample implementaion show below assuming transaction is managed using SQL. Note that super.rollackTransaction() is called after the transaction has been aborted
	** to perform housing keeping operations related to driver state and correctly tracking number of rows that have been processed.
	**
	*/

	// If rollbackTransaction was invoked due to encounterng an error and the rollback operation results in a second exception being raised, log the exception raised by the rollback operation and throw the original error.
	// Note the underlying error is not thrown unless the rollback itself fails. This makes sure that the underlying error is not swallowed if the rollback operation fails.
	
     
	try {
      super.rollbackTransaction()
      await this.executeSQL(this.StatementLibrary.SQL_ROLLBACK_TRANSACTION,[]);
    } catch (newIssue) {
	  this.checkCause('ROLLBACK TRANSACTION',cause,newIssue);								   
	}
  }

  async createSavePoint() {
	throw new Error('Unimplemented Method')
  }
  
  async restoreSavePoint(cause) {
	throw new Error('Unimplemented Method')
  }  

  /*
  **
  ** The following methods are used by the YADAMU DBReader class
  **
  */
  
  /*
  **
  **  Generate the SystemInformation object for an Export operation
  **
  */
  
  async getSystemInformation() {     
  
    // Get Information about the target server
	
  
    
    const results = await this.executeSQL(this.StatementLibrary.SQL_SYSTEM_INFORMATION,[]);
    const yadamuInstanceId = await this.executeSQL(`call YADAMU_SYSTEM.PUBLIC.YADAMU_INSTANCE_ID()`,[]);
    const yadamuInstallationTimestamp = await this.executeSQL(`call YADAMU_SYSTEM.PUBLIC.YADAMU_INSTALLATION_TIMESTAMP()`,[]);
    
    const sysInfo = results[0];

    return Object.assign(
	  super.getSystemInformation()
	, {
        account                     : sysInfo.ACCOUNT
      , warehouse                   : sysInfo.WAREHOUSE
      , dbName                      : sysInfo.DATABASE_NAME
      , databaseVersion             : sysInfo.DATABASE_VERSION
      , client                      : sysInfo.CLIENT
	  , yadamuInstanceID            : yadamuInstanceId[0].YADAMU_INSTANCE_ID
	  , yadamuInstallationTimestamp : yadamuInstallationTimestamp[0].YADAMU_INSTALLATION_TIMESTAMP
      }  
	)
  }

  /*
  **
  **  Generate a set of DDL operations from the metadata generated by an Export operation
  **
  */

  async getDDLOperations() {
    return undefined
  }

  async describeVariantColumns(schemaInfo) {
      
    // Horrible Hack to get information columns which appear as type USER_DEFINED_TYPE in the INFORMATION SCHEMA
    
    const SAMPLE_SIZE  = 1000
    
    
    return await Promise.all(schemaInfo.map(async (tableInfo) => {
    
      const SQL_DESCRIBE_TABLE = `desc table "${this.parameters.YADAMU_DATABASE}"."${tableInfo.TABLE_SCHEMA}"."${tableInfo.TABLE_NAME}"`
	  
      const columnNames = JSON.parse(tableInfo.COLUMN_NAME_ARRAY)
      let dataTypes = JSON.parse(tableInfo.DATA_TYPE_ARRAY)
      const sizeConstraints = JSON.parse(tableInfo.SIZE_CONSTRAINT_ARRAY)
      
      if (dataTypes.includes('USER_DEFINED_TYPE') || dataTypes.includes('BINARY')) {
	    // Perform a describe to get more info about the USER_DEFINED_TYPE and BINARY
	    const descOutput = await this.executeSQL(SQL_DESCRIBE_TABLE);
	    dataTypes.forEach((dataType,idx) => {
          dataTypes[idx] = dataType === 'USER_DEFINED_TYPE' ? descOutput[idx].type : dataType
          sizeConstraints[idx] = dataType === 'BINARY' ? '' + YadamuLibrary.decomposeDataType(descOutput[idx].type).length : sizeConstraints[idx] 
        })
	  }
      /*
      **
      ** Sucky DUCK-TYPING of VARIANT columns.. Basically if 1000 random rows contain JSON it's JSON otherwise it's XML !
      **
      */
      if (dataTypes.includes('VARIANT')) {
	    // -- Use TRY_PARSE_JSON test a random sample of non null columns to see of they contain valid JSON, if so, assume JSON otherwise assume XML.
	    dataTypes = await Promise.all(dataTypes.map(async (dataType,idx) => {
           if (dataType === 'VARIANT') {
             const columnName = columnNames[idx]
             const SQL_ANALYZE_VARIANT = `with SAMPLE_DATA_SET as (
  select "${columnName}" from "${this.parameters.YADAMU_DATABASE}"."${tableInfo.TABLE_SCHEMA}"."${tableInfo.TABLE_NAME}" 
           sample (1000 rows) 
           where "${columnName}" is not null
)
select (select count(*) from SAMPLE_DATA_SET) "SAMPLED_ROWS",
       (select count(*) from SAMPLE_DATA_SET where TRY_PARSE_JSON("${columnName}") is not null) "JSON",
       (select count(*) from SAMPLE_DATA_SET where IS_OBJECT("${columnName}")) "OBJECTS",
       (select count(*) from SAMPLE_DATA_SET where IS_ARRAY("${columnName}")) "ARRAYS"`
             let results = await this.executeSQL(SQL_ANALYZE_VARIANT)
             switch (true) {
               case (results[0].SAMPLED_ROWS === '0'):
                 break;
               case (results[0].SAMPLED_ROWS === results[0].JSON): 
                 dataType = 'JSON'
                 break
               case (results[0].SAMPLED_ROWS === results[0].OBJECTS):
                 // #### Bad Assumption ???? What about other VARIANT types....
                 dataType = 'XML'
                 break
               case (results[0].ARRAY > 0):
                 break;
               default:
             }               
           }
           return dataType
        }))
	  }
      tableInfo.COLUMN_NAME_ARRAY = columnNames
      tableInfo.DATA_TYPE_ARRAY = dataTypes
      tableInfo.SIZE_CONSTRAINT_ARRAY = sizeConstraints
	  return tableInfo
	}))
  }

  async getSchemaInfo(keyName) {
	  
	let schemaInfo = await this.executeSQL(this.statementLibrary.SQL_SCHEMA_INFORMATION,[this.parameters[keyName]])
    schemaInfo = await this.describeVariantColumns(schemaInfo)
    return schemaInfo
  }
  
  createParser(tableInfo) {
    return new SnowflakeParser(tableInfo,this.yadamuLogger);
  }  
  
  inputStreamError(e,sqlStatement) {
    return this.trackExceptions(new SnowflakeError(e,this.streamingStackTrace,sqlStatement))
  }
  
  generateQueryInformation(tableMetadata) { 
    const tableInfo = super.generateQueryInformation(tableMetadata)
	tableInfo.SQL_STATEMENT = `select ${tableMetadata.CLIENT_SELECT_LIST} from "${this.parameters.YADAMU_DATABASE}"."${tableMetadata.TABLE_SCHEMA}"."${tableMetadata.TABLE_NAME}" t`; 
	return tableInfo
  }   

  async getInputStream(tableInfo) {
    // this.yadamuLogger.trace([`${this.constructor.name}.getInputStream()`,this.getWorkerNumber()],tableInfo.TABLE_NAME)
    this.streamingStackTrace = new Error().stack;
    this.status.sqlTrace.write(this.traceSQL(tableInfo.SQL_STATEMENT));
    return new SnowflakeReader(this.connection,tableInfo.SQL_STATEMENT);
	
  }  
  

  /*
  **
  ** The following methods are used by the YADAMU DBwriter class
  **
  */
   
  async createSchema(schema) {
	// Create a schema 
    throw new Error('Unimplemented Method')
  }
   
  async generateStatementCache(schema) {
    return await super.generateStatementCache(StatementGenerator,schema) 
  }
 
  getOutputStream(tableName,ddlComplete) {
	 // Get an instance of the YadamuWriter implementation associated for this database
	 return super.getOutputStream(SnowflakeWriter,tableName,ddlComplete)
  }
  
  classFactory(yadamu) {
	return new SnowflakeDBI(yadamu)
  }
  
  async getConnectionID() {
    const results = await this.executeSQL(`select CURRENT_SESSION() "pid"`)
    const pid = results[0].pid;
    return pid
  }
 
  async generateCopyStatements(metadata,credentials) {
	 this.statementLibrary.STAGE_CREDENTIALS = credentials
	 return super.generateCopyStatements(metadata) 
  }
 
  validStagedDataSet(vendor,controlFilePath,controlFile) {

    /*
	**
	** Return true if, based on te contents of the control file, the data set can be consumed directly by the RDBMS using a COPY operation.
	** Return false if the data set cannot be consumed using a Copy operation
	** Do not throw errors if the data set cannot be used for a COPY operatio
	** Generate Info messages to explain why COPY cannot be used.
	**
	*/

    if (!SnowflakeConstants.STAGED_DATA_SOURCES.includes(vendor)) {
       return false;
	}
	
	return this.reportCopyOperationMode(controlFile.settings.contentType === 'CSV',controlFilePath,controlFile.settings.contentType)
  }
  
  async reportCopyErrors(tableName,failed,stack,copyStatement) {
	  
    const err = new Error(`Errors detected durng COPY operation: ${failed} records rejected.`);
    err.sql = copyStatement;
	err.tags = []

	try {
	  const results = await this.executeSQL(`select * from table(validate("${this.parameters.YADAMU_DATABASE}"."${this.parameters.TO_USER}"."${tableName}", job_id => '_last'))`);
      err.cause = results.map((err) => {
	    loadError = new Error(err.error)
		Object.assign(loadError,err);
		return loadError
	  })
	} catch (e) {
      err.cause = e
	}
	this.yadamuLogger.handleException([...err.tags,this.DATABASE_VENDOR,tableName],err)	   	
  }  
    
  async initializeCopy(credentials) {
    const results = await this.executeSQL(this.statementLibrary.SQL_CREATE_STAGE);
  }
  
  async copyOperation(tableName,copy) {

	try {
	  const stack = new Error().stack
      await this.beginTransaction()
      const startTime = performance.now();
	  let results = await this.executeSQL(copy.dml);
	  const endTime = performance.now();
	  await this.commitTransaction();
	  let rowsParsed = 0
	  let rowsLoaded = 0
	  let errors = 0
	  results.forEach((file) => {
	    rowsParsed += parseInt(file.rows_parsed)
	    rowsLoaded += parseInt(file.rows_loaded)
	    errors += parseInt(file.errors_seen)
	  })
	  await this.reportCopyResults(tableName,rowsLoaded,rowsParsed - rowsLoaded,startTime,endTime,copy,stack)
	} catch(cause) {
  	  await this.rollbackTransaction(cause);
	  this.yadamuLogger.handleException([this.DATABASE_VENDOR,'COPY',tableName],cause)
	}	
  }
  
  async fianlizeeCopy() {
	const sqlStatement = this.statementLibrary.SQL_DROP_STAGE
    const  results = await this.executeSQL(sqlStatement);
  }
    
}

module.exports = SnowflakeDBI
