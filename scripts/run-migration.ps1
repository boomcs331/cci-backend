$ErrorActionPreference = "Stop"

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
$migrationFile = $args[0]

if (-not $migrationFile) {
    Write-Error "Usage: .\scripts\run-migration.ps1 <migration-file.sql>"
    exit 1
}

$migrationPath = Join-Path $rootPath "database\migrations\$migrationFile"

if (-not (Test-Path $migrationPath)) {
    Write-Error "Migration file not found: $migrationPath"
    exit 1
}

Write-Host "Running migration: $migrationFile"
Write-Host "Path: $migrationPath"

& node "$scriptPath\run-migration-simple.js"
