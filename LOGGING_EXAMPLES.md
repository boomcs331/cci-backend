# Logging System Usage Examples

## การใช้งานระบบ Logging ใน CCI Backend

### 1. ดู Logs ผ่าน API

#### ดู API Calls ล่าสุด
```bash
# ดู 50 requests ล่าสุด
curl http://localhost:3000/logs/api/recent?limit=50

# Response
{
  "logs": [
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
      "responseSize": 234
    }
  ],
  "count": 50
}
```

#### ดู Error Logs
```bash
# ดู errors ล่าสุด
curl http://localhost:3000/logs/api/errors?limit=20

# Response
{
  "logs": [
    {
      "timestamp": "2024-12-10T10:25:00.000Z",
      "requestId": "xyz789abc123",
      "method": "POST",
      "url": "/auth/login",
      "statusCode": 401,
      "duration": 50,
      "clientIp": "192.168.1.999",
      "error": "Invalid credentials"
    }
  ],
  "count": 20
}
```

#### ดูสถิติการใช้งาน
```bash
# สถิติใน 1 ชั่วโมงที่ผ่านมา
curl http://localhost:3000/logs/api/statistics?timeWindow=60

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
    "topEndpoints": {
      "POST /auth/login": 45,
      "GET /auth/users": 30,
      "GET /auth/roles": 25
    },
    "topIPs": {
      "192.168.1.100": 25,
      "192.168.1.101": 20
    }
  },
  "timeWindowMinutes": 60
}
```

### 2. ตรวจสอบ Performance Issues

#### ดู Slow Requests
```bash
# ดู requests ที่ช้ากว่า 1 วินาที
curl http://localhost:3000/logs/api/slow?threshold=1000&limit=10

# Response
{
  "logs": [
    {
      "method": "GET",
      "url": "/auth/users",
      "duration": 2500,
      "timestamp": "2024-12-10T10:20:00.000Z",
      "clientIp": "192.168.1.100"
    }
  ],
  "count": 10,
  "thresholdMs": 1000
}
```

### 3. Security Monitoring

#### ตรวจสอบ Requests จาก IP เฉพาะ
```bash
# ดู requests จาก IP ที่น่าสงสัย
curl http://localhost:3000/logs/api/by-ip/192.168.1.999?limit=20

# Response
{
  "logs": [
    {
      "method": "POST",
      "url": "/auth/login",
      "statusCode": 401,
      "timestamp": "2024-12-10T10:25:00.000Z",
      "error": "Invalid credentials"
    }
  ],
  "count": 20,
  "ip": "192.168.1.999"
}
```

#### ตรวจสอบ Login Attempts
```bash
# ดู login attempts ทั้งหมด
curl "http://localhost:3000/logs/api/by-endpoint?method=POST&url=/auth/login&limit=50"

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
    },
    {
      "method": "POST",
      "url": "/auth/login",
      "statusCode": 401,
      "duration": 50,
      "clientIp": "192.168.1.999",
      "timestamp": "2024-12-10T10:25:00.000Z"
    }
  ],
  "count": 50
}
```

### 4. Health Monitoring

#### ตรวจสอบสถานะ Logging System
```bash
curl http://localhost:3000/logs/health

# Response
{
  "status": "healthy",
  "lastLogTime": "2024-12-10T10:30:00.000Z",
  "recentErrorCount": 2,
  "recentRequestCount": 15,
  "averageResponseTime": 245
}
```

### 5. Console Output Examples

#### Normal Request
```
[HTTP] [abc123def456] POST /auth/login - IP: 192.168.1.100 - User-Agent: Mozilla/5.0...
[HTTP] [abc123def456] POST /auth/login - Status: 200 - Duration: 150ms - Size: 234 bytes
[HTTP] [abc123def456] Request completed - Duration: 150ms - Status: 200
```

#### Error Request
```
[HTTP] [xyz789abc123] POST /auth/login - IP: 192.168.1.999 - User-Agent: curl/7.68.0
[HTTP] [xyz789abc123] Error Response: {"statusCode":401,"message":"Invalid credentials"}
[HTTP] [xyz789abc123] POST /auth/login - Status: 401 - Duration: 50ms - Size: 45 bytes
```

#### Slow Request Warning
```
[HTTP] [def456ghi789] GET /auth/users - IP: 192.168.1.100 - User-Agent: Mozilla/5.0...
[HTTP] [def456ghi789] GET /auth/users - Status: 200 - Duration: 2500ms - Size: 15000 bytes
[ApiAuditService] Slow request detected: GET /auth/users - 2500ms
```

### 6. File Log Examples

#### api-audit.log
```json
{"timestamp":"2024-12-10T10:30:00.000Z","requestId":"abc123def456","method":"POST","url":"/auth/login","statusCode":200,"duration":150,"clientIp":"192.168.1.100","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36","requestSize":45,"responseSize":234,"body":{"username":"admin","password":"***HIDDEN***"},"headers":{"content-type":"application/json","user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},"response":{"message":"Login successful","user":{"id":"1","username":"admin","email":"admin@example.com"}}}
```

