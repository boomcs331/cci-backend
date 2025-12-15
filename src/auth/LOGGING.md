# Authentication Logging System

## Overview
ระบบ logging สำหรับ authentication ที่บันทึกการเข้าสู่ระบบ, การสมัครสมาชิก, และกิจกรรมที่เกี่ยวข้องกับความปลอดภัย

## Features

### 1. Console Logging
- บันทึก log ใน console ผ่าน NestJS Logger
- แสดงข้อมูลสำคัญเช่น username, IP address, duration
- แยกระดับ log: LOG, WARN, ERROR

### 2. File Logging (Audit Trail)
- บันทึก audit log ลงไฟล์ `logs/auth-audit.log`
- รูปแบบ JSON สำหรับการวิเคราะห์
- เก็บข้อมูลครบถ้วนสำหรับการตรวจสอบ

### 3. Middleware Logging
- บันทึกทุก HTTP request ที่เข้ามาใน `/auth` endpoints
- ซ่อนข้อมูลรหัสผ่านในการ log
- บันทึกเวลาที่ใช้ในการประมวลผล

## Log Types

### Login Events
```json
{
  "timestamp": "2024-12-10T10:30:00.000Z",
  "action": "LOGIN_SUCCESS",
  "username": "admin",
  "email": "admin@example.com",
  "userId": "1",
  "clientIp": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "duration": 150,
  "roles": ["ADMIN"],
  "permissionCount": 10
}
```

### Registration Events
```json
{
  "timestamp": "2024-12-10T10:30:00.000Z",
  "action": "REGISTRATION_SUCCESS",
  "username": "newuser",
  "email": "newuser@example.com",
  "userId": "2",
  "clientIp": "192.168.1.101",
  "userAgent": "Mozilla/5.0...",
  "duration": 200,
  "roles": ["USER"]
}
```

### Failed Attempts
```json
{
  "timestamp": "2024-12-10T10:30:00.000Z",
  "action": "LOGIN_FAILED",
  "username": "hacker",
  "clientIp": "192.168.1.999",
  "userAgent": "curl/7.68.0",
  "duration": 50,
  "errorMessage": "Invalid credentials"
}
```

## Action Types
- `LOGIN_ATTEMPT` - เริ่มต้นการเข้าสู่ระบบ
- `LOGIN_SUCCESS` - เข้าสู่ระบบสำเร็จ
- `LOGIN_FAILED` - เข้าสู่ระบบไม่สำเร็จ
- `REGISTRATION_ATTEMPT` - เริ่มต้นการสมัครสมาชิก
- `REGISTRATION_SUCCESS` - สมัครสมาชิกสำเร็จ
- `REGISTRATION_FAILED` - สมัครสมาชิกไม่สำเร็จ

## API Endpoints

### Get Recent Login Attempts
```
GET /auth/audit/recent-logins
```
ดูการเข้าสู่ระบบล่าสุด 100 รายการ

### Get Failed Login Attempts
```
GET /auth/audit/failed-logins
```
ดูการเข้าสู่ระบบที่ล้มเหลวในช่วง 60 นาทีที่ผ่านมา

## Security Features

### 1. IP Address Tracking
- บันทึก IP address ของผู้ใช้
- ช่วยในการตรวจสอบการเข้าถึงที่ผิดปกติ

### 2. User Agent Logging
- บันทึก browser/client information
- ช่วยระบุ bot หรือการโจมตีอัตโนมัติ

### 3. Performance Monitoring
- บันทึกเวลาที่ใช้ในการประมวลผล
- ช่วยตรวจสอบการโจมตี DoS

### 4. Failed Attempt Monitoring
- ติดตามการเข้าสู่ระบบที่ล้มเหลว
- สามารถใช้สำหรับ rate limiting

## File Structure
```
logs/
└── auth-audit.log    # Audit trail file
```

## Usage Examples

### Console Output
```
[AuthController] Login attempt started - Username: admin, IP: 192.168.1.100
[AuthController] Login successful - User ID: 1, Username: admin, Duration: 150ms
[AuthMiddleware] POST /auth/login - Status: 200 - Duration: 155ms
```

### Reading Audit Logs
```typescript
// Get recent login attempts
const auditService = new AuthAuditService();
const recentLogins = auditService.getRecentLoginAttempts(50);

// Get failed attempts in last hour
const failedLogins = auditService.getFailedLoginAttempts(60);
```

## Configuration

### Log Directory
- Default: `logs/` in project root
- File: `auth-audit.log`
- Format: JSON lines (one JSON object per line)

### Log Retention
- ไฟล์ log จะเติบโตต่อเนื่อง
- ควรใช้ log rotation tool เช่น `logrotate`
- แนะนำให้เก็บ log อย่างน้อย 90 วัน

## Monitoring & Alerts

### Suspicious Activity Indicators
1. **Multiple Failed Logins**
   - มากกว่า 5 ครั้งใน 5 นาที จาก IP เดียวกัน
   
2. **Unusual User Agents**
   - curl, wget, python-requests
   - User agents ที่ไม่ใช่ browser

3. **High Frequency Requests**
   - มากกว่า 10 requests ต่อนาที จาก IP เดียวกัน

4. **Login from New Locations**
   - IP address ที่ไม่เคยเห็นมาก่อน

### Sample Monitoring Query
```bash
# Count failed logins by IP in last hour
grep "LOGIN_FAILED" logs/auth-audit.log | \
  jq -r '.clientIp' | \
  sort | uniq -c | sort -nr

# Find suspicious user agents
grep "LOGIN_" logs/auth-audit.log | \
  jq -r '.userAgent' | \
  grep -E "(curl|wget|python|bot)" | \
  sort | uniq -c
```

## Best Practices

1. **Regular Monitoring**
   - ตรวจสอบ failed login attempts ทุกวัน
   - ติดตาม unusual patterns

2. **Log Rotation**
   - ใช้ logrotate หรือเครื่องมือคล้ายกัน
   - เก็บ compressed logs สำหรับ historical analysis

3. **Alerting**
   - ตั้ง alert สำหรับ multiple failed attempts
   - แจ้งเตือนเมื่อมี suspicious activity

4. **Privacy**
   - ไม่บันทึกรหัสผ่าน
   - ระวังข้อมูลส่วนบุคคลใน logs

## Integration with SIEM
Audit logs สามารถส่งไปยัง SIEM systems เช่น:
- Elasticsearch + Kibana
- Splunk
- Azure Sentinel
- AWS CloudWatch

## Compliance
ระบบ logging นี้ช่วยให้เป็นไปตามมาตรฐาน:
- ISO 27001 (Information Security Management)
- NIST Cybersecurity Framework
- GDPR (สำหรับการตรวจสอบการเข้าถึงข้อมูล)