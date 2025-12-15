# Database Logging Usage Examples

## การใช้งานระบบ Database Logging

### 1. Setup และ Installation

#### เริ่มต้นใช้งาน
```bash
# 1. Install dependencies
npm install

# 2. Setup database tables
npm run setup:logging

# 3. Start the application
npm run start:dev
```

#### ตรวจสอบการติดตั้ง
```bash
# Check database health
npm run db:health

# ตรวจสอบว่าตารางถูกสร้างแล้ว
curl http://localhost:3000/logs/database/stats
```

### 2. การดู Logs ผ่าน API

#### ดู API Logs ล่าสุด
```bash
# ดู 50 requests ล่าสุด
curl "http://localhost:3000/logs/api/recent?limit=50" | jq

# Response
{
  "logs": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "timestamp": "2024-12-10T10:30:00.000Z",
      "requestId": "abc123def456",
      "method": "POST",
      "url": "/auth/login",
      "statusCode": 200,
      "duration": 150,
      "clientIp": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "requestSize": 45,
      "responseSize": 234,
      "isError": false,
      "isSlow": false
    }
  ],
  "count": 50
}
```

#### ดู Error Logs
```bash
# ดู errors ล่าสุด
curl "http://localhost:3000/logs/api/errors?limit=20" | jq

# Response
{
  "logs": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "timestamp": "2024-12-10T10:25:00.000Z",
      "requestId": "xyz789abc123",
      "method": "POST",
      "url": "/auth/login",
      "statusCode": 401,
      "duration": 50,
      "clientIp": "192.168.1.999",
      "error": "Invalid credentials",
      "isError": true
    }
  ],
  "count": 20
}
```

#### ดูสถิติการใช้งาน API
```bash
# สถิติใน 1 ชั่วโมงที่ผ่านมา
curl "http://localhost:3000/logs/api/statistics?timeWindow=60" | jq

# Response
{
  "statistics": {
    "totalRequests": 150,
    "successfulRequests": 140,
    "clientErrors": 8,
    "serverErrors": 2,
    "averageResponseTime": 245,
    "slowestRequest": {
      "method": "GET",
      "url": "/auth/users",
      "duration": 1500
    },
    "fastestRequest": {
      "method": "GET",
      "url": "/health",
      "duration": 5
    },
    "topEndpoints": {
      "POST /auth/login": 45,
      "GET /auth/users": 30
    },
    "topIPs": {
      "192.168.1.100": 25,
      "192.168.1.101": 20
    }
  },
  "timeWindowMinutes": 60
}
```

### 3. Authentication Logs

#### ดู Login Attempts
```bash
# ดู login attempts ล่าสุด
curl "http://localhost:3000/auth/audit/recent-logins" | jq

# Response
{
  "logs": [
    {
      "id": "789e0123-e89b-12d3-a456-426614174002",
      "timestamp": "2024-12-10T10:30:00.000Z",
      "action": "LOGIN_SUCCESS",
      "username": "admin",
      "email": "admin@example.com",
      "userId": "1",
      "clientIp": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "duration": 150,
      "roles": ["ADMIN"],
      "permissionCount": 10,
      "isSuccess": true
    }
  ]
}
```

#### ดู Failed Login Attempts
```bash
# ดู failed logins ใน 1 ชั่วโมงที่ผ่านมา
curl "http://localhost:3000/auth/audit/failed-logins" | jq

# Response
{
  "logs": [
    {
      "id": "abc1234-e89b-12d3-a456-426614174003",
      "timestamp": "2024-12-10T10:25:00.000Z",
      "action": "LOGIN_FAILED",
      "username": "hacker",
      "clientIp": "192.168.1.999",
      "userAgent": "curl/7.68.0",
      "duration": 50,
      "errorMessage": "Invalid credentials",
      "isSuccess": false
    }
  ]
}
```

#### ดูสถิติ Login
```bash
# สถิติ login ใน 1 ชั่วโมงที่ผ่านมา
curl "http://localhost:3000/auth/audit/login-statistics?timeWindow=60" | jq

# Response
{
  "statistics": {
    "totalAttempts": 100,
    "successfulLogins": 85,
    "failedLogins": 15,
    "successRate": 85,
    "topFailedIPs": {
      "192.168.1.999": 10,
      "192.168.1.888": 5
    }
  },
  "timeWindowMinutes": 60
}
```

### 4. Performance Monitoring

