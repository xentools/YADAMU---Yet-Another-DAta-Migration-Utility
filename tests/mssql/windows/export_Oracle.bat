@set TGT=%~1
@set SCHEMAVER=%~2
@set FILEVER=%~3
node %YADAMU_DB_ROOT%\node\export --username=%DB_USER% --hostname=%DB_HOST% --password=%DB_PWD% --database=HR%SCHEMAVER% file=%TGT%\HR%FILEVER%.json owner=\"dbo\" mode=%MODE% log_file=%EXPORTLOG%
node %YADAMU_DB_ROOT%\node\export --username=%DB_USER% --hostname=%DB_HOST% --password=%DB_PWD% --database=SH%SCHEMAVER% file=%TGT%\SH%FILEVER%.json owner=\"dbo\" mode=%MODE% log_file=%EXPORTLOG%
node %YADAMU_DB_ROOT%\node\export --username=%DB_USER% --hostname=%DB_HOST% --password=%DB_PWD% --database=OE%SCHEMAVER% file=%TGT%\OE%FILEVER%.json owner=\"dbo\" mode=%MODE% log_file=%EXPORTLOG%
node %YADAMU_DB_ROOT%\node\export --username=%DB_USER% --hostname=%DB_HOST% --password=%DB_PWD% --database=PM%SCHEMAVER% file=%TGT%\PM%FILEVER%.json owner=\"dbo\" mode=%MODE% log_file=%EXPORTLOG%
node %YADAMU_DB_ROOT%\node\export --username=%DB_USER% --hostname=%DB_HOST% --password=%DB_PWD% --database=IX%SCHEMAVER% file=%TGT%\IX%FILEVER%.json owner=\"dbo\" mode=%MODE% log_file=%EXPORTLOG%
node %YADAMU_DB_ROOT%\node\export --username=%DB_USER% --hostname=%DB_HOST% --password=%DB_PWD% --database=BI%SCHEMAVER% file=%TGT%\BI%FILEVER%.json owner=\"dbo\" mode=%MODE% log_file=%EXPORTLOG%
