@set CONTAINER_NAME=%1
docker exec -it                         %CONTAINER_NAME% powershell -command New-Item -Force -ItemType directory -Path c:\stage
REM 
REM Cannot copy to Windows Container when it is running. 
REM Cannot copy to Volume mapped folder when container is not running.
REM
docker stop                             %CONTAINER_NAME%
docker cp docker/rdbms/mssql/setup      %CONTAINER_NAME%:c:\stage
docker cp docker/rdbms/mssql/testdata   %CONTAINER_NAME%:c:\stage
docker cp src/install/mssql/sql         %CONTAINER_NAME%:c:\stage
docker cp qa/sql/mssql/YADAMU_TEST.sql  %CONTAINER_NAME%:c:\stage\sql
docker start                            %CONTAINER_NAME%
docker exec -it                         %CONTAINER_NAME% cmd /c c:\stage\setup\configure.bat