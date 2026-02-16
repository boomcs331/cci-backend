# API Documentation - CPS v1 Backend

## Base URL
```
http://localhost:3000
```

## 📋 สารบัญ
- [System Health](#system-health)
- [Authentication & Authorization](#authentication--authorization)
- [Materials Management](#materials-management)
- [Master Data](#master-data)
- [Products Management](#products-management)
- [Material Transactions](#material-transactions)

---

## 🏥 System Health

### GET `/`
**คำอธิบาย:** ตรวจสอบสถานะระบบพื้นฐาน
```json
{
  "message": "Hello World!"
}
```

### GET `/health`
**คำอธิบาย:** ตรวจสอบสุขภาพระบบ
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🔐 Authentication & Authorization

### 👤 User Management

#### POST `/auth/register`
**คำอธิบาย:** สมัครสมาชิกใหม่
**Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### POST `/auth/login`
**คำอธิบาย:** เข้าสู่ระบบ
**Body:**
```json
z
```

#### GET `/auth/users`
**คำอธิบาย:** ดูรายการผู้ใช้ทั้งหมด

#### GET `/auth/users/:id`
**คำอธิบาย:** ดูข้อมูลผู้ใช้ตาม ID

#### PUT `/auth/users/:id`
**คำอธิบาย:** แก้ไขข้อมูลผู้ใช้

#### DELETE `/auth/users/:id`
**คำอธิบาย:** ลบผู้ใช้

#### PATCH `/auth/users/:id/toggle-status`
**คำอธิบาย:** เปลี่ยนสถานะผู้ใช้ (เปิด/ปิด)

#### GET `/auth/users/:id/permissions`
**คำอธิบาย:** ดูสิทธิ์ของผู้ใช้

#### GET `/auth/profile/:id`
**คำอธิบาย:** ดูโปรไฟล์ผู้ใช้

### 🎭 Role Management

#### POST `/auth/roles`
**คำอธิบาย:** สร้างบทบาทใหม่
**Body:**
```json
{
  "name": "string",
  "code": "string",
  "description": "string"
}
```

#### POST `/auth/roles-with-permissions`
**คำอธิบาย:** สร้างบทบาทพร้อมสิทธิ์

#### GET `/auth/roles`
**คำอธิบาย:** ดูรายการบทบาททั้งหมด

#### GET `/auth/roles/:id`
**คำอธิบาย:** ดูข้อมูลบทบาทตาม ID

#### PUT `/auth/roles/:id`
**คำอธิบาย:** แก้ไขข้อมูลบทบาท

#### DELETE `/auth/roles/:id`
**คำอธิบาย:** ลบบทบาท

#### PATCH `/auth/roles/:id/toggle-status`
**คำอธิบาย:** เปลี่ยนสถานะบทบาท

#### GET `/auth/roles/:id/users`
**คำอธิบาย:** ดูผู้ใช้ที่มีบทบาทนี้

### 🔑 Permission Management

#### POST `/auth/permissions`
**คำอธิบาย:** สร้างสิทธิ์ใหม่
**Body:**
```json
{
  "name": "string",
  "code": "string",
  "module": "string",
  "description": "string"
}
```

#### GET `/auth/permissions`
**คำอธิบาย:** ดูรายการสิทธิ์ทั้งหมด

#### GET `/auth/permissions/:id`
**คำอธิบาย:** ดูข้อมูลสิทธิ์ตาม ID

#### PUT `/auth/permissions/:id`
**คำอธิบาย:** แก้ไขข้อมูลสิทธิ์

#### DELETE `/auth/permissions/:id`
**คำอธิบาย:** ลบสิทธิ์

#### GET `/auth/permissions/:id/roles`
**คำอธิบาย:** ดูบทบาทที่มีสิทธิ์นี้

#### GET `/auth/permissions/modules/:module`
**คำอธิบาย:** ดูสิทธิ์ตามโมดูล

#### GET `/auth/modules`
**คำอธิบาย:** ดูรายการโมดูลทั้งหมด

### 🔗 Role-Permission Relations

#### PUT `/auth/roles/:id/permissions`
**คำอธิบาย:** กำหนดสิทธิ์ให้บทบาท
**Body:**
```json
{
  "permissionIds": ["string"]
}
```

#### POST `/auth/roles/:roleId/permissions/:permissionId`
**คำอธิบาย:** เพิ่มสิทธิ์ให้บทบาท

#### DELETE `/auth/roles/:roleId/permissions/:permissionId`
**คำอธิบาย:** ลบสิทธิ์ออกจากบทบาท

### 👥 User-Role Relations

#### PUT `/auth/users/:id/roles`
**คำอธิบาย:** กำหนดบทบาทให้ผู้ใช้
**Body:**
```json
{
  "roleIds": ["string"]
}
```

#### POST `/auth/users/:userId/roles/:roleId`
**คำอธิบาย:** เพิ่มบทบาทให้ผู้ใช้

#### DELETE `/auth/users/:userId/roles/:roleId`
**คำอธิบาย:** ลบบทบาทออกจากผู้ใช้

### 📊 Audit Logs

#### GET `/auth/audit/recent-logins`
**คำอธิบาย:** ดูประวัติการเข้าสู่ระบบล่าสุด

#### GET `/auth/audit/failed-logins`
**คำอธิบาย:** ดูประวัติการเข้าสู่ระบบที่ล้มเหลว

#### GET `/auth/audit/login-statistics`
**คำอธิบาย:** ดูสถิติการเข้าสู่ระบบ
**Query Parameters:**
- `timeWindow`: ช่วงเวลา (นาที)

---

## 📦 Materials Management

### 🧱 Materials

#### POST `/materials`
**คำอธิบาย:** สร้างวัสดุใหม่
**Body:**
```json
{
  "matName": "string",
  "matCode": "string",
  "unit": "string",
  "locationId": "number"
}
```

#### GET `/materials`
**คำอธิบาย:** ดูรายการวัสดุแบบแบ่งหน้า
**Query Parameters:**
- `page`: หน้า (default: 1)
- `limit`: จำนวนต่อหน้า (default: 10)
- `search`: คำค้นหา
- `sortBy`: เรียงตาม (default: id)
- `sortOrder`: ลำดับ (ASC/DESC)
- `locationId`: ID สถานที่
- `unit`: หน่วย
- `isActive`: สถานะ (true/false)

#### GET `/materials/all`
**คำอธิบาย:** ดูรายการวัสดุทั้งหมด (ไม่แบ่งหน้า)

#### GET `/materials/:id`
**คำอธิบาย:** ดูข้อมูลวัสดุตาม ID

#### PATCH `/materials/:id`
**คำอธิบาย:** แก้ไขข้อมูลวัสดุ

#### DELETE `/materials/:id`
**คำอธิบาย:** ลบวัสดุ

### 📍 Material Types & Locations

#### POST `/materials/types`
**คำอธิบาย:** สร้างประเภทวัสดุใหม่

#### GET `/materials/types/all`
**คำอธิบาย:** ดูรายการประเภทวัสดุทั้งหมด

#### POST `/materials/locations`
**คำอธิบาย:** สร้างสถานที่เก็บวัสดุใหม่

#### GET `/materials/locations/all`
**คำอธิบาย:** ดูรายการสถานที่เก็บวัสดุทั้งหมด

### 📈 Stock Management

#### POST `/materials/stock/receive`
**คำอธิบาย:** รับวัสดุเข้าสต็อก
**Body:**
```json
{
  "materialId": "number",
  "quantity": "number",
  "unit": "string"
}
```

#### POST `/materials/stock/issue`
**คำอธิบาย:** เบิกวัสดุออกจากสต็อก

### 🏢 Suppliers

#### POST `/materials/suppliers`
**คำอธิบาย:** สร้างผู้จำหน่ายใหม่
**Body:**
```json
{
  "name": "string",
  "code": "string",
  "contact": "string"
}
```

#### GET `/materials/suppliers/all`
**คำอธิบาย:** ดูรายการผู้จำหน่ายทั้งหมด

#### GET `/materials/suppliers/:id`
**คำอธิบาย:** ดูข้อมูลผู้จำหน่ายตาม ID

#### PUT `/materials/suppliers/:id`
**คำอธิบาย:** แก้ไขข้อมูลผู้จำหน่าย

#### DELETE `/materials/suppliers/:id`
**คำอธิบาย:** ลบผู้จำหน่าย

---

## 🎯 Master Data

### 🏷️ Models

#### POST `/masters/models`
**คำอธิบาย:** สร้างโมเดลใหม่
**Body:**
```json
{
  "name": "string",
  "code": "string",
  "description": "string"
}
```

#### GET `/masters/models`
**คำอธิบาย:** ดูรายการโมเดลทั้งหมด

#### GET `/masters/models/:id`
**คำอธิบาย:** ดูข้อมูลโมเดลตาม ID

#### PUT `/masters/models/:id`
**คำอธิบาย:** แก้ไขข้อมูลโมเดล

#### DELETE `/masters/models/:id`
**คำอธิบาย:** ลบโมเดล

### 🚚 Delivery Types

#### POST `/masters/delivery-types`
**คำอธิบาย:** สร้างประเภทการส่งใหม่

#### GET `/masters/delivery-types`
**คำอธิบาย:** ดูรายการประเภทการส่งทั้งหมด

#### GET `/masters/delivery-types/:id`
**คำอธิบาย:** ดูข้อมูลประเภทการส่งตาม ID

#### PUT `/masters/delivery-types/:id`
**คำอธิบาย:** แก้ไขข้อมูลประเภทการส่ง

#### DELETE `/masters/delivery-types/:id`
**คำอธิบาย:** ลบประเภทการส่ง

### 📏 Units

#### POST `/masters/units`
**คำอธิบาย:** สร้างหน่วยใหม่

#### GET `/masters/units`
**คำอธิบาย:** ดูรายการหน่วยทั้งหมด

#### GET `/masters/units/:id`
**คำอธิบาย:** ดูข้อมูลหน่วยตาม ID

#### PUT `/masters/units/:id`
**คำอธิบาย:** แก้ไขข้อมูลหน่วย

#### DELETE `/masters/units/:id`
**คำอธิบาย:** ลบหน่วย

### 📍 Loading Points

#### POST `/masters/loading-points`
**คำอธิบาย:** สร้างจุดขนถ่ายใหม่

#### GET `/masters/loading-points`
**คำอธิบาย:** ดูรายการจุดขนถ่ายทั้งหมด

#### GET `/masters/loading-points/:id`
**คำอธิบาย:** ดูข้อมูลจุดขนถ่ายตาม ID

#### PUT `/masters/loading-points/:id`
**คำอธิบาย:** แก้ไขข้อมูลจุดขนถ่าย

#### DELETE `/masters/loading-points/:id`
**คำอธิบาย:** ลบจุดขนถ่าย

### ⚙️ Process Lines

#### POST `/masters/process-lines`
**คำอธิบาย:** สร้างสายการผลิตใหม่

#### GET `/masters/process-lines`
**คำอธิบาย:** ดูรายการสายการผลิตทั้งหมด

#### GET `/masters/process-lines/:id`
**คำอธิบาย:** ดูข้อมูลสายการผลิตตาม ID

#### PUT `/masters/process-lines/:id`
**คำอธิบาย:** แก้ไขข้อมูลสายการผลิต

#### DELETE `/masters/process-lines/:id`
**คำอธิบาย:** ลบสายการผลิต

---

## 🏭 Products Management

### 📦 Products

#### POST `/products`
**คำอธิบาย:** สร้างผลิตภัณฑ์ใหม่
**Body:**
```json
{
  "productName": "string",
  "productCode": "string",
  "description": "string"
}
```

#### GET `/products`
**คำอธิบาย:** ดูรายการผลิตภัณฑ์แบบแบ่งหน้า
**Query Parameters:**
- `page`: หน้า (default: 1)
- `limit`: จำนวนต่อหน้า (default: 10)
- `search`: คำค้นหา
- `sortBy`: เรียงตาม (default: id)
- `sortOrder`: ลำดับ (ASC/DESC)
- `isActive`: สถานะ (true/false)

#### GET `/products/all`
**คำอธิบาย:** ดูรายการผลิตภัณฑ์ทั้งหมด (ไม่แบ่งหน้า)

#### GET `/products/:id`
**คำอธิบาย:** ดูข้อมูลผลิตภัณฑ์ตาม ID

#### GET `/products/code/:code`
**คำอธิบาย:** ดูข้อมูลผลิตภัณฑ์ตามรหัส

#### PUT `/products/:id`
**คำอธิบาย:** แก้ไขข้อมูลผลิตภัณฑ์

#### DELETE `/products/:id`
**คำอธิบาย:** ลบผลิตภัณฑ์

### 📋 BOM (Bill of Materials)

#### GET `/products/:id/bom`
**คำอธิบาย:** ดูรายการวัสดุในผลิตภัณฑ์

#### POST `/products/:id/bom`
**คำอธิบาย:** เพิ่มวัสดุในผลิตภัณฑ์
**Body:**
```json
{
  "boms": [
    {
      "materialId": "number",
      "quantityPerUnit": "number",
      "unit": "string",
      "sequenceOrder": "number"
    }
  ]
}
```

#### DELETE `/products/bom/:bomId`
**คำอธิบาย:** ลบวัสดุออกจากผลิตภัณฑ์

#### GET `/products/:id/calculate`
**คำอธิบาย:** คำนวณความต้องการวัสดุ
**Query Parameters:**
- `quantity`: จำนวนที่ต้องการผลิต

### 🏢 Product Support Data

#### GET `/products/locations/all`
**คำอธิบาย:** ดูรายการสถานที่ผลิตภัณฑ์ทั้งหมด

#### GET `/products/customers/all`
**คำอธิบาย:** ดูรายการลูกค้าทั้งหมด

---

## 🔄 Material Transactions

### 📥 Receiving

#### POST `/materials/transactions/receive`
**คำอธิบาย:** บันทึกการรับวัสดุ
**Body:**
```json
{
  "materialId": "number",
  "quantity": "number",
  "supplierId": "number",
  "lotNumber": "string"
}
```

#### GET `/materials/transactions/receivings`
**คำอธิบาย:** ดูรายการการรับวัสดุ
**Query Parameters:**
- `page`: หน้า (default: 1)
- `limit`: จำนวนต่อหน้า (default: 10)
- `search`: คำค้นหา
- `sortBy`: เรียงตาม (default: id)
- `sortOrder`: ลำดับ (default: DESC)
- `materialId`: ID วัสดุ
- `supplierId`: ID ผู้จำหน่าย
- `status`: สถานะ

### 📤 Issuing

#### POST `/materials/transactions/issue`
**คำอธิบาย:** บันทึกการเบิกวัสดุ
**Body:**
```json
{
  "materialId": "number",
  "quantity": "number",
  "department": "string",
  "issuingType": "string"
}
```

#### GET `/materials/transactions/issuings`
**คำอธิบาย:** ดูรายการการเบิกวัสดุ
**Query Parameters:**
- `page`: หน้า (default: 1)
- `limit`: จำนวนต่อหน้า (default: 10)
- `search`: คำค้นหา
- `sortBy`: เรียงตาม (default: id)
- `sortOrder`: ลำดับ (default: DESC)
- `materialId`: ID วัสดุ
- `department`: แผนก
- `status`: สถานะ
- `issuingType`: ประเภทการเบิก

### 📱 QR Code & Lot Management

#### GET `/materials/transactions/qr/:qrCode`
**คำอธิบาย:** ดูข้อมูล Lot จาก QR Code

#### GET `/materials/transactions/qr/:qrCode/transactions`
**คำอธิบาย:** ดูประวัติการทำรายการของ Lot

#### GET `/materials/transactions/lots`
**คำอธิบาย:** ดูรายการ Lot ทั้งหมด
**Query Parameters:**
- `page`: หน้า (default: 1)
- `limit`: จำนวนต่อหน้า (default: 10)
- `materialId`: ID วัสดุ
- `status`: สถานะ
- `locationId`: ID สถานที่

---

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🔧 Common Query Parameters

- `page`: หมายเลขหน้า (เริ่มจาก 1)
- `limit`: จำนวนรายการต่อหน้า
- `search`: คำค้นหา
- `sortBy`: ฟิลด์ที่ใช้เรียงลำดับ
- `sortOrder`: ลำดับการเรียง (ASC/DESC)
- `isActive`: กรองตามสถานะ (true/false)

## 📊 HTTP Status Codes

- `200`: OK - สำเร็จ
- `201`: Created - สร้างสำเร็จ
- `204`: No Content - ลบสำเร็จ
- `400`: Bad Request - ข้อมูลไม่ถูกต้อง
- `401`: Unauthorized - ไม่มีสิทธิ์เข้าถึง
- `404`: Not Found - ไม่พบข้อมูล
- `409`: Conflict - ข้อมูลซ้ำ
- `500`: Internal Server Error - ข้อผิดพลาดของเซิร์ฟเวอร์