#### ดู Slow Requests
```bash
# ดู requests ที่ช้ากว่า 1 วินาที
curl "http://localhost:3000/logs/api/slow?threshold=1000&limit=10" | jq

# Response
{
  "logs": [
    {
      "method": "GET",
      "url": "/auth/users",
      "duration": 2500,
      "timestamp": "2024-12-10T10:20:00.000Z",
      "clientIp": "192.168.1.100",
      "isSlow": true
    }
  ],
  "count": 10,
  "thresholdMs": 1000
}
```

#### ดู Database Statistics
```bash
# ดูสถิติฐานข้อมูล
curl "http://localhost:3000/logs/database/stats" | jq

# Response
{
  "databaseStats": {
    "totalLogs": 50000,
    "errorLogs": 2500,
    "slowLogs": 1200,
    "oldestLog": "2024-11-10T10:00:00.000Z",
    "newestLog": "2024-12-10T10:30:00.000Z"
  }
}
```

### 5. Security Monitoring

#### ตรวจสอบ Requests จาก IP เฉพาะ
```bash
# ดู requests จาก IP ที่น่าสงสัย
curl "http://localhost:3000/logs/api/by-ip/192.168.1.999?limit=20" | jq

# Response
{
  "logs": [
    {
      "method": "POST",
      "url": "/auth/login",
      "statusCode": 401,
      "timestamp": "2024-12-10T10:25:00.000Z",
      "error": "Invalid credentials",
      "clientIp": "192.168.1.999"
    }
  ],
  "count": 20,
  "ip": "192.168.1.999"
}
```

#### ตรวจสอบ Endpoint เฉพาะ
```bash
# ดู login attempts ทั้งหมด
curl "http://localhost:3000/logs/api/by-endpoint?method=POST&url=/auth/login&limit=50" | jq

# Response
{
  "logs": [
    {
      "method": "POST",
      "url": "/auth/login",
      "statusCode": 200,
      "duration": 150,
      "clientIp": "192.168.1.100",
      "timestamp": "2024-12-10T10:30:00.000Z"
    }
  ],
  "count": 50,
  "method": "POST",
  "url": "/auth/login"
}
```

### 6. Database Queries

#### การใช้งาน SQL โดยตรง
```sql
-- ดู error rate ในแต่ละชั่วโมง
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

-- ดู top error endpoints
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

-- ดู failed logins by IP
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

### 7. Maintenance Operations

#### ทำความสะอาด Old Logs
```bash
# ลบ logs เก่ากว่า 90 วัน
curl "http://localhost:3000/logs/database/cleanup?days=90" | jq

# Response
{
  "message": "Cleaned up old logs",
  "deletedCount": 15000,
  "daysToKeep": 90
}
```

#### ตรวจสอบ Health
```bash
# ตรวจสอบสถานะ logging system
curl "http://localhost:3000/logs/health" | jq

# Response
{
  "status": "healthy",
  "lastLogTime": "2024-12-10T10:30:00.000Z",
  "recentErrorCount": 2,
  "recentRequestCount": 15,
  "averageResponseTime": 245
}
```

### 8. Monitoring Scripts

#### Script ตรวจสอบ Error Rate
```bash
#!/bin/bash
# check-error-rate.sh

API_URL="http://localhost:3000"
ERROR_THRESHOLD=10

# Get statistics for last 5 minutes
STATS=$(curl -s "${API_URL}/logs/api/statistics?timeWindow=5")
ERROR_RATE=$(echo $STATS | jq -r '.statistics.clientErrors + .statistics.serverErrors')
TOTAL_REQUESTS=$(echo $STATS | jq -r '.statistics.totalRequests')

if [ $TOTAL_REQUESTS -gt 0 ]; then
    ERROR_PERCENTAGE=$((ERROR_RATE * 100 / TOTAL_REQUESTS))
    
    echo "Error rate in last 5 minutes: ${ERROR_PERCENTAGE}%"
    
    if [ $ERROR_PERCENTAGE -gt $ERROR_THRESHOLD ]; then
        echo "WARNING: High error rate detected!"
        # Send alert (Slack, email, etc.)
    fi
else
    echo "No requests in the last 5 minutes"
fi
```

#### Script ตรวจสอบ Failed Logins
```bash
#!/bin/bash
# check-failed-logins.sh

API_URL="http://localhost:3000"
FAILED_THRESHOLD=5

# Get failed logins in last 10 minutes
FAILED_LOGINS=$(curl -s "${API_URL}/auth/audit/login-statistics?timeWindow=10")
FAILED_COUNT=$(echo $FAILED_LOGINS | jq -r '.statistics.failedLogins')

echo "Failed logins in last 10 minutes: ${FAILED_COUNT}"

