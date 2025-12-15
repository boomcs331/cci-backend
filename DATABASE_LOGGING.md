# Database Logging System

## Overview
ระบบ logging ที่ใช้ฐานข้อมูล PostgreSQL สำหรับบันทึกและจัดการ logs แทนการใช้ไฟล์ เพื่อประสิทธิภาพและความสะดวกในการค้นหาและวิเคราะห์ข้อมูล

## Database Tables

### 1. api_logs
บันทึกทุก API requests และ responses

```sql
CREATE TABLE api_logs (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE,
    request_id VARCHAR(50),
    method VARCHAR(10),
    url VARCHAR(500),
    status_code INTEGER,
    duration INTEGER,
    client_ip VARCHAR(45),
    user_agent VARCHAR(500),
    request_size INTEGER,
    response_size INTEGER,
    query JSONB,
    params JSONB,
    body JSONB,
    headers JSONB,
    response JSONB,
    error TEXT,
    is_error BOOLEAN,
    is_slow BOOLEAN
);
```

### 2. auth_logs
บันทึกกิจกรรมที่เกี่ยวข้องกับ authentication

```sql
CREATE TABLE auth_logs (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE,
    action VARCHAR(50), -- LOGIN_ATTEMPT, LOGIN_SUCCESS, etc.
    username VARCHAR(100),
    email VARCHAR(255),
    user_id VARCHAR(50),
    client_ip VARCHAR(45),
    user_agent VARCHAR(500),
    duration INTEGER,
    error_message TEXT,
    roles JSONB,
    permission_count INTEGER,
    is_success BOOLEAN,
    metadata JSONB
);
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database Tables
```bash
# Run migration to create logging tables
npm run setup:logging
```

### 3. Verify Setup
```bash
# Check database health
npm run db:health
```

## Features

### 1. Automatic Logging
- ทุก API request จะถูกบันทึกอัตโนมัติ
- Authentication events จะถูกบันทึกแยกต่างหาก
- Backup ลงไฟล์เพื่อความปลอดภัย

### 2. Performance Optimization
- Indexes สำหรับการค้นหาที่รวดเร็ว
- JSONB สำหรับข้อมูล structured
- Partitioning support สำหรับข้อมูลขนาดใหญ่

### 3. Data Retention
- Automatic cleanup function
- Configurable retention period
- Archive old data

## API Endpoints

### General Logs
```bash
# Recent API calls
GET /logs/api/recent?limit=100

# Error logs
GET /logs/api/errors?limit=50

# API statistics
GET /logs/api/statistics?timeWindow=60

# Slow requests
GET /logs/api/slow?threshold=1000&limit=20

# Requests by IP
GET /logs/api/by-ip/192.168.1.100?limit=50

# Requests by endpoint
GET /logs/api/by-endpoint?method=POST&url=/auth/login&limit=50

# Database statistics
GET /logs/database/stats

# Cleanup old logs
GET /logs/database/cleanup?days=90
```

### Authentication Logs
```bash
# Recent login attempts
GET /auth/audit/recent-logins

# Failed login attempts
GET /auth/audit/failed-logins

# Login statistics
GET /auth/audit/login-statistics?timeWindow=60
```

## Database Queries

### Common Queries

#### 1. Error Rate Analysis
```sql
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE is_error = true) as error_count,
    ROUND(
        COUNT(*) FILTER (WHERE is_error = true) * 100.0 / COUNT(*), 2
    ) as error_rate_percent
FROM api_logs 
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

#### 2. Top Error Endpoints
```sql
SELECT 
    method,
    url,
    COUNT(*) as error_count,
    AVG(duration) as avg_duration
FROM api_logs 
WHERE is_error = true 
    AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY method, url
ORDER BY error_count DESC
LIMIT 10;
```

#### 3. Slow Request Analysis
```sql
SELECT 
    method,
    url,
    AVG(duration) as avg_duration,
    MAX(duration) as max_duration,
    COUNT(*) as request_count
FROM api_logs 
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY method, url
HAVING AVG(duration) > 1000
ORDER BY avg_duration DESC;
```

#### 4. Security Analysis - Failed Logins by IP
```sql
SELECT 
    client_ip,
    COUNT(*) as failed_attempts,
    MIN(timestamp) as first_attempt,
    MAX(timestamp) as last_attempt,
    ARRAY_AGG(DISTINCT username) as attempted_usernames
FROM auth_logs 
WHERE action = 'LOGIN_FAILED' 
    AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY client_ip
HAVING COUNT(*) > 5
ORDER BY failed_attempts DESC;
```

#### 5. User Activity Analysis
```sql
SELECT 
    username,
    COUNT(*) FILTER (WHERE action = 'LOGIN_SUCCESS') as successful_logins,
    COUNT(*) FILTER (WHERE action = 'LOGIN_FAILED') as failed_logins,
    MAX(timestamp) as last_activity,
    COUNT(DISTINCT client_ip) as unique_ips
FROM auth_logs 
WHERE timestamp > NOW() - INTERVAL '24 hours'
    AND username IS NOT NULL
GROUP BY username
ORDER BY successful_logins DESC;
```

### Performance Monitoring

