export SRC=$1
export SCHEMA_VERSION=$2
export FILEVER=$3
source $YADAMU_BIN/upload.sh --RDBMS=$YADAMU_VENDOR --USERNAME=$DB_USER --HOSTNAME=$DB_HOST --PASSWORD=$DB_PWD --DATABASE=$DB_DBNAME FILE=$SRC/Northwind$FILEVER.json        TO_USER=\"Northwind$SCHEMA_VERSION\"        MODE=$MODE LOG_FILE=$YADAMU_IMPORT_LOG  EXCEPTION_FOLDER=$YADAMU_LOG_PATH
source $YADAMU_BIN/upload.sh --RDBMS=$YADAMU_VENDOR --USERNAME=$DB_USER --HOSTNAME=$DB_HOST --PASSWORD=$DB_PWD --DATABASE=$DB_DBNAME FILE=$SRC/Sales$FILEVER.json            TO_USER=\"Sales$SCHEMA_VERSION\"            MODE=$MODE LOG_FILE=$YADAMU_IMPORT_LOG  EXCEPTION_FOLDER=$YADAMU_LOG_PATH
source $YADAMU_BIN/upload.sh --RDBMS=$YADAMU_VENDOR --USERNAME=$DB_USER --HOSTNAME=$DB_HOST --PASSWORD=$DB_PWD --DATABASE=$DB_DBNAME FILE=$SRC/Person$FILEVER.json           TO_USER=\"Person$SCHEMA_VERSION\"           MODE=$MODE LOG_FILE=$YADAMU_IMPORT_LOG  EXCEPTION_FOLDER=$YADAMU_LOG_PATH
source $YADAMU_BIN/upload.sh --RDBMS=$YADAMU_VENDOR --USERNAME=$DB_USER --HOSTNAME=$DB_HOST --PASSWORD=$DB_PWD --DATABASE=$DB_DBNAME FILE=$SRC/Production$FILEVER.json       TO_USER=\"Production$SCHEMA_VERSION\"       MODE=$MODE LOG_FILE=$YADAMU_IMPORT_LOG  EXCEPTION_FOLDER=$YADAMU_LOG_PATH
source $YADAMU_BIN/upload.sh --RDBMS=$YADAMU_VENDOR --USERNAME=$DB_USER --HOSTNAME=$DB_HOST --PASSWORD=$DB_PWD --DATABASE=$DB_DBNAME FILE=$SRC/Purchasing$FILEVER.json       TO_USER=\"Purchasing$SCHEMA_VERSION\"       MODE=$MODE LOG_FILE=$YADAMU_IMPORT_LOG  EXCEPTION_FOLDER=$YADAMU_LOG_PATH
source $YADAMU_BIN/upload.sh --RDBMS=$YADAMU_VENDOR --USERNAME=$DB_USER --HOSTNAME=$DB_HOST --PASSWORD=$DB_PWD --DATABASE=$DB_DBNAME FILE=$SRC/HumanResources$FILEVER.json   TO_USER=\"HumanResources$SCHEMA_VERSION\"   MODE=$MODE LOG_FILE=$YADAMU_IMPORT_LOG  EXCEPTION_FOLDER=$YADAMU_LOG_PATH
source $YADAMU_BIN/upload.sh --RDBMS=$YADAMU_VENDOR --USERNAME=$DB_USER --HOSTNAME=$DB_HOST --PASSWORD=$DB_PWD --DATABASE=$DB_DBNAME FILE=$SRC/AdventureWorksDW$FILEVER.json TO_USER=\"AdventureWorksDW$SCHEMA_VERSION\" MODE=$MODE LOG_FILE=$YADAMU_IMPORT_LOG  EXCEPTION_FOLDER=$YADAMU_LOG_PATH
