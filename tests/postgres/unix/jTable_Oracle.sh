export YADAMU_TARGET=oracle18c/DATA_ONLY/jTable
export YADAMU_PARSER=RDBMS
. ../unix/initialize.sh $(readlink -f "$BASH_SOURCE")
export YADAMU_INPUT_PATH=${YADAMU_INPUT_PATH:0:-7}
psql -U $DB_USER -d $DB_DBNAME -h $DB_HOST -a -f $YADAMU_DB_ROOT/sql/YADAMU_IMPORT.sql >> $YADAMU_LOG_PATH/install/YADAMU_IMPORT.log
export SCHEMAVER=1
psql -U $DB_USER -d $DB_DBNAME -h $DB_HOST -a -vID=$SCHEMAVER -vMETHOD=$YADAMU_PARSER -f $YADAMU_SCRIPT_ROOT/sql/RECREATE_ORACLE_ALL.sql >>$YADAMU_LOG_PATH/RECREATE_SCHEMA.log
. $YADAMU_SCRIPT_ROOT/unix/jTableImport_Oracle.sh $YADAMU_INPUT_PATH $SCHEMAVER ""
. $YADAMU_SCRIPT_ROOT/unix/export_Oracle.sh $YADAMU_OUTPUT_PATH $SCHEMAVER $SCHEMAVER $MODE
export SCHEMAVER=2
psql -U $DB_USER -d $DB_DBNAME -h $DB_HOST -a -vID=$SCHEMAVER -vMETHOD=$YADAMU_PARSER -f $YADAMU_SCRIPT_ROOT/sql/RECREATE_ORACLE_ALL.sql>>$YADAMU_LOG_PATH/RECREATE_SCHEMA.log
. $YADAMU_SCRIPT_ROOT/unix/jTableImport_Oracle.sh $YADAMU_OUTPUT_PATH $SCHEMAVER 1 
psql -U $DB_USER -d $DB_DBNAME -h $DB_HOST -q -vID1=1 -vID2=$SCHEMAVER -vMETHOD=$YADAMU_PARSER -f $YADAMU_SCRIPT_ROOT/sql/COMPARE_ORACLE_ALL.sql >>$YADAMU_LOG_PATH/COMPARE_SCHEMA.log
. $YADAMU_SCRIPT_ROOT/unix/export_Oracle.sh $YADAMU_OUTPUT_PATH $SCHEMAVER $SCHEMAVER $MODE 
node $YADAMU_HOME/utilities/node/compareFileSizes $YADAMU_LOG_PATH $YADAMU_INPUT_PATH $YADAMU_OUTPUT_PATH
node $YADAMU_HOME/utilities/node/compareArrayContent $YADAMU_LOG_PATH $YADAMU_INPUT_PATH $YADAMU_OUTPUT_PATH false