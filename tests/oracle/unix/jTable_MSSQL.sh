export YADAMU_TARGET=MsSQL/jTable
export YADAMU_PARSER=RDBMS
. ../unix/initialize.sh $(readlink -f "$BASH_SOURCE")
export YADAMU_INPUT_PATH=${YADAMU_INPUT_PATH:0:-7}
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_DB_ROOT/sql/COMPILE_ALL.sql $YADAMU_LOG_PATH
export SCHEMAVER=1
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_SCRIPT_ROOT/sql/RECREATE_MSSQL_ALL.sql $YADAMU_LOG_PATH $SCHEMAVER 
. $YADAMU_SCRIPT_ROOT/unix/jTableImport_MSSQL.sh $YADAMU_INPUT_PATH $SCHEMAVER ""
. $YADAMU_SCRIPT_ROOT/unix/export_MSSQL.sh $YADAMU_OUTPUT_PATH $SCHEMAVER $SCHEMAVER
export SCHEMAVER=2
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_SCRIPT_ROOT/sql/RECREATE_MSSQL_ALL.sql $YADAMU_LOG_PATH $SCHEMAVER 
. $YADAMU_SCRIPT_ROOT/unix/jTableImport_MSSQL.sh $YADAMU_OUTPUT_PATH $SCHEMAVER 1
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_SCRIPT_ROOT/sql/COMPARE_MSSQL_ALL.sql $YADAMU_LOG_PATH 1 $SCHEMAVER $YADAMU_PARSER $MODE
. $YADAMU_SCRIPT_ROOT/unix/export_MSSQL.sh $YADAMU_OUTPUT_PATH $SCHEMAVER $SCHEMAVER
export FILENAME=AdventureWorksALL
export SCHEMAVER=1
export SCHEMA=ADVWRK
export SCHEMAVER=1
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_SCRIPT_ROOT/sql/RECREATE_SCHEMA.sql $YADAMU_LOG_PATH $SCHEMA$SCHEMAVER 
node $YADAMU_DB_ROOT/node/jTableImport userid=$DB_USER/$DB_PWD@$DB_CONNECTION  file=$YADAMU_INPUT_PATH/$FILENAME.json toUser=\"$SCHEMA$SCHEMAVER\" mode=$MODE logFile=$IMPORTLOG
node $YADAMU_DB_ROOT/node/export userid=$DB_USER/$DB_PWD@$DB_CONNECTION  file=$YADAMU_OUTPUT_PATH/$FILENAME$SCHEMAVER.json owner=\"$SCHEMA$SCHEMAVER\" mode=$MODE  logFile=$EXPORTLOG
export SCHEMAVER=2
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_SCRIPT_ROOT/sql/RECREATE_SCHEMA.sql $YADAMU_LOG_PATH $SCHEMA$SCHEMAVER 
node $YADAMU_DB_ROOT/node/jTableImport userid=$DB_USER/$DB_PWD@$DB_CONNECTION  file=$YADAMU_OUTPUT_PATH/${FILENAME}1.json toUser=\"$SCHEMA$SCHEMAVER\" mode=$MODE logFile=$IMPORTLOG
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_SCRIPT_ROOT/sql/COMPARE_SCHEMA.sql $YADAMU_LOG_PATH $SCHEMA 1 $SCHEMAVER $YADAMU_PARSER $MODE
node $YADAMU_DB_ROOT/node/export userid=$DB_USER/$DB_PWD@$DB_CONNECTION  file=$YADAMU_OUTPUT_PATH/$FILENAME$SCHEMAVER.json owner=\"$SCHEMA$SCHEMAVER\" mode=$MODE  logFile=$EXPORTLOG
node $YADAMU_HOME/utilities/node/compareFileSizes $YADAMU_LOG_PATH $YADAMU_INPUT_PATH $YADAMU_OUTPUT_PATH
node --max_old_space_size=4096 $YADAMU_HOME/utilities/node/compareArrayContent $YADAMU_LOG_PATH $YADAMU_INPUT_PATH $YADAMU_OUTPUT_PATH false