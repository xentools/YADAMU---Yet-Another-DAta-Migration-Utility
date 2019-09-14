export SRC=$1
export SCHEMAVER=$2
export FILEVER=$3
node $YADAMU_DB_ROOT/node/jTableImport  userid=$DB_USER/$DB_PWD@$DB_CONNECTION file=$SRC/Northwind$FILEVER.json        to_user=\"Northwind$SCHEMAVER\"       mode=$MODE log_file=$IMPORTLOG 
node $YADAMU_DB_ROOT/node/jTableImport  userid=$DB_USER/$DB_PWD@$DB_CONNECTION file=$SRC/Sales$FILEVER.json            to_user=\"Sales$SCHEMAVER\"           mode=$MODE log_file=$IMPORTLOG 
node $YADAMU_DB_ROOT/node/jTableImport  userid=$DB_USER/$DB_PWD@$DB_CONNECTION file=$SRC/Person$FILEVER.json           to_user=\"Person$SCHEMAVER\"          mode=$MODE log_file=$IMPORTLOG 
node $YADAMU_DB_ROOT/node/jTableImport  userid=$DB_USER/$DB_PWD@$DB_CONNECTION file=$SRC/Production$FILEVER.json       to_user=\"Production$SCHEMAVER\"      mode=$MODE log_file=$IMPORTLOG 
node $YADAMU_DB_ROOT/node/jTableImport  userid=$DB_USER/$DB_PWD@$DB_CONNECTION file=$SRC/Purchasing$FILEVER.json       to_user=\"Purchasing$SCHEMAVER\"      mode=$MODE log_file=$IMPORTLOG 
node $YADAMU_DB_ROOT/node/jTableImport  userid=$DB_USER/$DB_PWD@$DB_CONNECTION file=$SRC/HumanResources$FILEVER.json   to_user=\"HumanResources$SCHEMAVER\"  mode=$MODE log_file=$IMPORTLOG 
node $YADAMU_DB_ROOT/node/jTableImport  userid=$DB_USER/$DB_PWD@$DB_CONNECTION file=$SRC/AdventureWorksDW$FILEVER.json to_user=\"AdventureWorksDW$SCHEMAVER\"              mode=$MODE log_file=$IMPORTLOG 
