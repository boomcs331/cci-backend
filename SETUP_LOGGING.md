# Setup Logging System

## Quick Start

### 1. Prerequisites
- PostgreSQL database running
- Node.js and npm installed
- Environment variables configured

### 2. Environment Variables
Create or update your `.env` file:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=cci_db

# Logging Configuration (Optional)
LOG_RETENTION_DAYS=90
SLOW_REQUEST_THRESHOLD=1000
ENABLE_FILE_BACKUP=true
ENABLE_DATABASE_LOGGING=true
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Database Tables
```bash
# Create logging tables and indexes
npm run setup:logging
```

### 5. Verify Setup
```bash
# Check database health
npm run db:health

# Start the application
npm run start:dev

# Test logging endpoints
curl http://localhost:3000/logs/health
```

## Manual Database Setup

If you prefer to run the SQL manually:

```sql
-- Connect to your PostgreSQL database
psql -h localhost -U postgres -d cci_db

-- Run the migration script
\i src/database/migrations/create-logging-tables.sql
```

## Verification

### Check Tables Created
```sql
-- List logging tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('api_logs', 'auth_logs');

-- Check table structure
\d api_logs
\d auth_logs
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:3000/logs/health

# Database stats
curl http://localhost:3000/logs/database/stats

# Recent API calls (should be empty initially)
curl http://localhost:3000/logs/api/recent?limit=10
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Check PostgreSQL is running
- Verify connection details in `.env`
- Test connection: `psql -h localhost -U postgres -d cci_db`

#### 2. Permission Denied
```
Error: permission denied for table api_logs
```

**Solution:**
```sql
-- Grant permissions to your user
GRANT ALL PRIVILEGES ON TABLE api_logs TO your_user;
GRANT ALL PRIVILEGES ON TABLE auth_logs TO your_user;
```

#### 3. Table Already Exists
```
Error: relation "api_logs" already exists
```

**Solution:**
- Tables are already created, skip setup
- Or drop and recreate:
```sql
DROP TABLE IF EXISTS api_logs CASCADE;
DROP TABLE IF EXISTS auth_logs CASCADE;
```

#### 4. TypeScript Compilation Error
```
Error: Cannot find module 'dotenv'
```

**Solution:**
```bash
# Install missing dependency
npm install --save-dev dotenv
```

### Database Performance

#### Check Index Usage
```sql
-- Check if indexes are being used
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read
FROM pg_stat_user_indexes 
WHERE tablename IN ('api_logs', 'auth_logs')
ORDER BY idx_scan DESC;
```

#### Monitor Table Sizes
```sql
-- Check table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename)) as size,
    pg_total_relation_size(tablename) as size_bytes
FROM pg_tables 
WHERE tablename IN ('api_logs', 'auth_logs');
```

## Configuration Options

### Application Settings
```typescript
// src/config/logging.config.ts
export const loggingConfig = {
  // Database logging
  enableDatabaseLogging: process.env.ENABLE_DATABASE_LOGGING !== 'false',
  
  // File backup
  enableFileBackup: process.env.ENABLE_FILE_BACKUP === 'true',
  
  // Performance thresholds
  slowRequestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD || '1000'),
  
  // Data retention
  retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '90'),
  
  // Batch settings
  batchSize: parseInt(process.env.LOG_BATCH_SIZE || '100'),
  batchInterval: parseInt(process.env.LOG_BATCH_INTERVAL || '5000'),
};
```

### Database Connection Pool
```typescript
// Optimize for logging workload
const dataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  
  // Connection pool settings for logging
  extra: {
    max: 20, // Maximum connections
    min: 5,  // Minimum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  
  // Logging settings
  logging: process.env.NODE_ENV === 'development',
  synchronize: false, // Never use in production
};
```

## Maintenance

### Regular Tasks

#### 1. Clean Old Logs
```bash
# Clean logs older than 90 days
curl "http://localhost:3000/logs/database/cleanup?days=90"

# Or via SQL
SELECT cleanup_old_logs(90);
```

#### 2. Update Statistics
```sql
-- Update table statistics for better query performance
ANALYZE api_logs;
ANALYZE auth_logs;
```

#### 3. Reindex Tables
```sql
-- Reindex for better performance (run during low traffic)
REINDEX TABLE api_logs;
REINDEX TABLE auth_logs;
```

#### 4. Vacuum Tables
```sql
-- Reclaim storage space
VACUUM ANALYZE api_logs;
VACUUM ANALYZE auth_logs;
```

### Automated Maintenance

#### Cron Job Example
```bash
# Add to crontab: crontab -e

# Clean old logs daily at 2 AM
0 2 * * * curl -s "http://localhost:3000/logs/database/cleanup?days=90" > /dev/null

# Update statistics weekly
0 3 * * 0 psql -d cci_db -c "ANALYZE api_logs; ANALYZE auth_logs;"
```

#### Application-level Cleanup
```typescript
// Add to your application startup or scheduled job
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LogMaintenanceService {
  constructor(private apiAuditService: ApiAuditService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldLogs() {
    const deletedCount = await this.apiAuditService.cleanOldLogs(90);
    console.log(`Cleaned up ${deletedCount} old log entries`);
  }
}
```

## Monitoring

### Health Checks
```bash
#!/bin/bash
# health-check.sh

API_URL="http://localhost:3000"

# Check logging system health
HEALTH=$(curl -s "${API_URL}/logs/health")
STATUS=$(echo $HEALTH | jq -r '.status')

if [ "$STATUS" != "healthy" ]; then
    echo "ERROR: Logging system is not healthy"
    echo $HEALTH
    exit 1
fi

echo "Logging system is healthy"
```

### Performance Monitoring
```sql
-- Monitor logging performance
SELECT 
    'api_logs' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '1 hour') as recent_records,
    AVG(EXTRACT(EPOCH FROM (NOW() - timestamp))) as avg_age_seconds
FROM api_logs
UNION ALL
SELECT 
    'auth_logs' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '1 hour') as recent_records,
    AVG(EXTRACT(EPOCH FROM (NOW() - timestamp))) as avg_age_seconds
FROM auth_logs;
```

## Security Considerations

### 1. Database Access
- Use dedicated database user for logging
- Grant minimal required permissions
- Use SSL connections in production

### 2. Data Privacy
- Sensitive data is automatically sanitized
- Review logged data regularly
- Implement data retention policies

### 3. Access Control
```typescript
// Protect logging endpoints
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('logs')
export class LogsController {
  // ... controller methods
}
```

## Production Deployment

### 1. Environment Configuration
```bash
# Production .env
NODE_ENV=production
ENABLE_DATABASE_LOGGING=true
ENABLE_FILE_BACKUP=false
LOG_RETENTION_DAYS=365
SLOW_REQUEST_THRESHOLD=2000
```

### 2. Database Optimization
```sql
-- Production database settings
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Restart PostgreSQL to apply settings
```

### 3. Monitoring Setup
- Set up database monitoring (pg_stat_statements)
- Configure log rotation
- Set up alerting for high error rates
- Monitor disk usage

## Support

### Getting Help
1. Check this documentation
2. Review error logs: `tail -f logs/api-audit.log`
3. Check database logs: `tail -f /var/log/postgresql/postgresql.log`
4. Test with minimal setup

### Useful Commands
```bash
# Check application logs
npm run start:dev 2>&1 | grep -i error

# Check database connectivity
psql -h localhost -U postgres -d cci_db -c "SELECT version();"

# Monitor real-time logs
tail -f logs/api-audit.log | jq '.'

# Check table sizes
psql -d cci_db -c "SELECT pg_size_pretty(pg_total_relation_size('api_logs'));"
```