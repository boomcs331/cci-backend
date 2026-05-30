@echo off
echo Checking Sales Planning Tables...
echo.

psql -h localhost -U postgres -d cps_cci -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'sales_planning' ORDER BY table_name;" -o tables-result.txt

echo Results saved to tables-result.txt
echo.
type tables-result.txt
echo.
echo.
echo Total tables:
psql -h localhost -U postgres -d cps_cci -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'sales_planning';" -t

pause
