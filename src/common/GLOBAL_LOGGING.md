# Global API Logging System

## Overview
ระบบ logging ที่ครอบคลุมสำหรับ cci-backend ที่บันทึกทุกการเรียกใช้ API, การตอบสนอง, และข้อผิดพลาด

## Features

### 1. Global Request/Response Logging
- บันทึกทุก HTTP request และ response
- ติดตาม request ID สำหรับการ trace
- บันทึกเวลาที่ใช้ในการประมวลผล (duration)
- บันทึกขนาดของ request และ response

### 2. Security & Privacy
- ซ่อนข้อมูลสำคัญ (password, token, secret)
- บันทึก IP address และ User Agent
- กรองข้อมูล headers ที่สำคัญเท่านั้น

### 3. File-based Audit Trail
- บันทึกลงไฟล์ `logs/api-audit.log`
- บันทึก errors แยกใน `logs/api-errors.log`
- รูปแบบ JSON สำหรับการวิเคราะห์

### 4. Performance Monitoring
- ติดตาม slow requests
- สถิติการใช้งาน API
- การวิเคราะห์ traffic patterns

## Architecture

### Components
1. **GlobalLoggerMiddleware** - บันทึก HTTP requests
2. **LoggingInterceptor** - บันทึก responses และ errors
3. **ApiAuditService** - จัดการการเขียนและอ่าน logs
4. **LogsController** - API endpoints สำหรับดู logs

### Flow
```
Request → GlobalLoggerMiddleware → Controller → LoggingInterceptor → Response
                ↓                                        ↓
            Console Log                            ApiAuditService
                                                        ↓
                                                   File Logs
```

## Log Format

### API Audit Log Entry
```json
{
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
  "query": {},
  "params": {},
  "body": {
    "username": "admin",
    "password": "***HIDDEN***"
  },
  "headers": {
    "content-type": "application/json",
    "user-agent": "Mozilla/5.0..."
  },
  "response": {
    "message": "Login successful",
    "user": { "id": "1", "username": "admin" }
  }
}
```

### Error Log Entry
```json
{
  "timestamp": "2024-12-10T10:30:00.000Z",
  "requestId": "xyz789abc123",
  "method": "POST",
  "url": "/auth/login",
  "statusCode": 401,
  "duration": 50,
  "clientIp": "192.168.1.999",
  "userAgent": "curl/7.68.0",
  "requestSize": 40,
  "responseSize": 25,
  "body": {
    "username": "hacker",
    "password": "***HIDDEN***"
  },
  "error": "Invalid credentials"
}
```

## API Endpoints

### 1. Recent API Calls
```
GET /logs/api/recent?limit=100
```
ดูการเรียกใช้ API ล่าสุด

### 2. Error Logs
```
GET /logs/api/errors?limit=50
```
ดู API errors ล่าสุด

### 3. API Statistics
```
GET /logs/api/statistics?timeWindow=60
```
สถิติการใช้งาน API ในช่วงเวลาที่กำหนด (นาที)

**Response:**
```json
{
  "statistics": {
    "totalRequests": 150,
    "successfulRequests": 140,
    "clientErrors": 8,
    "serverErrors": 2,
    "averageResponseTime": 245,
    "slowestRequest": { ... },
    "fastestRequest": { ... },
    "topEndpoints": {
      "POST /auth/login": 45,
      "GET /auth/users": 30
    },
    "topIPs": {
      "192.168.1.100": 25,
      "192.168.1.101": 20
    }
  }
}
```

### 4. Slow Requests
```
GET /logs/api/slow?threshold=1000&limit=20
```
ดู requests ที่ใช้เวลานานเกินกำหนด

### 5. Requests by IP
```
GET /logs/api/by-ip/192.168.1.100?limit=50
```
ดู requests จาก IP address เฉพาะ

### 6. Requests by Endpoint
```
GET /logs/api/by-endpoint?method=POST&url=/auth/login&limit=50
```
ดู requests สำหรับ endpoint เฉพาะ

### 7. Log Health Check
```
GET /logs/health
```
ตรวจสอบสถานะของระบบ logging

## File Structure
```
logs/
├── api-audit.log     # All API requests and responses
└── api-errors.log    # Error requests only
```

## Configuration

### Sensitive Data Protection
ข้อมูลที่จะถูกซ่อนในการ log:
- **Body fields:** password, passwordHash, token, secret, apiKey, authorization
- **Headers:** authorization, cookie, x-api-key, x-auth-token

