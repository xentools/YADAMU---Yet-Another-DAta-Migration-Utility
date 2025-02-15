@set CONTAINER_NAME=%1
docker exec -it                                  %CONTAINER_NAME% mkdir -p /opt/oracle/oradata/stage
docker cp docker/rdbms/oracle/setup              %CONTAINER_NAME%:/opt/oracle/oradata/stage
docker cp docker/rdbms/oracle/testdata           %CONTAINER_NAME%:/opt/oracle/oradata/stage
docker cp src/install/oracle/sql                 %CONTAINER_NAME%:/opt/oracle/oradata/stage
docker cp qa/sql/oracle/YADAMU_TEST.sql          %CONTAINER_NAME%:/opt/oracle/oradata/stage/sql
docker exec -it -u root -w /opt/oracle/oradata   %CONTAINER_NAME% chown -R oracle:oinstall stage
docker exec -it -u root -w /opt/oracle/oradata   %CONTAINER_NAME% chmod -R u+rwx stage
docker exec -it                                  %CONTAINER_NAME% /bin/bash /opt/oracle/oradata/stage/setup/configure.sh
