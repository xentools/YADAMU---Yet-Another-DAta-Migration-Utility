@set YADAMU_TARGET=MySQL\jTable
@set YADAMU_PARSER=RDBMS
call ..\windows\initialize.bat %~dp0
@set YADAMU_INPUT_PATH=%YADAMU_INPUT_PATH:~0,-7%
mysql -u%DB_USER% -p%DB_PWD% -h%DB_HOST% -D%DB_DBNAME% -P%DB_PORT% -v -f <%YADAMU_DB_ROOT%\sql\YADAMU_IMPORT.sql >%YADAMU_LOG_PATH%\install\YADAMU_IMPORT.log
mysql -u%DB_USER% -p%DB_PWD% -h%DB_HOST% -D%DB_DBNAME% -P%DB_PORT% -v -f <%YADAMU_SCRIPT_ROOT%\sql\YADAMU_TEST.sql >%YADAMU_LOG_PATH%\install\YADAMU_TEST.log
@set FILENAME=sakila
@set SCHEMA=sakila
@set SCHEMAVER=1
mysql -u%DB_USER% -p%DB_PWD% -h%DB_HOST% -D%DB_DBNAME% -P%DB_PORT%  -v -f --init-command="set @SCHEMA='%SCHEMA%%SCHEMAVER%'; set @METHOD='%YADAMU_PARSER%'" <%YADAMU_SCRIPT_ROOT%\sql\RECREATE_SCHEMA.sql >>%YADAMU_LOG_PATH%\RECREATE_SCHEMA.log
node %YADAMU_DB_ROOT%\node\jTableImport --username=%DB_USER% --hostname=%DB_HOST% --port=%DB_PORT% --password=%DB_PWD% --database=%DB_DBNAME% file=%YADAMU_INPUT_PATH%\%FILENAME%.json to_user=\"%SCHEMA%%SCHEMAVER%\" mode=%MODE%  log_file=%IMPORTLOG%
mysql -u%DB_USER% -p%DB_PWD% -h%DB_HOST% -D%DB_DBNAME% -P%DB_PORT% --init-command="set @SCHEMA='%SCHEMA%'; set @ID1=''; set @ID2=%SCHEMAVER%; set @METHOD='%YADAMU_PARSER%'" --table  <%YADAMU_SCRIPT_ROOT%\sql\COMPARE_SCHEMA.sql >>%YADAMU_LOG_PATH%\COMPARE_SCHEMA.log
node %YADAMU_DB_ROOT%\node\export --username=%DB_USER% --hostname=%DB_HOST% --port=%DB_PORT% --password=%DB_PWD% --database=%DB_DBNAME% file=%YADAMU_OUTPUT_PATH%\%FILENAME%%SCHEMAVER%.json owner=\"%SCHEMA%%SCHEMAVER%\" mode=%MODE% log_file=%EXPORTLOG%
@set SCHEMAVER=2
mysql -u%DB_USER% -p%DB_PWD% -h%DB_HOST% -D%DB_DBNAME% -P%DB_PORT%  -v -f --init-command="set @SCHEMA='%SCHEMA%%SCHEMAVER%'; set @METHOD='%YADAMU_PARSER%'" <%YADAMU_SCRIPT_ROOT%\sql\RECREATE_SCHEMA.sql >>%YADAMU_LOG_PATH%\RECREATE_SCHEMA.log
node %YADAMU_DB_ROOT%\node\jTableImport --username=%DB_USER% --hostname=%DB_HOST% --port=%DB_PORT% --password=%DB_PWD% --database=%DB_DBNAME% file=%YADAMU_OUTPUT_PATH%\%FILENAME%1.json to_user=\"%SCHEMA%%SCHEMAVER%\" mode=%MODE% log_file=%IMPORTLOG%
mysql -u%DB_USER% -p%DB_PWD% -h%DB_HOST% -D%DB_DBNAME% -P%DB_PORT% --init-command="set @SCHEMA='%SCHEMA%'; set @ID1=1; set @ID2=%SCHEMAVER%; set @METHOD='%YADAMU_PARSER%'" --table  <%YADAMU_SCRIPT_ROOT%\sql\COMPARE_SCHEMA.sql >>%YADAMU_LOG_PATH%\COMPARE_SCHEMA.log
node %YADAMU_DB_ROOT%\node\export --username=%DB_USER% --hostname=%DB_HOST% --port=%DB_PORT% --password=%DB_PWD% --database=%DB_DBNAME% file=%YADAMU_OUTPUT_PATH%\%FILENAME%%SCHEMAVER%.json owner=\"%SCHEMA%%SCHEMAVER%\" mode=%MODE% log_file=%EXPORTLOG%
@set FILENAME=jsonExample
@set SCHEMA=jtest
@set SCHEMAVER=1
mysql -u%DB_USER% -p%DB_PWD% -h%DB_HOST% -D%DB_DBNAME% -P%DB_PORT%  -v -f --init-command="set @SCHEMA='%SCHEMA%%SCHEMAVER%'; set @METHOD='%YADAMU_PARSER%'" <%YADAMU_SCRIPT_ROOT%\sql\RECREATE_SCHEMA.sql >>%YADAMU_LOG_PATH%\RECREATE_SCHEMA.log
node %YADAMU_DB_ROOT%\node\jTableImport --username=%DB_USER% --hostname=%DB_HOST% --port=%DB_PORT% --password=%DB_PWD% --database=%DB_DBNAME% file=%YADAMU_INPUT_PATH%\%FILENAME%.json to_user=\"%SCHEMA%%SCHEMAVER%\" mode=%MODE%  log_file=%IMPORTLOG%
mysql -u%DB_USER% -p%DB_PWD% -h%DB_HOST% -D%DB_DBNAME% -P%DB_PORT% --init-command="set @SCHEMA='%SCHEMA%'; set @ID1=''; set @ID2=%SCHEMAVER%; set @METHOD='%YADAMU_PARSER%'" --table  <%YADAMU_SCRIPT_ROOT%\sql\COMPARE_SCHEMA.sql >>%YADAMU_LOG_PATH%\COMPARE_SCHEMA.log
node %YADAMU_DB_ROOT%\node\export --username=%DB_USER% --hostname=%DB_HOST% --port=%DB_PORT% --password=%DB_PWD% --database=%DB_DBNAME% file=%YADAMU_OUTPUT_PATH%\%FILENAME%%SCHEMAVER%.json owner=\"%SCHEMA%%SCHEMAVER%\" mode=%MODE% log_file=%EXPORTLOG%
@set SCHEMAVER=2
mysql -u%DB_USER% -p%DB_PWD% -h%DB_HOST% -D%DB_DBNAME% -P%DB_PORT%  -v -f --init-command="set @SCHEMA='%SCHEMA%%SCHEMAVER%'; set @METHOD='%YADAMU_PARSER%'" <%YADAMU_SCRIPT_ROOT%\sql\RECREATE_SCHEMA.sql >>%YADAMU_LOG_PATH%\RECREATE_SCHEMA.log
node %YADAMU_DB_ROOT%\node\jTableImport --username=%DB_USER% --hostname=%DB_HOST% --port=%DB_PORT% --password=%DB_PWD% --database=%DB_DBNAME% file=%YADAMU_OUTPUT_PATH%\%FILENAME%1.json to_user=\"%SCHEMA%%SCHEMAVER%\" mode=%MODE% log_file=%IMPORTLOG%
mysql -u%DB_USER% -p%DB_PWD% -h%DB_HOST% -D%DB_DBNAME% -P%DB_PORT% --init-command="set @SCHEMA='%SCHEMA%'; set @ID1=''; set @ID2=%SCHEMAVER%; set @METHOD='%YADAMU_PARSER%'" --table  <%YADAMU_SCRIPT_ROOT%\sql\COMPARE_SCHEMA.sql >>%YADAMU_LOG_PATH%\COMPARE_SCHEMA.log
node %YADAMU_DB_ROOT%\node\export --username=%DB_USER% --hostname=%DB_HOST% --port=%DB_PORT% --password=%DB_PWD% --database=%DB_DBNAME% file=%YADAMU_OUTPUT_PATH%\%FILENAME%%SCHEMAVER%.json owner=\"%SCHEMA%%SCHEMAVER%\" mode=%MODE% log_file=%EXPORTLOG%
node %YADAMU_HOME%\utilities\node/compareFileSizes %YADAMU_LOG_PATH% %YADAMU_INPUT_PATH% %YADAMU_OUTPUT_PATH%
node %YADAMU_HOME%\utilities\node/compareArrayContent %YADAMU_LOG_PATH% %YADAMU_INPUT_PATH% %YADAMU_OUTPUT_PATH% false