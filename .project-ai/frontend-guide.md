# Frontend Guide

> เอกสารนี้สรุปสิ่งที่ frontend developer ต้องรู้เมื่อเชื่อมต่อกับ CCI Backend สำหรับรายละเอียด endpoint ทั้งหมด ดู `docs/frontend-api-wiki.md` และ `api-map.md`

## API Base URL
- **Development**: `http://localhost:3006`
- **Production**: กำหนดผ่าน environment variable / proxy
- **Global prefix**: ไม่มี (root `/`)
- **Static files**: `/uploads/<path>`

## Authentication

ปัจจุบัน backend ใช้ **header-based identity** ไม่ใช่ JWT Bearer token

### Login Flow
1. เรียก `POST /auth/login` พร้อม credentials:
```json
{
  "username": "string",
  "password": "string"
}
```

2. ได้ response:
```json
{
  "message": "Login successful",
  "user": { "id", "username", "email", "roles", "departments" },
  "permissions": ["sales_order.read", "production_orders.update", ...],
  "menus": [...]
}
```

3. เก็บ `userId`, `permissions`, `menus` ไว้ใน state
4. ส่ง headers ในทุก request ที่ต้องการ auth:
```typescript
{
  'Content-Type': 'application/json',
  'x-user-id': userId,
  'x-department-id': departmentId, // สำหรับ production module
  'x-username': username
}
```

### หมายเหตุ
- ไม่มี endpoint `/auth/refresh` หรือ `/auth/logout` ในโค้ดปัจจุบัน
- การ "logout" ทำที่ฝั่ง client โดยล้าง auth state
- `GET /auth/menu` ใช้ดึงเมนูนำทางตาม user/department

## Response Formats

### มาตรฐาน (ResponseHelper)
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated
```json
{
  "success": true,
  "message": "Products retrieved successfully",
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

### Auth Response (withMessage/withCollection)
```json
{ "message": "User created successfully", "user": {} }
{ "users": [] }
{ "message": "Login successful", "user": {}, "permissions": [], "menus": [] }
```

### Error Response
```json
{
  "success": false,
  "code": "VALIDATION_FAILED",
  "message": "ข้อมูลไม่ถูกต้อง",
  "errors": [{ "field": "email", "message": "Invalid email format" }],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## CORS

Dev origins ที่อนุญาต:
- `http://localhost:3000-3002`
- `http://127.0.0.1:3000-3002`
- Private LAN (ถ้าเปิด `CORS_DEV_ALLOW_LAN=1`)
- `*.trycloudflare.com`

Production: กำหนดผ่าน `CORS_ORIGINS`

## API Endpoints Overview

| Module | Base Path | หน้าที่ |
|--------|-----------|---------|
| Auth | `/auth` | ผู้ใช้ บทบาท สิทธิ์ แผนก เมนู |
| Sales Planning | `/sales-planning` | แผนขาย นำเข้า Excel |
| Sales Orders | `/sales/orders` | ใบสั่งขาย อนุมัติ ยกเลิก |
| Sales Dashboard | `/sales/dashboard` | Dashboard KPI |
| Sales Reports | `/sales/reports` | รายงานยอดขาย |
| Sales Import | `/sales/import` | นำเข้าใบสั่งขาย |
| Production Plans | `/production-plans` | แผนการผลิต จอง/จ่าย วัตถุดิบ |
| Production Orders | `/production-orders` | คำสั่งผลิต QR lot tracking |
| Materials | `/materials`, `/material-issues`, `/materials/transactions` | วัตถุดิบ รับ/จ่าย สต็อก |
| Products | `/products` | สินค้า BOM สต็อก การจองขาย |
| Masters | `/masters`, `/masters/products`, `/masters/production-processes`, `/masters/product-production-steps` | ข้อมูลมาตรฐาน |
| Logs | `/logs` | API logs สถิติ |
| AI Chat | `/ai/chat` | แชท AI |

ดูรายละเอียดทั้งหมดใน `docs/frontend-api-wiki.md` หรือ `api-map.md`

## Pagination

ส่วนใหญ่ใช้ `page` / `limit` (default 1/10) บาง endpoint ใช้ `skip` / `take` เช่น sales-planning import history

## File Upload

Endpoints ที่ใช้ `multipart/form-data`:
- `POST /sales/import/upload`
- `POST /sales-planning/import`
- `POST /materials/upload/document` (field: `files`, สูงสุด 10 ไฟล์)
- `POST /materials/upload/workpiece-image` (field: `file`)
- `POST /products/upload/product-image` (field: `file`)

ไฟล์ที่อัปโหลดเข้าถึงได้ที่ `/uploads/<path>` เช่น `http://localhost:3006/uploads/product-images/xxx.jpg`

## Department Scoping

Module `production-plans` และ `production-orders` ต้องส่ง `x-department-id` header บาง endpoint กรองข้อมูลตามแผนที่ผู้ใช้มีสิทธิ์

## Permission Handling

หลัง login ได้ `permissions` array มา ใช้ตรวจสอบสิทธิ์ก่อนแสดง/ซ่อนปุ่ม หรือ redirect

ตัวอย่าง permission หลัก:
- `sales_order.read`, `sales_order.create`, `sales_order.update`, `sales_order.delete`, `sales_order.approve`, `sales_order.export`
- `production_plans.read`, `production_plans.create`, `production_plans.update`, `production_plans.delete`, `production_plans.approve`, `production_plans.issue`, `production_plans.reserve`, `production_plans.generate_orders`, `production_plans.cancel`, `production_plans.manage`
- `production_orders.read`, `production_orders.create`, `production_orders.update`, `production_orders.manage`
- `products.stock.read`, `products.sales.reserve`

## Best Practices

- ตรวจสอบ `success` ใน response ก่อนใช้ data
- แสดง `message` จาก backend ให้ user เห็น
- ใช้ `pagination` สำหรับ list ทุกหน้า
- ใส่ loading state ในขณะเรียก API
- handle 401/403 โดย redirect ไปหน้า login หรือแสดง "ไม่มีสิทธิ์"
- สำหรับ production QR workflow ดู `docs/frontend-api-wiki.md` section 8

## Support
- `docs/frontend-api-wiki.md` — wiki สำหรับ frontend
- `api-map.md` — รายการ endpoint ทั้งหมด
- `domain-rules.md` — business rules
- `backend-guide.md` — backend development guide