#### api-errors.log
```json
{"timestamp":"2024-12-10T10:25:00.000Z","requestId":"xyz789abc123","method":"POST","url":"/auth/login","statusCode":401,"duration":50,"clientIp":"192.168.1.999","userAgent":"curl/7.68.0","requestSize":40,"responseSize":25,"body":{"username":"hacker","password":"***HIDDEN***"},"error":"Invalid credentials"}
```

### 7. Monitoring Scripts

#### Check Error Rate
```bash
#!/bin/bash
# check-error-rate.sh

ERROR_COUNT=$(grep '"statusCode":[45]' logs/api-audit.log | tail -100 | wc -l)
TOTAL_COUNT=100

ERROR_RATE=$((ERROR_COUNT * 100 / TOTAL_COUNT))

echo "Error rate in last 100 requests: ${ERROR_RATE}%"

if [ $ERROR_RATE -gt 10 ]; then
    echo "WARNING: High error rate detected!"
    # Send alert
fi
```

#### Find Suspicious IPs
```bash
#!/bin/bash
# find-suspicious-ips.sh

echo "Top IPs with failed login attempts:"
grep '"url":"/auth/login"' logs/api-errors.log | \
    jq -r '.clientIp' | \
    sort | uniq -c | sort -nr | head -10

echo -e "\nIPs with high request volume:"
tail -1000 logs/api-audit.log | \
    jq -r '.clientIp' | \
    sort | uniq -c | sort -nr | head -10
```

#### Performance Report
```bash
#!/bin/bash
# performance-report.sh

echo "=== API Performance Report ==="
echo "Generated at: $(date)"
echo

echo "Slowest endpoints in last 1000 requests:"
tail -1000 logs/api-audit.log | \
    jq -r '"\(.duration) \(.method) \(.url)"' | \
    sort -nr | head -10

echo -e "\nAverage response time by endpoint:"
tail -1000 logs/api-audit.log | \
    jq -r '"\(.method) \(.url) \(.duration)"' | \
    awk '{
        key = $1 " " $2
        sum[key] += $3
        count[key]++
    } END {
        for (key in sum) {
            avg = sum[key] / count[key]
            printf "%s: %.0fms (%d requests)\n", key, avg, count[key]
        }
    }' | sort -k2 -nr
```

### 8. Integration Examples

#### Grafana Dashboard Query
```sql
-- Prometheus metrics from logs
SELECT 
    time_bucket('5m', timestamp) as time,
    COUNT(*) as requests,
    AVG(duration) as avg_response_time,
    COUNT(*) FILTER (WHERE status_code >= 400) as errors
FROM api_logs 
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY time
ORDER BY time;
```

#### Elasticsearch Query
```json
{
  "query": {
    "bool": {
      "must": [
        {"range": {"timestamp": {"gte": "now-1h"}}},
        {"range": {"statusCode": {"gte": 400}}}
      ]
    }
  },
  "aggs": {
    "top_error_endpoints": {
      "terms": {
        "script": "doc['method'].value + ' ' + doc['url'].value",
        "size": 10
      }
    }
  }
}
```

### 9. Alerting Examples

#### Slack Webhook Alert
```bash
#!/bin/bash
# slack-alert.sh

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

ERROR_COUNT=$(grep '"statusCode":[45]' logs/api-audit.log | tail -100 | wc -l)

if [ $ERROR_COUNT -gt 10 ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 High error rate detected: ${ERROR_COUNT}/100 requests failed\"}" \
        $WEBHOOK_URL
fi
```

#### Email Alert
```bash
#!/bin/bash
# email-alert.sh

SLOW_COUNT=$(jq 'select(.duration > 2000)' logs/api-audit.log | tail -50 | wc -l)

if [ $SLOW_COUNT -gt 5 ]; then
    echo "Warning: ${SLOW_COUNT} slow requests detected in last 50 requests" | \
        mail -s "CCI Backend Performance Alert" admin@example.com
fi
```

### 10. Log Analysis Commands

#### Most Active Users (by IP)
```bash
jq -r '.clientIp' logs/api-audit.log | sort | uniq -c | sort -nr | head -20
```

#### Peak Hours Analysis
```bash
jq -r '.timestamp' logs/api-audit.log | \
    cut -c12-13 | sort | uniq -c | sort -nr
```

#### Error Distribution
```bash
grep '"statusCode":[45]' logs/api-audit.log | \
    jq -r '.statusCode' | sort | uniq -c
```

#### Response Time Distribution
```bash
jq -r '.duration' logs/api-audit.log | \
    awk '{
        if ($1 < 100) bucket="<100ms"
        else if ($1 < 500) bucket="100-500ms"
        else if ($1 < 1000) bucket="500ms-1s"
        else if ($1 < 2000) bucket="1-2s"
        else bucket=">2s"
        count[bucket]++
    } END {
        for (b in count) print count[b], b
    }' | sort -nr
```