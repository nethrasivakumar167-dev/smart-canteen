Set-Location (Split-Path $PSScriptRoot -Parent)
docker info *> $null
if ($LASTEXITCODE -ne 0) { Write-Host "Start Docker Desktop first."; exit 1 }
docker compose up -d postgres
do { Start-Sleep 2; $s = docker inspect -f '{{.State.Health.Status}}' smart-canteen-postgres } until ($s -eq 'healthy')
Write-Host "Postgres is healthy."
if (netstat -ano | findstr ":5000 " | findstr LISTENING) { Write-Host "Port 5000 is busy. Stop the old process first." }