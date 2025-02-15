set STAGE=c:\ProgramData\MariaDB\10\stage
cd %STAGE%
mkdir log
set DB_USER=root
set DB_PWD=oracle
set DB_DBNAME=mysql
mysql   -u%DB_USER% -p%DB_PWD% -D%DB_DBNAME% -v -f < setup\configure.sql > log\configure.log
mysqlsh -u%DB_USER% -p%DB_PWD% -D%DB_DBNAME% --js --interactive --file=setup\YADAMU_INSTALL.js
mysql   -u%DB_USER% -p%DB_PWD% -D%DB_DBNAME% -v -f < sql\YADAMU_TEST.sql > log\YADAMU_TEST.log