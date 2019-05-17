"use strict" 
const fs = require('fs');
const path = require('path');

/* 
**
** Require Database Vendors API 
**
*/

const YadamuDBI = require('../../common/yadamuDBI.js');
const TableWriter = require('./tableWriter.js');

const defaultParameters = {}

/*
**
** YADAMU Database Inteface class skeleton
**
*/

class FileWriter extends YadamuDBI {

  getConnectionProperties() {
    return {
    }
  }
  
  closeFile() {
        
     const outputStream = this.outputStream;
        
     return new Promise(function(resolve,reject) {
      outputStream.on('finish',function() { resolve() });
      outputStream.close();
    })

  }
  
  isDatabase() {
    return false;
  }
  
  objectMode() {
     return false;
  }
  
  get DATABASE_VENDOR() { return 'FILE' };
  get SOFTWARE_VENDOR() { return 'Vendor Long Name' };
  get SPATIAL_FORMAT()  { return 'WKT' };

  constructor(yadamu) {
    super(yadamu,defaultParameters)
     
    this.outputStream = undefined;
    this.firstTable = true;
  }

  isValidDDL() {
    return true;
  }
  
  setSystemInformation(systemInformation) {
    this.outputStream.write(`"systemInformation":${JSON.stringify(systemInformation)}`);
  }

  setMetadata(metadata) {
    this.outputStream.write(',');
    this.outputStream.write(`"metadata":${JSON.stringify(metadata)}`);
  }
    
  async executeDDL(ddl) {
    this.outputStream.write(',');
    this.outputStream.write(`"ddl":${JSON.stringify(ddl)}`);
  }

  /*  
  **
  **  Connect to the database. Set global setttings
  **
  */
  
  async initialize() {
    super.initialize();
    const exportFilePath = path.resolve(this.parameters.FILE);
    this.outputStream = fs.createWriteStream(exportFilePath);
    this.logWriter.write(`${new Date().toISOString()}[FileWriter()]: Writing file "${exportFilePath}".\n`)
    this.outputStream.write(`{`)
  }

  /*
  **
  **  Gracefully close down the database connection.
  **
  */

  async finalize() {
  this.outputStream.write('}')    
    await this.closeFile()
  }

  /*
  **
  **  Abort the database connection.
  **
  */

  async abort() {
      
    if (this.oututStream !== undefined) {
      try {
        await this.closeFile()
      } catch (err) {
        this.logWriter.write(`${new Date().toISOString()}[FileWriter()]: Fatal Error:${err.stack}.\n`)
      }
    }
  }

  /*
  **
  ** Commit the current transaction
  **
  */
  
  async commitTransaction() {
  }

  /*
  **
  ** Abort the current transaction
  **
  */
  
  async rollbackTransaction() {
  }
  
  /*
  **
  ** The following methods are used by JSON_TABLE() style import operations  
  **
  */

  /*
  **
  **  Upload a JSON File to the server. Optionally return a handle that can be used to process the file
  **
  */
  
  async uploadFile(importFilePath) {
  }
  
  /*
  **
  **  Process a JSON File that has been uploaded to the server. 
  **
  */

  async processFile(hndl) {
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
  
  async getSystemInformation(EXPORT_VERSION) {     
  }

  /*
  **
  **  Generate a set of DDL operations from the metadata generated by an Export operation
  **
  */

  async getDDLOperations() {
    return []
  }
  
  async getSchemaInfo(schema) {
    return null
  }

  /*
  **
  ** The following methods are used by the YADAMU DBwriter class
  **
  */
  
  async initializeDataLoad(databaseVendor) {
    this.outputStream.write(',');
    this.outputStream.write('"data":{');
      
  }

  getTableWriter(tableName) {

    if (this.firstTable === true) {
      this.firstTable = false
    }
    else {
      this.outputStream.write(',');
    }

    return new TableWriter(tableName,this.outputStream);      
  }
  
  async finalizeDataLoad() {
    this.outputStream.write('}');
  }  

}

module.exports = FileWriter
