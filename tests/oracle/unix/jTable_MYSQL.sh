export YADAMU_TARGET=MySQL/jTable
export YADAMU_PARSER=RDBMS
. ../unix/initialize.sh $(readlink -f "$BASH_SOURCE")
export YADAMU_INPUT_PATH=${YADAMU_INPUT_PATH:0:-7}
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_DB_ROOT/sql/COMPILE_ALL.sql $YADAMU_LOG_PATH
export FILENAME=sakila
export SCHEMA=sakila
export SCHEMAVER=1
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_SCRIPT_ROOT/sql/RECREATE_SCHEMA.sql $YADAMU_LOG_PATH $SCHEMA$SCHEMAVER 
node $YADAMU_DB_ROOT/node/jTableImport userid=$DB_USER/$DB_PWD@$DB_CONNECTION  file=$YADAMU_INPUT_PATH/$FILENAME.json toUser=\"$SCHEMA$SCHEMAVER\" mode=$MODE logFile=$IMPORTLOG
node $YADAMU_DB_ROOT/node/export userid=$DB_USER/$DB_PWD@$DB_CONNECTION  file=$YADAMU_OUTPUT_PATH/$FILENAME$SCHEMAVER.json owner=\"$SCHEMA$SCHEMAVER\" mode=$MODE logFile=$EXPORTLOG
export SCHEMAVER=2
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_SCRIPT_ROOT/sql/RECREATE_SCHEMA.sql $YADAMU_LOG_PATH $SCHEMA$SCHEMAVER 
node $YADAMU_DB_ROOT/node/jTableImport userid=$DB_USER/$DB_PWD@$DB_CONNECTION  file=$YADAMU_OUTPUT_PATH/${FILENAME}1.json toUser=\"$SCHEMA$SCHEMAVER\" mode=$MODE logFile=$IMPORTLOG
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_SCRIPT_ROOT/sql/COMPARE_SCHEMA.sql $YADAMU_LOG_PATH $SCHEMA 1 $SCHEMAVER $YADAMU_PARSER $MODE
node $YADAMU_DB_ROOT/node/export userid=$DB_USER/$DB_PWD@$DB_CONNECTION  file=$YADAMU_OUTPUT_PATH/$FILENAME$SCHEMAVER.json owner=\"$SCHEMA$SCHEMAVER\" mode=$MODE logFile=$EXPORTLOG
export SCHEMA=jtest
export SCHEMAVER=1
export FILENAME=jsonExample
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_SCRIPT_ROOT/sql/RECREATE_SCHEMA.sql $YADAMU_LOG_PATH $SCHEMA$SCHEMAVER 
node $YADAMU_DB_ROOT/node/jTableImport userid=$DB_USER/$DB_PWD@$DB_CONNECTION  file=$YADAMU_INPUT_PATH/$FILENAME.json toUser=\"$SCHEMA$SCHEMAVER\" mode=$MODE logFile=$IMPORTLOG
node $YADAMU_DB_ROOT/node/export userid=$DB_USER/$DB_PWD@$DB_CONNECTION  file=$YADAMU_OUTPUT_PATH/$FILENAME$SCHEMAVER.json owner=\"$SCHEMA$SCHEMAVER\" mode=$MODE logFile=$EXPORTLOG
export SCHEMAVER=2
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_SCRIPT_ROOT/sql/RECREATE_SCHEMA.sql $YADAMU_LOG_PATH $SCHEMA$SCHEMAVER 
node $YADAMU_DB_ROOT/node/jTableImport userid=$DB_USER/$DB_PWD@$DB_CONNECTION  file=$YADAMU_OUTPUT_PATH/${FILENAME}1.json toUser=\"$SCHEMA$SCHEMAVER\" mode=$MODE logFile=$IMPORTLOG
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_SCRIPT_ROOT/sql/COMPARE_SCHEMA.sql $YADAMU_LOG_PATH $SCHEMA 1 $SCHEMAVER $YADAMU_PARSER $MODE
node $YADAMU_DB_ROOT/node/export userid=$DB_USER/$DB_PWD@$DB_CONNECTION  file=$YADAMU_OUTPUT_PATH/$FILENAME$SCHEMAVER.json owner=\"$SCHEMA$SCHEMAVER\" mode=$MODE logFile=$EXPORTLOG
node $YADAMU_HOME/utilities/node/compareFileSizes $YADAMU_LOG_PATH $YADAMU_INPUT_PATH $YADAMU_OUTPUT_PATH
node $YADAMU_HOME/utilities/node/compareArrayContent $YADAMU_LOG_PATH $YADAMU_INPUT_PATH $YADAMU_OUTPUT_PATH false