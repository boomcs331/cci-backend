# Quick Setup Guide

## Database Connection Issue Fix

### Step 1: Test Database Connection
```bash
# Test your database connection first
npm run db:test
```

### Step 2: Fix Common Issues

#### Issue: Password Authentication Failed
```
Error: password authentication failed for user "postgres"
```

**Solution A: Update .env file**
```bash
# Copy example file
cp .env.example .env

# Edit .env with your actual credentials
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=boom9203106  # Your actual password
DB_NAME=cps_cci      # Your actual database name
```

**Solution B: Create PostgreSQL User**
```sql
-- Connect as superuser
psql -U postgres

-- Create user with password
CREATE USER your_user WITH PASSWORD 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cps_cci TO your_user;

-- Grant schema privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO your_user;

-- Exit
\q
```

#### Issue: Database Does Not Exist
```
Error: database "cci_db" does not exist
```

**Solution:**
```sql
-- Connect as postgres user
psql -U postgres

-- Create database
CREATE DATABASE cps_cci;

-- Grant access to your user
GRANT ALL PRIVILEGES ON DATABASE cps_cci TO postgres;

-- Exit
\q
```

#### Issue: PostgreSQL Not Running
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Windows
net start postgresql-x64-14

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Check if running
ps aux | grep postgres
```

### Step 3: Verify Connection
```bash
# Test connection manually
psql -h localhost -p 5432 -U postgres -d cps_cci

# Or use our test script
npm run db:test
```

### Step 4: Setup Logging Tables
```bash
# Once connection works, setup logging
npm run setup:logging
```

### Step 5: Start Application
```bash
npm run start:dev
```

## Current Database Configuration

Based on your .env file:
- **Host:** localhost
- **Port:** 5432
- **User:** postgres
- **Password:** boom9203106
- **Database:** cps_cci

## Quick Commands

```bash
# 1. Test database connection
npm run db:test

# 2. Setup logging tables (after connection works)
npm run setup:logging

# 3. Check database health
npm run db:health

# 4. Start application
npm run start:dev

# 5. Test logging endpoints
curl http://localhost:3000/logs/health
```

## Manual Database Setup

If scripts don't work, you can setup manually:

```sql
-- 1. Connect to PostgreSQL
psql -U postgres -d cps_cci

-- 2. Run the migration
\i src/database/migrations/create-logging-tables.sql

-- 3. Verify tables created
\dt

-- 4. Check table structure
\d api_logs
\d auth_logs
```

## Troubleshooting

### Check PostgreSQL Status
```bash
# Check if PostgreSQL is running
pg_ctl status

# Or check processes
ps aux | grep postgres
```

### Check User Permissions
```sql
-- Connect as postgres
psql -U postgres

-- Check if user exists
SELECT usename FROM pg_user WHERE usename = 'postgres';

-- Check database permissions
SELECT datname FROM pg_database WHERE datname = 'cps_cci';

-- Check current user permissions
SELECT current_user, current_database();
```

### Reset PostgreSQL Password (if needed)
```bash
# Windows - Edit pg_hba.conf to trust, restart service, then:
psql -U postgres
ALTER USER postgres PASSWORD 'new_password';

# macOS/Linux
sudo -u postgres psql
ALTER USER postgres PASSWORD 'new_password';
```

## Success Indicators

When everything works, you should see:
```
✅ Database connection successful!
✅ Query successful!
✅ Found existing logging tables:
   - api_logs
   - auth_logs
🎉 Database connection test completed successfully!
```

## Next Steps

After successful setup:
1. Start the application: `npm run start:dev`
2. Test API endpoints: `curl http://localhost:3000/logs/health`
3. Check logging: Make some API calls and view logs
4. Monitor: Use the logging dashboard endpoints

## Need Help?

1. Run `npm run db:test` for detailed diagnostics
2. Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql.log`
3. Verify .env file configuration
4. Test manual connection: `psql -h localhost -U postgres -d cps_cci`