### Response Logging Rules
- ไม่ log response สำหรับ endpoints ที่มีข้อมูลขนาดใหญ่
- Truncate response ที่ใหญ่กว่า 1000 characters
- ซ่อนข้อมูลสำคัญใน response

### Performance Considerations
- Request ID generation ใช้ random string
- File writing เป็น append mode
- Console logging แยกตาม log level

## Monitoring & Alerting

### Key Metrics to Monitor
1. **Error Rate**
   - 4xx errors (client errors)
   - 5xx errors (server errors)

2. **Performance**
   - Average response time
   - Slow requests (> 1 second)
   - Request volume

3. **Security**
   - Failed login attempts
   - Suspicious IP addresses
   - Unusual user agents

### Sample Monitoring Queries

#### High Error Rate
```bash
# Count errors in last hour
grep "\"statusCode\":[45]" logs/api-audit.log | \
  jq -r 'select(.timestamp > "'$(date -d '1 hour ago' -Iseconds)'")' | \
  wc -l
```

#### Top Error Endpoints
```bash
# Find most error-prone endpoints
grep "\"statusCode\":[45]" logs/api-audit.log | \
  jq -r '"\(.method) \(.url)"' | \
  sort | uniq -c | sort -nr | head -10
```

#### Slow Requests
```bash
# Find requests slower than 2 seconds
jq 'select(.duration > 2000)' logs/api-audit.log | \
  jq -r '"\(.duration)ms \(.method) \(.url)"' | \
  sort -nr | head -10
```

#### Suspicious Activity
```bash
# Find IPs with high error rates
grep "\"statusCode\":[45]" logs/api-audit.log | \
  jq -r '.clientIp' | \
  sort | uniq -c | sort -nr | head -10
```

## Log Rotation

### Recommended Setup
```bash
# /etc/logrotate.d/cci-backend
/path/to/cci-backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 www-data www-data
    postrotate
        # Optional: restart application or send signal
    endscript
}
```

### Manual Rotation
```bash
# Rotate logs manually
mv logs/api-audit.log logs/api-audit.log.$(date +%Y%m%d)
mv logs/api-errors.log logs/api-errors.log.$(date +%Y%m%d)
gzip logs/*.log.$(date +%Y%m%d)
```

## Integration with External Systems

### ELK Stack (Elasticsearch, Logstash, Kibana)
```bash
# Logstash configuration for parsing logs
input {
  file {
    path => "/path/to/logs/api-audit.log"
    codec => "json"
  }
}

filter {
  date {
    match => [ "timestamp", "ISO8601" ]
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "cci-api-logs-%{+YYYY.MM.dd}"
  }
}
```

### Prometheus Metrics
สามารถสร้าง metrics endpoint สำหรับ Prometheus:
```typescript
// Example metrics endpoint
@Get('metrics')
async getMetrics() {
  const stats = this.apiAuditService.getApiStatistics(60);
  return `
# HELP api_requests_total Total API requests
# TYPE api_requests_total counter
api_requests_total ${stats.totalRequests}

# HELP api_response_time_avg Average response time in milliseconds
# TYPE api_response_time_avg gauge
api_response_time_avg ${stats.averageResponseTime}
  `;
}
```

## Best Practices

### 1. Log Retention
- เก็บ logs อย่างน้อย 90 วัน
- ใช้ compression สำหรับ archived logs
- พิจารณา cold storage สำหรับ long-term retention

### 2. Performance
- Monitor log file sizes
- ใช้ log rotation เพื่อป้องกันไฟล์ใหญ่เกินไป
- พิจารณาใช้ async logging สำหรับ high-traffic applications

### 3. Security
- ตรวจสอบว่าไม่มีข้อมูลสำคัญใน logs
- จำกัดการเข้าถึง log files
- ใช้ HTTPS สำหรับ log viewing endpoints

### 4. Monitoring
- ตั้ง alerts สำหรับ high error rates
- Monitor disk space สำหรับ log directory
- ตรวจสอบ log health endpoint เป็นประจำ

## Troubleshooting

### Common Issues

#### 1. Log Files Not Created
- ตรวจสอบ permissions ของ logs directory
- ตรวจสอบว่า application มีสิทธิ์เขียนไฟล์

#### 2. High Disk Usage
- ตั้งค่า log rotation
- ลบ old log files
- พิจารณา log compression

#### 3. Performance Impact
- ลด log level ใน production
- ใช้ async logging
- พิจารณา sampling สำหรับ high-traffic endpoints

#### 4. Missing Logs
- ตรวจสอบ middleware configuration
- ตรวจสอบ interceptor registration
- ดู console logs สำหรับ errors