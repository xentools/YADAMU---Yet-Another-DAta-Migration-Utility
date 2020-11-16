"use strict" 

const YadamuConstants = require('../../common/yadamuConstants.js');

class PostgresStatementLibrary {
    
  static get SQL_CONFIGURE_CONNECTION()       { return _SQL_CONFIGURE_CONNECTION }
  static get SQL_SYSTEM_INFORMATION()         { return _SQL_SYSTEM_INFORMATION }
  static get SQL_GET_DLL_STATEMENTS()         { return _SQL_GET_DLL_STATEMENTS }
  static get SQL_SCHEMA_INFORMATION()         { return _SQL_SCHEMA_INFORMATION } 
  static get SQL_CREATE_SAVE_POINT()          { return _SQL_CREATE_SAVE_POINT }  
  static get SQL_RESTORE_SAVE_POINT()         { return _SQL_RESTORE_SAVE_POINT }
  static get SQL_RELEASE_SAVE_POINT()         { return _SQL_RELEASE_SAVE_POINT }

}

module.exports = PostgresStatementLibrary

const _SQL_CONFIGURE_CONNECTION = `set timezone to 'UTC'; SET extra_float_digits to 3; SET Intervalstyle = 'iso_8601'`

const _SQL_SCHEMA_INFORMATION   = `select * from EXPORT_JSON($1,$2)`;
 
const _SQL_SYSTEM_INFORMATION   = `select current_database() database_name,current_user, session_user, current_setting('server_version_num') database_version, right(to_char(current_timestamp,'YYYY-MM-DD"T"Hh24:MI:SSTZH:TZM'),6) timezone`;

const _SQL_CREATE_SAVE_POINT    = `SAVEPOINT ${YadamuConstants.SAVE_POINT_NAME}`;

const _SQL_RESTORE_SAVE_POINT   = `ROLLBACK TO SAVEPOINT ${YadamuConstants.SAVE_POINT_NAME}`;

const _SQL_RELEASE_SAVE_POINT   = `RELEASE SAVEPOINT ${YadamuConstants.SAVE_POINT_NAME}`;

const _PGOID_DATE         = 1082; 
const _PGOID_TIMESTAMP    = 1114;
const _PGOID_TIMESTAMP_TZ = 1118;

