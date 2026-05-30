@echo off
cd /d "%~dp0.."
node scripts\run-migration.js %1
