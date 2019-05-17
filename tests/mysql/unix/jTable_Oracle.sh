export YADAMU_TARGET=oracle18c/DATA_ONLY/jTable
export YADAMU_PARSER=RDBMS
. ../unix/initialize.sh $(readlink -f "$BASH_SOURCE")
export YADAMU_INPUT_PATH=${YADAMU_INPUT_PATH:0:-7}
mysql -u$DB_USER -p$DB_PWD -h$DB_HOST -D$DB_DBNAME -P$DB_PORT -v -f <$YADAMU_DB_ROOT/sql/YADAMU_IMPORT.sql >$YADAMU_LOG_PATH/install/YADAMU_IMPORT.log
export SCHEMAVER=1
mysql -u$DB_USER -p$DB_PWD -h$DB_HOST -D$DB_DBNAME -P$DB_PORT -v -f --init-command="set @ID=$SCHEMAVER; set @METHOD='$YADAMU_PARSER';" <$YADAMU_SCRIPT_ROOT/sql/RECREATE_ORACLE_ALL.sql >>$YADAMU_LOG_PATH/RECREATE_SCHEMA.log
. $YADAMU_SCRIPT_ROOT/unix/jTableImport_Oracle.sh $YADAMU_INPUT_PATH $SCHEMAVER ""
. $YADAMU_SCRIPT_ROOT/unix/export_Oracle.sh $YADAMU_OUTPUT_PATH $SCHEMAVER $SCHEMAVER $MODE
export SCHEMAVER=2
mysql -u$DB_USER -p$DB_PWD -h$DB_HOST -D$DB_DBNAME -P$DB_PORT -v -f --init-command="set @ID=$SCHEMAVER; set @METHOD='$YADAMU_PARSER';" <$YADAMU_SCRIPT_ROOT/sql/RECREATE_ORACLE_ALL.sql >>$YADAMU_LOG_PATH/RECREATE_SCHEMA.log
. $YADAMU_SCRIPT_ROOT/unix/jTableImport_Oracle.sh $YADAMU_OUTPUT_PATH $SCHEMAVER 1 
mysql -u$DB_USER -p$DB_PWD -h$DB_HOST -D$DB_DBNAME -P$DB_PORT --init-command="set @ID1=1; set @ID2=$SCHEMAVER; set @METHOD='$YADAMU_PARSER'" --table <$YADAMU_SCRIPT_ROOT/sql/COMPARE_ORACLE_ALL.sql >>$YADAMU_LOG_PATH/COMPARE_SCHEMA.log
. $YADAMU_SCRIPT_ROOT/unix/export_Oracle.sh $YADAMU_OUTPUT_PATH $SCHEMAVER $SCHEMAVER $MODE 
node $YADAMU_HOME/utilities/node/compareFileSizes $YADAMU_LOG_PATH $YADAMU_INPUT_PATH $YADAMU_OUTPUT_PATH
node $YADAMU_HOME/utilities/node/compareArrayContent $YADAMU_LOG_PATH $YADAMU_INPUT_PATH $YADAMU_OUTPUT_PATH false