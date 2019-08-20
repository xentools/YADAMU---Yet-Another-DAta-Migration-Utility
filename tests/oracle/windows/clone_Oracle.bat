if not defined MODE set MODE=DATA_ONLY
for %%I in (.) do set YADAMU_TARGET=%%~nxI
@set YADAMU_TARGET=%YADAMU_TARGET%\%MODE%
@set YADAMU_PARSER=CLARINET
call ..\windows\initialize.bat %~dp0
sqlplus %DB_USER%/%DB_PWD%@%DB_CONNECTION% @%YADAMU_DB_ROOT%\sql\COMPILE_ALL.sql %YADAMU_LOG_PATH%
sqlplus %DB_USER%/%DB_PWD%@%DB_CONNECTION% @%YADAMU_SCRIPT_ROOT%\sql\YADAMU_TEST.sql %YADAMU_LOG_PATH% OFF
@set SCHEMAVER=1
sqlplus %DB_USER%/%DB_PWD%@%DB_CONNECTION% @%YADAMU_SCRIPT_ROOT%\sql\RECREATE_ORACLE_ALL.sql %YADAMU_LOG_PATH% %SCHEMAVER% 
call %YADAMU_SCRIPT_ROOT%\windows\import_Oracle.bat %YADAMU_INPUT_PATH% %SCHEMAVER% ""
sqlplus %DB_USER%/%DB_PWD%@%DB_CONNECTION% @%YADAMU_SCRIPT_ROOT%\sql\COMPARE_ORACLE_ALL.sql %YADAMU_LOG_PATH% "" %SCHEMAVER% %YADAMU_PARSER% %MODE%
call %YADAMU_SCRIPT_ROOT%\windows\export_Oracle.bat %YADAMU_OUTPUT_PATH% %SCHEMAVER% %SCHEMAVER% %MODE%
@set SCHEMAVER=2
sqlplus %DB_USER%/%DB_PWD%@%DB_CONNECTION% @%YADAMU_SCRIPT_ROOT%\sql\RECREATE_ORACLE_ALL.sql %YADAMU_LOG_PATH% %SCHEMAVER% 
call %YADAMU_SCRIPT_ROOT%\windows\import_Oracle.bat %YADAMU_OUTPUT_PATH% %SCHEMAVER% 1
sqlplus %DB_USER%/%DB_PWD%@%DB_CONNECTION% @%YADAMU_SCRIPT_ROOT%\sql\COMPARE_ORACLE_ALL.sql %YADAMU_LOG_PATH% 1 %SCHEMAVER% %YADAMU_PARSER% %MODE%
call %YADAMU_SCRIPT_ROOT%\windows\export_Oracle.bat %YADAMU_OUTPUT_PATH% %SCHEMAVER% %SCHEMAVER% %MODE%
node %YADAMU_HOME%\utilities\node/compareFileSizes %YADAMU_LOG_PATH% %YADAMU_INPUT_PATH% %YADAMU_OUTPUT_PATH%
node %YADAMU_HOME%\utilities\node/compareArrayContent %YADAMU_LOG_PATH% %YADAMU_INPUT_PATH% %YADAMU_OUTPUT_PATH% false