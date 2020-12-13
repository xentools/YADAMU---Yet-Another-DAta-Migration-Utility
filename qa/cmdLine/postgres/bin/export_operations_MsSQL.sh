export TGT=$1
export FILEVER=$2
export SCHEMA_VERSION=$3
source $YADAMU_BIN/export.sh --RDBMS=$YADAMU_VENDOR --USERNAME=$DB_USER --HOSTNAME=$DB_HOST --PASSWORD=$DB_PWD --DATABASE=$DB_DBNAME owner=\"Northwind$SCHEMA_VERSION\"        FILE=$TGT/Northwind$FILEVER.json        MODE=$MODE LOG_FILE=$YADAMU_EXPORT_LOG  EXCEPTION_FOLDER=$YADAMU_LOG_PATH
source $YADAMU_BIN/export.sh --RDBMS=$YADAMU_VENDOR --USERNAME=$DB_USER --HOSTNAME=$DB_HOST --PASSWORD=$DB_PWD --DATABASE=$DB_DBNAME owner=\"Sales$SCHEMA_VERSION\"            FILE=$TGT/Sales$FILEVER.json            MODE=$MODE LOG_FILE=$YADAMU_EXPORT_LOG  EXCEPTION_FOLDER=$YADAMU_LOG_PATH
source $YADAMU_BIN/export.sh --RDBMS=$YADAMU_VENDOR --USERNAME=$DB_USER --HOSTNAME=$DB_HOST --PASSWORD=$DB_PWD --DATABASE=$DB_DBNAME owner=\"Person$SCHEMA_VERSION\"           FILE=$TGT/Person$FILEVER.json           MODE=$MODE LOG_FILE=$YADAMU_EXPORT_LOG  EXCEPTION_FOLDER=$YADAMU_LOG_PATH
source $YADAMU_BIN/export.sh --RDBMS=$YADAMU_VENDOR --USERNAME=$DB_USER --HOSTNAME=$DB_HOST --PASSWORD=$DB_PWD --DATABASE=$DB_DBNAME owner=\"Production$SCHEMA_VERSION\"       FILE=$TGT/Production$FILEVER.json       MODE=$MODE LOG_FILE=$YADAMU_EXPORT_LOG  EXCEPTION_FOLDER=$YADAMU_LOG_PATH
source $YADAMU_BIN/export.sh --RDBMS=$YADAMU_VENDOR --USERNAME=$DB_USER --HOSTNAME=$DB_HOST --PASSWORD=$DB_PWD --DATABASE=$DB_DBNAME owner=\"Purchasing$SCHEMA_VERSION\"       FILE=$TGT/Purchasing$FILEVER.json       MODE=$MODE LOG_FILE=$YADAMU_EXPORT_LOG  EXCEPTION_FOLDER=$YADAMU_LOG_PATH
source $YADAMU_BIN/export.sh --RDBMS=$YADAMU_VENDOR --USERNAME=$DB_USER --HOSTNAME=$DB_HOST --PASSWORD=$DB_PWD --DATABASE=$DB_DBNAME owner=\"HumanResources$SCHEMA_VERSION\"   FILE=$TGT/HumanResources$FILEVER.json   MODE=$MODE LOG_FILE=$YADAMU_EXPORT_LOG  EXCEPTION_FOLDER=$YADAMU_LOG_PATH
source $YADAMU_BIN/export.sh --RDBMS=$YADAMU_VENDOR --USERNAME=$DB_USER --HOSTNAME=$DB_HOST --PASSWORD=$DB_PWD --DATABASE=$DB_DBNAME owner=\"AdventureWorksDW$SCHEMA_VERSION\" FILE=$TGT/AdventureWorksDW$FILEVER.json MODE=$MODE LOG_FILE=$YADAMU_EXPORT_LOG  EXCEPTION_FOLDER=$YADAMU_LOG_PATH
