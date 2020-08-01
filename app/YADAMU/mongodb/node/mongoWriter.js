"use strict"

const { performance } = require('perf_hooks');

const WKX = require('wkx');

const ObjectID = require('mongodb').ObjectID

const Yadamu = require('../../common/yadamu.js');
const YadamuLibrary = require('../../common/yadamuLibrary.js');
const YadamuWriter = require('../../common/yadamuWriter.js');
const {BatchInsertError} = require('../../common/yadamuError.js')

class MongoWriter extends YadamuWriter {

  /*
  **
  ** MongoDB Support allows data from a relational database to be imported using one of the following
  **
  ** If the relational table consists of a single column of Type JSON 
  **
  **   DOCUMENT:
  **  
  **     If column contains an object then the JSON object will become the mongo document.
  **
  **     If the column contains an array the array will be wrapped in an object containing a single key "array"
  **
  ** If the relational table has multiple columns then three modes are avaialbe 
  ** 
  **    OBJECT: The row is inserted an object. The document contains one key for each column in the table
  **
  **    ARRAY:  The row is inserted as object. The array containing the values from the table will be wrapped in an object containing a single key "row". 
  **            A document containing the table's metadata will be inserted into the YadamuMetadata collection.
  **
  **    BSON:   A BOSN object is contructed based on the relational metadata. 
  **  
  */

  constructor(dbi,tableName,status,yadamuLogger) {
    super({objectMode: true},dbi,tableName,status,yadamuLogger)
    
    this.transformations = this.tableInfo.targetDataTypes.map((targetDataType,idx) => {      
       switch(targetDataType.toLowerCase()){
        case 'objectid':
	      return (row,idx) => {
			row[idx] = ObjectID(row[idx])
	      }
          break;
        case 'geometry':
        case 'geography':
        case '"MDSYS"."SDO_GEOMETRY"':
          switch (this.dbi.systemInformation.spatialFormat) {
            case "WKB":
            case "EWKB":
              return (row,idx) => {
			    row[idx] = WKX.Geometry.parse(row[idx]).toGeoJSON()
			  }
 			  return null
            case "WKT":
            case "EWKT":
              return (row,idx) => {
        	    row[idx] = WKX.Geometry.parse(row[idx]).toGeoJSON()
              }
            default:
          }
		  return null
        case 'boolean':
          return (row,idx) => {
            row[idx] = YadamuLibrary.toBoolean(row[idx])
	      }
        case 'object':
          return (row,idx) => {
            row[idx] = typeof row[idx] === 'string' ? JSON.parse(row[idx]) : row[idx]
	      }
		case 'binData':
		  if ((this.tableInfo.columnNames[idx] === '_id') && (this.tableInfo.sizeConstraints[idx] === '12')) {
  	        return (row,idx) => {
              row[idx] = ObjectID(row[idx])
	        }
		  }
		  return null
		case 'date':
		  if (this.dbi.MONGO_NATIVEJS_DATE) {
	        return (row,idx) => {
              row[idx] =  new Date(row[idx])
	        }		
          }			
		  return null
		default:
		  return null
	  }
	})

    // Use a dummy rowTransformation function if there are no transformations required.

    this.rowTransformation = this.transformations.every((currentValue) => { currentValue === null}) ? (row) => {} : (row) => {
      this.transformations.forEach((transformation,idx) => {
        if ((transformation !== null) && (row[idx] !== null)) {
          transformation(row,idx)
        }
      }) 
    }
  }
  
  async initialize() {
      
    this.collection = await this.dbi.collection(this.tableInfo.tableName)
    if (this.tableInfo.insertMode === 'ARRAY') {
      const result = await this.dbi.insertOne('yadamuMetadata',this.tableInfo);
    }
    super.initialize();
  }

  cacheRow(row) {
      
    // Apply transformation
    
    this.rowTransformation(row)

    switch (this.tableInfo.insertMode) {
      case 'DOCUMENT' :
        if (Array.isArray(row[0])) {
          this.batch.push({array : row[0]})
        }
        else {
          this.batch.push(row[0]);
        }
        break;
      case 'BSON':
      case 'OBJECT' :
        const mDocument = {}
        this.tableInfo.columnNames.forEach((key,idx) => {
           mDocument[key] = row[idx]
        });
        this.batch.push(mDocument);
        break;
      case 'ARRAY' :
        this.batch.push({ row : row });
        break;
      default:
        // ### Exception - Unknown Mode
    }
	
    this.rowCounters.cached++
    return this.skipTable

  }
  
  
  reportBatchError(operation,cause) {
   	super.reportBatchError(operation,cause,this.batch[0],this.batch[this.batch.length-1])
  }
 
  async writeBatch() {
    
    // ### Todo: ERROR HANDLING and Iterative Mode.
	
    this.rowCounters.batchCount++
	const results = await this.dbi.insertMany(this.tableInfo.tableName,this.batch);
	
    this.endTime = performance.now();
    this.batch.length = 0;
    this.rowCounters.written += this.rowCounters.cached;
    this.rowCounters.cached = 0;
    return this.skipTable
  }
  
  getStatistics() {
	const tableStats = super.getStatistics()
	tableStats.insertMode = this.tableInfo.insertMode
    return tableStats;  
  }
}

module.exports = MongoWriter;