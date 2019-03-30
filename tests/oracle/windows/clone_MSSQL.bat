set YADAMU_TARGET=MsSQL
@set YADAMU_PARSER=CLARINET
call ..\windows\initialize.bat %~dp0
sqlplus %DB_USER%/%DB_PWD%@%DB_CONNECTION% @%YADAMU_DB_ROOT%\sql\COMPILE_ALL.sql %YADAMU_LOG_PATH%
@set SCHEMAVER=1
sqlplus %DB_USER%/%DB_PWD%@%DB_CONNECTION% @%YADAMU_SCRIPT_ROOT%\sql\RECREATE_MSSQL_ALL.sql %YADAMU_LOG_PATH% %SCHEMAVER% 
call %YADAMU_SCRIPT_ROOT%\windows\import_MSSQL.bat %YADAMU_INPUT_PATH% %SCHEMAVER% ""
call %YADAMU_SCRIPT_ROOT%\windows\export_MSSQL.bat %YADAMU_OUTPUT_PATH% %SCHEMAVER% %SCHEMAVER%
@set SCHEMAVER=2
sqlplus %DB_USER%/%DB_PWD%@%DB_CONNECTION% @%YADAMU_SCRIPT_ROOT%\sql\RECREATE_MSSQL_ALL.sql %YADAMU_LOG_PATH% %SCHEMAVER% 
call %YADAMU_SCRIPT_ROOT%\windows\import_MSSQL.bat %YADAMU_OUTPUT_PATH% %SCHEMAVER% 1
sqlplus %DB_USER%/%DB_PWD%@%DB_CONNECTION% @%YADAMU_SCRIPT_ROOT%\sql\COMPARE_MSSQL_ALL.sql %YADAMU_LOG_PATH% 1 %SCHEMAVER% %YADAMU_PARSER% %MODE%
call %YADAMU_SCRIPT_ROOT%\windows\export_MSSQL.bat %YADAMU_OUTPUT_PATH% %SCHEMAVER% %SCHEMAVER%
@set FILENAME=AdventureWorksALL
@set SCHEMAVER=1
@set SCHEMA=ADVWRK
@set SCHEMAVER=1
sqlplus %DB_USER%/%DB_PWD%@%DB_CONNECTION% @%YADAMU_SCRIPT_ROOT%\sql\RECREATE_SCHEMA.sql %YADAMU_LOG_PATH% %SCHEMA%%SCHEMAVER% 
node %YADAMU_DB_ROOT%\node\import userid=%DB_USER%/%DB_PWD%@%DB_CONNECTION%  file=%YADAMU_INPUT_PATH%\%FILENAME%.json toUser=\"%SCHEMA%%SCHEMAVER%\" mode=%MODE% logFile=%IMPORTLOG%
node %YADAMU_DB_ROOT%\node\export userid=%DB_USER%/%DB_PWD%@%DB_CONNECTION%  file=%YADAMU_OUTPUT_PATH%\%FILENAME%%SCHEMAVER%.json owner=\"%SCHEMA%%SCHEMAVER%\" mode=%MODE%  logFile=%EXPORTLOG%
@set SCHEMAVER=2
sqlplus %DB_USER%/%DB_PWD%@%DB_CONNECTION% @%YADAMU_SCRIPT_ROOT%\sql\RECREATE_SCHEMA.sql %YADAMU_LOG_PATH% %SCHEMA%%SCHEMAVER% 
node %YADAMU_DB_ROOT%\node\import userid=%DB_USER%/%DB_PWD%@%DB_CONNECTION%  file=%YADAMU_OUTPUT_PATH%\%FILENAME%1.json toUser=\"%SCHEMA%%SCHEMAVER%\" mode=%MODE% logFile=%IMPORTLOG%
sqlplus %DB_USER%/%DB_PWD%@%DB_CONNECTION% @%YADAMU_SCRIPT_ROOT%\sql\COMPARE_SCHEMA.sql %YADAMU_LOG_PATH% %SCHEMA% 1 %SCHEMAVER% %YADAMU_PARSER% %MODE%
node %YADAMU_DB_ROOT%\node\export userid=%DB_USER%/%DB_PWD%@%DB_CONNECTION%  file=%YADAMU_OUTPUT_PATH%\%FILENAME%%SCHEMAVER%.json owner=\"%SCHEMA%%SCHEMAVER%\" mode=%MODE%  logFile=%EXPORTLOG%
node %YADAMU_HOME%\utilities\node/compareFileSizes %YADAMU_LOG_PATH% %YADAMU_INPUT_PATH% %YADAMU_OUTPUT_PATH%
node --max_old_space_size=4096 %YADAMU_HOME%\utilities\node/compareArrayContent %YADAMU_LOG_PATH% %YADAMU_INPUT_PATH% %YADAMU_OUTPUT_PATH% false