#### 1. Response Time Percentiles
```sql
SELECT 
    method,
    url,
    COUNT(*) as request_count,
    ROUND(AVG(duration)) as avg_ms,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration)) as p50_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration)) as p95_ms,
    ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration)) as p99_ms
FROM api_logs 
WHERE timestamp > NOW() - INTERVAL '1 hour'
    AND is_error = false
GROUP BY method, url
HAVING COUNT(*) > 10
ORDER BY p95_ms DESC;
```

#### 2. Traffic Patterns
```sql
SELECT 
    DATE_TRUNC('minute', timestamp) as minute,
    COUNT(*) as requests_per_minute,
    COUNT(DISTINCT client_ip) as unique_ips,
    AVG(duration) as avg_response_time
FROM api_logs 
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY minute
ORDER BY minute;
```

## Maintenance

### 1. Regular Cleanup
```sql
-- Clean logs older than 90 days
SELECT cleanup_old_logs(90);
```

### 2. Index Maintenance
```sql
-- Reindex for better performance
REINDEX TABLE api_logs;
REINDEX TABLE auth_logs;
```

### 3. Statistics Update
```sql
-- Update table statistics
ANALYZE api_logs;
ANALYZE auth_logs;
```

### 4. Disk Usage Monitoring
```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename IN ('api_logs', 'auth_logs');
```

## Backup and Recovery

### 1. Backup Logs
```bash
# Backup specific tables
pg_dump -h localhost -U postgres -d cci_db -t api_logs -t auth_logs > logs_backup.sql

# Backup with compression
pg_dump -h localhost -U postgres -d cci_db -t api_logs -t auth_logs | gzip > logs_backup.sql.gz
```

### 2. Archive Old Data
```sql
-- Create archive table
CREATE TABLE api_logs_archive (LIKE api_logs INCLUDING ALL);

-- Move old data to archive
INSERT INTO api_logs_archive 
SELECT * FROM api_logs 
WHERE timestamp < NOW() - INTERVAL '1 year';

-- Delete archived data from main table
DELETE FROM api_logs 
WHERE timestamp < NOW() - INTERVAL '1 year';
```

## Monitoring and Alerting

### 1. Database Health Check
```sql
-- Check for recent logs
SELECT 
    'api_logs' as table_name,
    COUNT(*) as total_records,
    MAX(timestamp) as latest_record,
    COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '5 minutes') as recent_records
FROM api_logs
UNION ALL
SELECT 
    'auth_logs' as table_name,
    COUNT(*) as total_records,
    MAX(timestamp) as latest_record,
    COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '5 minutes') as recent_records
FROM auth_logs;
```

### 2. Alert Conditions
```sql
-- High error rate alert
SELECT 
    COUNT(*) FILTER (WHERE is_error = true) * 100.0 / COUNT(*) as error_rate
FROM api_logs 
WHERE timestamp > NOW() - INTERVAL '5 minutes'
HAVING COUNT(*) FILTER (WHERE is_error = true) * 100.0 / COUNT(*) > 10;

-- Multiple failed logins alert
SELECT 
    client_ip,
    COUNT(*) as failed_attempts
FROM auth_logs 
WHERE action = 'LOGIN_FAILED' 
    AND timestamp > NOW() - INTERVAL '5 minutes'
GROUP BY client_ip
HAVING COUNT(*) > 5;
```

## Configuration

### Environment Variables
```bash
# Database connection
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=cci_db

# Logging settings
LOG_RETENTION_DAYS=90
SLOW_REQUEST_THRESHOLD=1000
```

### Application Settings
```typescript
// In your app configuration
export const loggingConfig = {
  retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '90'),
  slowRequestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD || '1000'),
  enableFileBackup: process.env.ENABLE_FILE_BACKUP === 'true',
  enableDatabaseLogging: process.env.ENABLE_DATABASE_LOGGING !== 'false',
};
```

## Best Practices

### 1. Performance
- ใช้ connection pooling
- ตั้งค่า batch inserts สำหรับ high-volume logging
- ใช้ async logging เพื่อไม่ให้กระทบ API performance

### 2. Security
- ไม่บันทึกข้อมูลสำคัญ (passwords, tokens)
- จำกัดการเข้าถึง log tables
- ใช้ SSL สำหรับ database connections

### 3. Monitoring
- ตั้ง alerts สำหรับ high error rates
- Monitor disk usage
- ตรวจสอบ database performance metrics

### 4. Data Retention
- กำหนด retention policy ที่เหมาะสม
- ใช้ partitioning สำหรับข้อมูลขนาดใหญ่
- Archive old data แทนการลบทิ้ง

## Troubleshooting

### Common Issues

#### 1. High Disk Usage
```sql
-- Check table sizes
SELECT pg_size_pretty(pg_total_relation_size('api_logs'));

-- Clean old data
SELECT cleanup_old_logs(30); -- Keep only 30 days
```

#### 2. Slow Queries
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE query LIKE '%api_logs%' 
ORDER BY mean_time DESC;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_api_logs_custom 
ON api_logs(timestamp, client_ip) 
WHERE is_error = true;
```

#### 3. Connection Issues
```bash
# Check database connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'cci_db';

# Check for locks
SELECT * FROM pg_locks WHERE NOT granted;
```