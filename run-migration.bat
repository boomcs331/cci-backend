@echo off
echo Running migration...
set PGPASSWORD=postgres
psql -h localhost -U postgres -d cps_cci -f database\migrations\074-sales-phase5-sales-fields.sql
echo Migration completed
pause
