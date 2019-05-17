@set YADAMU_TARGET=oracle18c\DATA_ONLY\jTable
@set YADAMU_PARSER=RDBMS
call ..\windows\initialize.bat %~dp0
@set YADAMU_INPUT_PATH=%YADAMU_INPUT_PATH:~0,-7%
psql -U %DB_USER% -d %DB_DBNAME% -h %DB_HOST% -a -f %YADAMU_DB_ROOT%\sql\YADAMU_IMPORT.sql >> %YADAMU_LOG_PATH%\install\YADAMU_IMPORT.log
@set SCHEMAVER=1
psql -U %DB_USER% -d %DB_DBNAME% -h %DB_HOST% -a -vID=%SCHEMAVER% -vMETHOD=%YADAMU_PARSER% -f %YADAMU_SCRIPT_ROOT%\sql\RECREATE_ORACLE_ALL.sql >>%YADAMU_LOG_PATH%\RECREATE_SCHEMA.log
call %YADAMU_SCRIPT_ROOT%\windows\jTableImport_Oracle.bat %YADAMU_INPUT_PATH% %SCHEMAVER% ""
call %YADAMU_SCRIPT_ROOT%\windows\export_Oracle.bat %YADAMU_OUTPUT_PATH% %SCHEMAVER% %SCHEMAVER% %MODE%
@set SCHEMAVER=2
psql -U %DB_USER% -d %DB_DBNAME% -h %DB_HOST% -a -vID=%SCHEMAVER% -vMETHOD=%YADAMU_PARSER% -f %YADAMU_SCRIPT_ROOT%\sql\RECREATE_ORACLE_ALL.sql>>%YADAMU_LOG_PATH%\RECREATE_SCHEMA.log
call %YADAMU_SCRIPT_ROOT%\windows\jTableImport_Oracle.bat %YADAMU_OUTPUT_PATH% %SCHEMAVER% 1 
psql -U %DB_USER% -d %DB_DBNAME% -h %DB_HOST% -q -vID1=1 -vID2=%SCHEMAVER% -vMETHOD=%YADAMU_PARSER% -f %YADAMU_SCRIPT_ROOT%\sql\COMPARE_ORACLE_ALL.sql >>%YADAMU_LOG_PATH%\COMPARE_SCHEMA.log
call %YADAMU_SCRIPT_ROOT%\windows\export_Oracle.bat %YADAMU_OUTPUT_PATH% %SCHEMAVER% %SCHEMAVER% %MODE% 
node %YADAMU_HOME%\utilities\node/compareFileSizes %YADAMU_LOG_PATH% %YADAMU_INPUT_PATH% %YADAMU_OUTPUT_PATH%
node %YADAMU_HOME%\utilities\node/compareArrayContent %YADAMU_LOG_PATH% %YADAMU_INPUT_PATH% %YADAMU_OUTPUT_PATH% false