param(
  [string]$DbHost = $(if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }),
  [int]$DbPort = $(if ($env:DB_PORT) { [int]$env:DB_PORT } else { 5432 }),
  [string]$DbUser = $(if ($env:DB_USER) { $env:DB_USER } else { "postgres" }),
  [string]$SourceDb = $(if ($env:DB_NAME) { $env:DB_NAME } else { "cps_cci" }),
  [string]$OutputFile = "database/schema-only.sql",
  [string[]]$Schemas = @("public", "auth", "master", "logs"),
  [string]$TargetDb = "",
  [switch]$ImportToTarget
)

$ErrorActionPreference = "Stop"

function Assert-CommandExists {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' is not available in PATH."
  }
}

function Resolve-ProjectPath {
  param([string]$RelativePath)
  $projectRoot = Split-Path -Path $PSScriptRoot -Parent
  return [System.IO.Path]::GetFullPath((Join-Path $projectRoot $RelativePath))
}

Assert-CommandExists "pg_dump"
Assert-CommandExists "psql"
if ($ImportToTarget) {
  Assert-CommandExists "createdb"
}

$resolvedOutputFile = Resolve-ProjectPath -RelativePath $OutputFile
$outputDirectory = Split-Path -Path $resolvedOutputFile -Parent
if (-not (Test-Path $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

$schemaArgs = @()
foreach ($schema in $Schemas) {
  $schemaArgs += @("-n", $schema)
}

$dumpArgs = @(
  "-h", $DbHost,
  "-p", "$DbPort",
  "-U", $DbUser,
  "-d", $SourceDb,
  "--schema-only",
  "--no-owner",
  "--no-privileges"
) + $schemaArgs + @("-f", $resolvedOutputFile)

Write-Host "Exporting schema-only SQL from '$SourceDb'..."
& pg_dump @dumpArgs
if ($LASTEXITCODE -ne 0) {
  throw "pg_dump failed with exit code $LASTEXITCODE"
}
Write-Host "Schema export completed: $resolvedOutputFile"

if ($ImportToTarget) {
  if ([string]::IsNullOrWhiteSpace($TargetDb)) {
    throw "TargetDb is required when ImportToTarget is set."
  }

  $createDbArgs = @("-h", $DbHost, "-p", "$DbPort", "-U", $DbUser, $TargetDb)
  $psqlArgs = @("-h", $DbHost, "-p", "$DbPort", "-U", $DbUser, "-d", $TargetDb, "-f", $resolvedOutputFile)

  Write-Host "Creating target database '$TargetDb'..."
  & createdb @createDbArgs
  if ($LASTEXITCODE -ne 0) {
    throw "createdb failed with exit code $LASTEXITCODE"
  }

  Write-Host "Importing schema into '$TargetDb'..."
  & psql @psqlArgs
  if ($LASTEXITCODE -ne 0) {
    throw "psql import failed with exit code $LASTEXITCODE"
  }

  Write-Host "Schema import completed for '$TargetDb'."
}
