export SCHEMAID=$1
source $YADAMU_TEST_HOME/oracle19c/env/dbConnection.sh
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_TEST_HOME/oracle/sql/RECREATE_MSSQL_ALL.sql $YADAMU_LOG_PATH $SCHEMAID 
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_TEST_HOME/oracle/sql/RECREATE_ORACLE_ALL.sql $YADAMU_LOG_PATH $SCHEMAID 
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_TEST_HOME/oracle/sql/RECREATE_SCHEMA.sql $YADAMU_LOG_PATH "jtest$SCHEMAID" 
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_TEST_HOME/oracle/sql/RECREATE_SCHEMA.sql $YADAMU_LOG_PATH "sakila$SCHEMAID" 
source $YADAMU_TEST_HOME/oracle18c/env/dbConnection.sh
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_TEST_HOME/oracle/sql/RECREATE_MSSQL_ALL.sql $YADAMU_LOG_PATH $SCHEMAID 
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_TEST_HOME/oracle/sql/RECREATE_ORACLE_ALL.sql $YADAMU_LOG_PATH $SCHEMAID 
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_TEST_HOME/oracle/sql/RECREATE_SCHEMA.sql $YADAMU_LOG_PATH "jtest$SCHEMAID" 
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_TEST_HOME/oracle/sql/RECREATE_SCHEMA.sql $YADAMU_LOG_PATH "sakila$SCHEMAID" 
source $YADAMU_TEST_HOME/oracle12c/env/dbConnection.sh
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_TEST_HOME/oracle/sql/RECREATE_MSSQL_ALL.sql $YADAMU_LOG_PATH $SCHEMAID 
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_TEST_HOME/oracle/sql/RECREATE_ORACLE_ALL.sql $YADAMU_LOG_PATH $SCHEMAID 
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_TEST_HOME/oracle/sql/RECREATE_SCHEMA.sql $YADAMU_LOG_PATH "jtest$SCHEMAID" 
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_TEST_HOME/oracle/sql/RECREATE_SCHEMA.sql $YADAMU_LOG_PATH "sakila$SCHEMAID" 
source $YADAMU_TEST_HOME/oracle11g/env/dbConnection.sh
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_TEST_HOME/oracle/sql/RECREATE_MSSQL_ALL.sql $YADAMU_LOG_PATH $SCHEMAID 
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_TEST_HOME/oracle/sql/RECREATE_ORACLE_ALL.sql $YADAMU_LOG_PATH $SCHEMAID 
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_TEST_HOME/oracle/sql/RECREATE_SCHEMA.sql $YADAMU_LOG_PATH "jtest$SCHEMAID" 
sqlplus $DB_USER/$DB_PWD@$DB_CONNECTION @$YADAMU_TEST_HOME/oracle/sql/RECREATE_SCHEMA.sql $YADAMU_LOG_PATH "sakila$SCHEMAID" 
source $YADAMU_TEST_HOME/mssql/env/dbConnection.sh
echo ":setvar ID ''" > setvars.sql
export SQLCMDINI=setvars.sql
export DATABASE=$DB_DBNAME
sqlcmd -U$DB_USER -P$DB_PWD -S$DB_HOST -d$DB_DBNAME -I -e -i$YADAMU_TEST_HOME/mssql/sql/RECREATE_MSSQL_ALL.sql >$YADAMU_LOG_PATH/MSSQL_RECREATE_SCHEMA.log
sqlcmd -U$DB_USER -P$DB_PWD -S$DB_HOST -d$DB_DBNAME -I -e -i$YADAMU_TEST_HOME/mssql/sql/RECREATE_ORACLE_ALL.sql >>$YADAMU_LOG_PATH/MSSQL_RECREATE_SCHEMA.log
export MSSQL_SCHEMA=AdventureWorksAll
sqlcmd -U$DB_USER -P$DB_PWD -S$DB_HOST -d$DB_DBNAME -I -e -i$YADAMU_TEST_HOME/mssql/sql/RECREATE_SCHEMA.sql >> $YADAMU_LOG_PATH/MSSQL_RECREATE_SCHEMA.log
export MSSQL_SCHEMA=jtest
sqlcmd -U$DB_USER -P$DB_PWD -S$DB_HOST -d$DB_DBNAME -I -e -i$YADAMU_TEST_HOME/mssql/sql/RECREATE_SCHEMA.sql >> $YADAMU_LOG_PATH/MSSQL_RECREATE_SCHEMA.log
export MSSQL_SCHEMA=sakila
sqlcmd -U$DB_USER -P$DB_PWD -S$DB_HOST -d$DB_DBNAME -I -e -i$YADAMU_TEST_HOME/mssql/sql/RECREATE_SCHEMA.sql >> $YADAMU_LOG_PATH/MSSQL_RECREATE_SCHEMA.log
source $YADAMU_TEST_HOME/mysql/env/dbConnection.sh
mysql.exe -u$DB_USER -p$DB_PWD -h$DB_HOST -D$DB_DBNAME -P$DB_PORT -v -f --init-command="set @ID='%SCHEMAID%'" <$YADAMU_TEST_HOME/mysql/sql/RECREATE_MSSQL_ALL.sql >$YADAMU_LOG_PATH/MYSQL_RECREATE_SCHEMA.log
mysql.exe -u$DB_USER -p$DB_PWD -h$DB_HOST -D$DB_DBNAME -P$DB_PORT -v -f --init-command="set @ID='%SCHEMAID%';"<$YADAMU_TEST_HOME/mysql/sql/RECREATE_ORACLE_ALL.sql >>$YADAMU_LOG_PATH/MYSQL_RECREATE_SCHEMA.log
mysql.exe -u$DB_USER -p$DB_PWD -h$DB_HOST -D$DB_DBNAME -P$DB_PORT -v -f --init-command="set @SCHEMA='jtest%SCHEMAID%'" <$YADAMU_TEST_HOME/mysql/sql/RECREATE_SCHEMA.sql >>$YADAMU_LOG_PATH/MYSQL_RECREATE_SCHEMA.log
mysql.exe -u$DB_USER -p$DB_PWD -h$DB_HOST -D$DB_DBNAME -P$DB_PORT -v -f --init-command="set @SCHEMA='sakila%SCHEMAID%'" <$YADAMU_TEST_HOME/mysql/sql/RECREATE_SCHEMA.sql >>$YADAMU_LOG_PATH/MYSQL_RECREATE_SCHEMA.log
source $YADAMU_TEST_HOME/mariadb/env/dbConnection.sh
mysql.exe -u$DB_USER -p$DB_PWD -h$DB_HOST -D$DB_DBNAME -P$DB_PORT -v -f --init-command="set @ID='%SCHEMAID%'" <$YADAMU_TEST_HOME/mariadb/sql/RECREATE_MSSQL_ALL.sql >$YADAMU_LOG_PATH/MYSQL_RECREATE_SCHEMA.log
mysql.exe -u$DB_USER -p$DB_PWD -h$DB_HOST -D$DB_DBNAME -P$DB_PORT -v -f --init-command="set @ID='%SCHEMAID%';"<$YADAMU_TEST_HOME/mariadb/sql/RECREATE_ORACLE_ALL.sql >>$YADAMU_LOG_PATH/MYSQL_RECREATE_SCHEMA.log
mysql.exe -u$DB_USER -p$DB_PWD -h$DB_HOST -D$DB_DBNAME -P$DB_PORT -v -f --init-command="set @SCHEMA='jtest%SCHEMAID%'" <$YADAMU_TEST_HOME/mariadb/sql/RECREATE_SCHEMA.sql >>$YADAMU_LOG_PATH/MYSQL_RECREATE_SCHEMA.log
mysql.exe -u$DB_USER -p$DB_PWD -h$DB_HOST -D$DB_DBNAME -P$DB_PORT -v -f --init-command="set @SCHEMA='sakila%SCHEMAID%'" <$YADAMU_TEST_HOME/mariadb/sql/RECREATE_SCHEMA.sql >>$YADAMU_LOG_PATH/MYSQL_RECREATE_SCHEMA.log
source $YADAMU_TEST_HOME/postgres/env/dbConnection.sh
psql -U $DB_USER -d $DB_DBNAME -h $DB_HOST -a -vID=%SCHEMAID% -f $YADAMU_TEST_HOME/postgres/sql/RECREATE_MSSQL_ALL.sql >$YADAMU_LOG_PATH/POSTGRES_RECREATE_SCHEMA.log
psql -U $DB_USER -d $DB_DBNAME -h $DB_HOST -a -vID=%SCHEMAID% -f $YADAMU_TEST_HOME/postgres/sql/RECREATE_ORACLE_ALL.sql >>$YADAMU_LOG_PATH/POSTGRES_RECREATE_SCHEMA.log
psql -U $DB_USER -d $DB_DBNAME -h $DB_HOST -a -vSCHEMA=jtest -vID=%SCHEMAID% -f $YADAMU_TEST_HOME/postgres/sql/RECREATE_SCHEMA.sql >> $YADAMU_LOG_PATH/POSTGRES_RECREATE_SCHEMA.log
psql -U $DB_USER -d $DB_DBNAME -h $DB_HOST -a -vSCHEMA=sakila -vID=%SCHEMAID% -f $YADAMU_TEST_HOME/postgres/sql/RECREATE_SCHEMA.sql >> $YADAMU_LOG_PATH/POSTGRES_RECREATE_SCHEMA.log
