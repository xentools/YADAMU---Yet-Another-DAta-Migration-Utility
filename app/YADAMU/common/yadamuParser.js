"use strict" 

const Transform = require('stream').Transform;
const { performance } = require('perf_hooks');

class YadamuParser extends Transform {
    
  constructor(tableInfo,yadamuLogger) {
    super({objectMode: true });  
    this.tableInfo = tableInfo;
    this.yadamuLogger = yadamuLogger
    this.counter = 0
    
    this.columnMetadata = undefined;
    this.includesLobs = false;
    
  }
    
  getCounter() {
    return this.counter;
  }

  // For use in cases where the database generates a single column containing a serialized JSON reprensentation of the row.
  
  async _transform (data,encoding,callback) {
    this.counter++;
	if (!Array.isArray(data)) {
	  data = Object.values(data)
	}
    this.push({data:data.json})
    callback();
  }

   _final(callback) {
	// this.yadamuLogger.trace([this.constructor.name,this.tableInfo.TABLE_NAME],'_final()');
	this.endTime = performance.now();
	callback()
	// Force invoking end() to Emit 'end'. Since parser i
	// this.emit('end');
  } 
}

module.exports = YadamuParser