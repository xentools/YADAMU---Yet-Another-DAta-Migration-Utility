export YADAMU_TARGET=oracle18c/DATA_ONLY
export YADAMU_PARSER=CLARINET
. ../unix/initialize.sh $(readlink -f "$BASH_SOURCE")
sqlcmd -U$DB_USER -P$DB_PWD -S$DB_HOST -dmaster -I -e -i$YADAMU_DB_ROOT/sql/YADAMU_IMPORT.sql > $YADAMU_LOG_PATH/install/YADAMU_IMPORT.log
sqlcmd -U$DB_USER -P$DB_PWD -S$DB_HOST -dmaster -I -e -i$YADAMU_SCRIPT_ROOT/sql/YADAMU_TEST.sql > $YADAMU_LOG_PATH/install/YADAMU_TEST.log
export SCHEMAVER=1
export ID=$SCHEMAVER
sqlcmd -U$DB_USER -P$DB_PWD -S$DB_HOST -d$DB_DBNAME -I -e -i$YADAMU_SCRIPT_ROOT/sql/RECREATE_ORACLE_ALL.sql >>$YADAMU_LOG_PATH/RECREATE_SCHEMA.log
. $YADAMU_SCRIPT_ROOT/unix/import_Oracle.sh $YADAMU_INPUT_PATH $SCHEMAVER ""
. $YADAMU_SCRIPT_ROOT/unix/export_Oracle.sh $YADAMU_OUTPUT_PATH $SCHEMAVER $SCHEMAVER $MODE
export SCHEMAVER=2
export ID=$SCHEMAVER
sqlcmd -U$DB_USER -P$DB_PWD -S$DB_HOST -d$DB_DBNAME -I -e -i$YADAMU_SCRIPT_ROOT/sql/RECREATE_ORACLE_ALL.sql>>$YADAMU_LOG_PATH/RECREATE_SCHEMA.log
. $YADAMU_SCRIPT_ROOT/unix/import_Oracle.sh $YADAMU_OUTPUT_PATH $SCHEMAVER 1 
export ID1=1
export ID2=$SCHEMAVER
export METHOD=$YADAMU_PARSER
export DATABASE=$DB_DBNAME
sqlcmd -U$DB_USER -P$DB_PWD -S$DB_HOST -d$DB_DBNAME -I -e -i$YADAMU_SCRIPT_ROOT/sql/COMPARE_ORACLE_ALL.sql >>$YADAMU_LOG_PATH/COMPARE_SCHEMA.log
. $YADAMU_SCRIPT_ROOT/unix/export_Oracle.sh $YADAMU_OUTPUT_PATH $SCHEMAVER $SCHEMAVER $MODE 
node $YADAMU_HOME/utilities/node/compareFileSizes $YADAMU_LOG_PATH $YADAMU_INPUT_PATH $YADAMU_OUTPUT_PATH
node $YADAMU_HOME/utilities/node/compareArrayContent $YADAMU_LOG_PATH $YADAMU_INPUT_PATH $YADAMU_OUTPUT_PATH false