REM Run from YADAMU_HOME
@set YADAMU_HOME=%CD%
@set YADAMU_QA_HOME=%YADAMU_HOME%\qa
if not defined NODE_NO_WARNINGS set NODE_NO_WARNINGS=1
node %YADAMU_HOME%\app\YADAMU_QA\common\node\test.js CONFIG=%1
