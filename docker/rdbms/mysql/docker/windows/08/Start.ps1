$service = Get-Service -Name MySQL -ErrorAction SilentlyContinue
if($service -eq $null) {
  Start-Sleep -Seconds $ENV:DELAY
  $NOW = Get-Date -Format "o"
  Write-Output "$NOW MySQL: Creating Database Service ""MySQL""."
  mysqld --initialize-insecure --log-error="C:\ProgramData\MySQL\8.0\data\MySQL.log"
  mysqld --install MySQL
  Start-Service MySQL
  $NOW = Get-Date -Format "o"
  Write-Output "$NOW MySQL: Database Service ""MySQL"" created."
  mysql -uroot -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'oracle';"  
}
$NOW = Get-Date -Format "o"
Write-Output "$NOW MySQL: Container Ready. Monitoring Logs."
GET-Content -Path "C:\ProgramData\MySQL\8.0\data\MySQL.log"  -Wait -erroraction 'silentlycontinue'
Wait-Event