if [ $FAILED_COUNT -gt $FAILED_THRESHOLD ]; then
    echo "WARNING: High number of failed login attempts!"
    
    # Get top failed IPs
    TOP_IPS=$(echo $FAILED_LOGINS | jq -r '.statistics.topFailedIPs')
    echo "Top failed IPs: $TOP_IPS"
    
    # Send security alert
fi
```

### 9. Integration Examples

#### Grafana Dashboard Query
```javascript
// Grafana query for API error rate
{
  "targets": [
    {
      "rawSql": "SELECT timestamp, COUNT(*) as total, COUNT(*) FILTER (WHERE is_error = true) as errors FROM api_logs WHERE timestamp > NOW() - INTERVAL '1 hour' GROUP BY DATE_TRUNC('minute', timestamp) ORDER BY timestamp",
      "format": "time_series"
    }
  ]
}
```

#### Prometheus Metrics Endpoint
```typescript
// Add to logs controller
@Get('metrics')
async getPrometheusMetrics() {
  const stats = await this.apiAuditService.getApiStatistics(60);
  
  return `
# HELP api_requests_total Total API requests
# TYPE api_requests_total counter
api_requests_total ${stats.totalRequests}

# HELP api_errors_total Total API errors
# TYPE api_errors_total counter
api_errors_total ${stats.clientErrors + stats.serverErrors}

# HELP api_response_time_avg Average response time in milliseconds
# TYPE api_response_time_avg gauge
api_response_time_avg ${stats.averageResponseTime}
  `;
}
```

### 10. Alerting Examples

#### Slack Webhook Alert
```bash
#!/bin/bash
# slack-alert.sh

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
API_URL="http://localhost:3000"

# Check for high error rate
STATS=$(curl -s "${API_URL}/logs/api/statistics?timeWindow=5")
ERROR_COUNT=$(echo $STATS | jq -r '.statistics.clientErrors + .statistics.serverErrors')
TOTAL_REQUESTS=$(echo $STATS | jq -r '.statistics.totalRequests')

if [ $TOTAL_REQUESTS -gt 10 ] && [ $ERROR_COUNT -gt 5 ]; then
    ERROR_RATE=$((ERROR_COUNT * 100 / TOTAL_REQUESTS))
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 High error rate detected: ${ERROR_RATE}% (${ERROR_COUNT}/${TOTAL_REQUESTS} requests failed in last 5 minutes)\"}" \
        $WEBHOOK_URL
fi

# Check for failed logins
FAILED_STATS=$(curl -s "${API_URL}/auth/audit/login-statistics?timeWindow=10")
FAILED_COUNT=$(echo $FAILED_STATS | jq -r '.statistics.failedLogins')

if [ $FAILED_COUNT -gt 10 ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🔒 Security Alert: ${FAILED_COUNT} failed login attempts in last 10 minutes\"}" \
        $WEBHOOK_URL
fi
```

### 11. Performance Analysis

#### Response Time Analysis
```sql
-- Response time percentiles by endpoint
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

#### Traffic Pattern Analysis
```sql
-- Hourly traffic patterns
SELECT 
    EXTRACT(hour FROM timestamp) as hour,
    COUNT(*) as requests,
    COUNT(DISTINCT client_ip) as unique_ips,
    AVG(duration) as avg_response_time,
    COUNT(*) FILTER (WHERE is_error = true) as errors
FROM api_logs 
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

### 12. Security Analysis

#### Suspicious Activity Detection
```sql
-- Detect potential brute force attacks
SELECT 
    client_ip,
    username,
    COUNT(*) as failed_attempts,
    MIN(timestamp) as first_attempt,
    MAX(timestamp) as last_attempt,
    EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp)))/60 as duration_minutes
FROM auth_logs 
WHERE action = 'LOGIN_FAILED' 
    AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY client_ip, username
HAVING COUNT(*) > 5 
    AND EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp)))/60 < 30
ORDER BY failed_attempts DESC;
```

#### Unusual User Agent Detection
```sql
-- Find suspicious user agents
SELECT 
    user_agent,
    COUNT(*) as request_count,
    COUNT(DISTINCT client_ip) as unique_ips,
    COUNT(*) FILTER (WHERE is_error = true) as error_count
FROM api_logs 
WHERE timestamp > NOW() - INTERVAL '1 hour'
    AND (
        user_agent LIKE '%curl%' OR 
        user_agent LIKE '%wget%' OR 
        user_agent LIKE '%python%' OR
        user_agent LIKE '%bot%'
    )
GROUP BY user_agent
ORDER BY request_count DESC;
```