# CCI Backend — Frontend API Wiki

> เอกสารนี้สรุปภาพรวม API ทั้งหมดที่ frontend ต้องใช้งานกับ CCI Backend โดยอ้างอิงจากโค้ดจริงในโปรเจกต์ หากมีข้อสงสัยเพิ่มเติม ให้ดู controller ที่ระบุไว้ในแต่ละ endpoint

---

## 1. ภาพรวมระบบ (Domain Map)

ระบบ CCI แบ่งเป็น module หลัก ดังนี้ เรียงตาม flow ธุรกิจ:

```
[Auth & RBAC] → [Sales Planning] → [Sales Orders] → [Production Plans] → [Production Orders] → [Materials] → [Products/Inventory]
```

| Module | หน้าที่หลัก | Base Path |
|--------|------------|-----------|
| **Auth** | จัดการผู้ใช้ บทบาท สิทธิ์ แผนก เมนู | `/auth` |
| **Sales Planning** | นำเข้าแผนขายจาก Excel, ดูข้อมูลแผนรายวัน | `/sales-planning` |
| **Sales Orders** | สร้าง/อนุมัติ/ยกเลิก ใบสั่งขาย | `/sales/orders` |
| **Sales Dashboard & Reports** | สรุปยอดขาย, รายงาน, KPI | `/sales/dashboard`, `/sales/reports` |
| **Production Plans** | แผนการผลิต, จองวัตถุดิบ, ยืนยัน/จ่ายวัตถุดิบ | `/production-plans` |
| **Production Orders** | คำสั่งผลิต, ติดตามล็อต (QR), เริ่ม/เสร็จ ขั้นตอน | `/production-orders` |
| **Materials** | วัตถุดิบ, รับเข้า/จ่ายออก, สต็อก, ล็อต, traceability | `/materials`, `/material-issues` |
| **Products** | สินค้า, BOM, สต็อกสินค้า, การจองขาย | `/products` |
| **Masters** | ข้อมูลมาตรฐาน (customers, locations, units, types, models, suppliers, process lines, ฯลฯ) | `/masters`, `/masters/products`, `/masters/production-processes`, `/masters/product-production-steps` |
| **Logs** | ตรวจสอบ API logs, สถิติ, สุขภาพระบบ | `/logs` |
| **AI Chat** | แชทกับ AI | `/ai/chat` |

---

## 2. Base URL & CORS

- **Development**: `http://localhost:3006`
- **Production**: กำหนดผ่าน environment variable (`PORT` หรือ proxy)
- **Global prefix**: ไม่มี (`/` คือ root)
- **Static files**: ไฟล์อัปโหลดเข้าถึงได้ที่ `/uploads/<path>` เช่น `/uploads/product-images/xxx.jpg`

CORS ใน dev อนุญาต origins:
- `http://localhost:3000-3002`
- `http://127.0.0.1:3000-3002`
- Private LAN หากเปิด `CORS_DEV_ALLOW_LAN=1`
- Cloudflare tunnel (`*.trycloudflare.com`)

---

## 3. Authentication & Headers

### 3.1 Login

```http
POST /auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

Response:
```json
{
  "message": "Login successful",
  "user": { "id", "username", "email", "roles", "departments" },
  "permissions": ["sales_order.read", "production_orders.update", ...],
  "menus": [...]
}
```

### 3.2 Register

```http
POST /auth/register
{
  "username": "string",
  "password": "string",
  "email": "string"
}
```

Response: `{ message: "User created successfully", user: {...} }`

### 3.3 Navigation Menu

```http
GET /auth/menu
x-user-id: <userId>
x-department-id: <departmentId>  // optional
```

Response: `{ menus: [...] }`

### 3.4 Required Headers สำหรับ Request ทั่วไป

```http
Content-Type: application/json
x-user-id: <userId>
x-department-id: <departmentId>  // สำหรับ module production-plans, production-orders
x-username: <username>           // optional สำหรับ audit log
```

**หมายเหตุ**: ปัจจุบัน backend ไม่ได้ใช้ JWT Bearer token แต่ใช้ `x-user-id` / `x-department-id` headers เป็นหลัก สำหรับ auth ใช้ตรวจสอบสิทธิ์ผ่าน permission ที่ได้จาก login

---

## 4. Response Formats

### 4.1 มาตรฐาน (ส่วนใหญ่ใช้ ResponseHelper)

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 4.2 Paginated

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 4.3 Auth Response (withMessage / withCollection)

```json
// แบบ object เดี่ยว
{ "message": "User updated successfully", "user": { ... } }

// แบบ collection
{ "users": [ ... ] }

// login
{ "message": "Login successful", "user": { ... }, "permissions": [...], "menus": [...] }
```

### 4.4 Error Response

```json
{
  "success": false,
  "code": "VALIDATION_FAILED",
  "message": "ข้อมูลไม่ถูกต้อง",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 5. Module API Reference

### 5.1 Auth (`/auth`)

| Method | Endpoint | คำอธิบาย | Permission |
|--------|----------|---------|------------|
| POST | `/auth/login` | เข้าสู่ระบบ | public |
| POST | `/auth/register` | ลงทะเบียน | public |
| GET | `/auth/menu` | เมนูนำทางตาม user/department | ต้องมี x-user-id |
| GET | `/auth/users` | รายชื่อผู้ใช้ | - |
| GET | `/auth/users/:id` | ข้อมูลผู้ใช้ | - |
| GET | `/auth/users/:id/permissions` | สิทธิ์ของผู้ใช้ | - |
| PUT | `/auth/users/:id` | แก้ไขผู้ใช้ | - |
| DELETE | `/auth/users/:id` | ลบผู้ใช้ | - |
| PATCH | `/auth/users/:id/toggle-status` | เปิด/ปิดสถานะผู้ใช้ | - |
| PUT | `/auth/users/:id/roles` | กำหนดบทบาท | - |
| PUT | `/auth/users/:id/scoped-roles` | กำหนดบทบาทต่อแผนก | - |
| DELETE | `/auth/users/:userId/roles/:roleId` | ลบบทบาทออกจากผู้ใช้ | - |
| POST | `/auth/users/:userId/roles/:roleId` | เพิ่มบทบาทให้ผู้ใช้ | - |
| GET | `/auth/roles` | รายชื่อบทบาท | admin global |
| POST | `/auth/roles` | สร้างบทบาท | admin global |
| POST | `/auth/roles-with-permissions` | สร้างบทบาทพร้อมสิทธิ์ | admin global |
| GET | `/auth/roles/:id` | ข้อมูลบทบาท | admin global |
| PUT | `/auth/roles/:id` | แก้ไขบทบาท | admin global |
| DELETE | `/auth/roles/:id` | ลบบทบาท | admin global |
| PATCH | `/auth/roles/:id/toggle-status` | เปิด/ปิดสถานะบทบาท | admin global |
| GET | `/auth/roles/:id/users` | ผู้ใช้ในบทบาท | admin global |
| PUT | `/auth/roles/:id/permissions` | กำหนดสิทธิ์ให้บทบาท | admin global |
| DELETE | `/auth/roles/:roleId/permissions/:permissionId` | ลบสิทธิ์ออกจากบทบาท | admin global |
| POST | `/auth/roles/:roleId/permissions/:permissionId` | เพิ่มสิทธิ์ให้บทบาท | admin global |
| GET | `/auth/permissions` | รายชื่อสิทธิ์ | admin global |
| POST | `/auth/permissions` | สร้างสิทธิ์ | admin global |
| GET | `/auth/permissions/:id` | ข้อมูลสิทธิ์ | admin global |
| PUT | `/auth/permissions/:id` | แก้ไขสิทธิ์ | admin global |
| DELETE | `/auth/permissions/:id` | ลบสิทธิ์ | admin global |
| GET | `/auth/permissions/modules/:module` | สิทธิ์ตาม module | admin global |
| GET | `/auth/permissions/:id/roles` | บทบาทที่มีสิทธิ์ | admin global |
| GET | `/auth/permissions/:id/roles-with-permission` | บทบาทที่มีสิทธิ์ | admin global |
| GET | `/auth/modules` | รายชื่อ module ทั้งหมด | admin global |
| GET | `/auth/departments` | รายชื่อแผนก | - |
| POST | `/auth/departments` | สร้างแผนก | admin global |
| GET | `/auth/departments/:id` | ข้อมูลแผนก | - |
| PUT | `/auth/departments/:id` | แก้ไขแผนก | admin global |
| DELETE | `/auth/departments/:id` | ลบแผนก | admin global |
| GET | `/auth/menus` | รายชื่อเมนู | - |
| POST | `/auth/menus` | สร้างเมนู | - |
| GET | `/auth/menus/:id` | ข้อมูลเมนู | - |
| PUT | `/auth/menus/:id` | แก้ไขเมนู | - |
| DELETE | `/auth/menus/:id` | ลบเมนู | - |
| GET | `/auth/audit/recent-logins` | ประวัติ login ล่าสุด | - |
| GET | `/auth/audit/failed-logins` | ประวัติ login ล้มเหลว | - |
| GET | `/auth/audit/login-statistics` | สถิติ login | - |
| GET | `/auth/profile/:id` | โปรไฟล์ผู้ใช้ | - |

---

### 5.2 Sales Planning (`/sales-planning`)

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| GET | `/sales-planning` | ดูข้อมูลแผนขาย (query: year, month, startDate, endDate, customerCode, productCode) |
| GET | `/sales-planning/row/:id` | ดูรายละเอียดแถวแผนขาย |
| DELETE | `/sales-planning/batch/:batchId` | ลบ batch ข้อมูลแผนขาย |
| GET | `/sales-planning/template` | ดาวน์โหลด template Excel สำหรับ import |
| POST | `/sales-planning/import` | นำเข้า Excel (multipart/form-data, field: `file`, body: year, month) |
| GET | `/sales-planning/import/:batchId/status` | สถานะ batch |
| GET | `/sales-planning/import/:batchId/errors` | รายการ error |
| GET | `/sales-planning/import/:batchId/rows` | ข้อมูล rows ในท batch |
| GET | `/sales-planning/import/:batchId/detail` | รายละเอียด batch |
| POST | `/sales-planning/import/:batchId/cancel` | ยกเลิก batch |
| DELETE | `/sales-planning/import/:batchId` | ลบ batch |
| POST | `/sales-planning/import/:batchId/reprocess` | ประมวลผลใหม่ |
| GET | `/sales-planning/import/:batchId/download` | ดาวน์โหลดไฟล์ต้นฉบับ |
| POST | `/sales-planning/import/history` | ประวัติการ import |

---

### 5.3 Sales Orders (`/sales/orders`)

| Method | Endpoint | คำอธิบาย | Permission |
|--------|----------|---------|------------|
| GET | `/sales/orders` | รายการใบสั่งขาย | `sales_order.read` |
| GET | `/sales/orders/pending-approval` | รายการรออนุมัติ | `sales_order.approve` |
| GET | `/sales/orders/:id` | ข้อมูลใบสั่งขาย | `sales_order.read` |
| POST | `/sales/orders` | สร้างใบสั่งขาย | `sales_order.create` |
| PATCH | `/sales/orders/:id` | แก้ไขใบสั่งขาย | `sales_order.update` |
| DELETE | `/sales/orders/:id` | ลบใบสั่งขาย | `sales_order.delete` |
| POST | `/sales/orders/:id/submit` | ส่งใบสั่งขาย | `sales_order.create` |
| POST | `/sales/orders/:id/approve` | อนุมัติ | `sales_order.approve` |
| POST | `/sales/orders/:id/reject` | ปฏิเสธ | `sales_order.approve` |
| POST | `/sales/orders/:id/cancel` | ยกเลิก | `sales_order.update` |
| POST | `/sales/orders/:id/status` | เปลี่ยนสถานะ | `sales_order.update` |
| GET | `/sales/orders/export` | ส่งออก Excel | `sales_order.export` |
| GET | `/sales/orders/export/pdf` | ส่งออก PDF | `sales_order.export` |

---

### 5.4 Sales Customers (`/sales/customers`)

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| GET | `/sales/customers` | รายชื่อลูกค้า |
| GET | `/sales/customers/:id` | ข้อมูลลูกค้า |
| POST | `/sales/customers` | สร้างลูกค้า |
| PATCH | `/sales/customers/:id` | แก้ไขลูกค้า |
| DELETE | `/sales/customers/:id` | ลบลูกค้า |

---

### 5.5 Sales Products (`/sales/products`)

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| GET | `/sales/products` | รายการสินค้าสำหรับขาย |
| GET | `/sales/products/:id` | ข้อมูลสินค้าสำหรับขาย |
| POST | `/sales/products` | สร้าง |
| PATCH | `/sales/products/:id` | แก้ไข |
| DELETE | `/sales/products/:id` | ลบ |

---

### 5.6 Sales Dashboard & Reports (`/sales/dashboard`, `/sales/reports`)

| Method | Endpoint | คำอธิบาย | Permission |
|--------|----------|---------|------------|
| GET | `/sales/dashboard/summary` | สรุปยอดขาย | `sales_order.read` |
| GET | `/sales/dashboard/kpi` | KPI | `sales_order.read` |
| GET | `/sales/dashboard/sales-chart?days=30` | กราฟยอดขาย | `sales_order.read` |
| GET | `/sales/dashboard/top-products?limit=5` | สินค้าขายดี | `sales_order.read` |
| GET | `/sales/dashboard/upcoming-deliveries?days=7` | รายการใกล้ส่ง | `sales_order.read` |
| GET | `/sales/reports/summary?year=2026` | สรุปรายงาน | `sales_order.read` |
| GET | `/sales/reports/by-customer?year=2026` | รายงานตามลูกค้า | `sales_order.read` |
| GET | `/sales/reports/by-product?year=2026` | รายงานตามสินค้า | `sales_order.read` |
| GET | `/sales/reports/monthly?year=2026` | รายงานรายเดือน | `sales_order.read` |

---

### 5.7 Sales Import (`/sales/import`)

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| GET | `/sales/import/template` | ดาวน์โหลด template |
| POST | `/sales/import/upload` | อัปโหลด Excel |
| GET | `/sales/import/batches` | รายการ batch |
| GET | `/sales/import/batches/:id` | ข้อมูล batch |
| POST | `/sales/import/commit` | ยืนยันการ import |

---

### 5.8 Production Plans (`/production-plans`)

| Method | Endpoint | คำอธิบาย | Permission |
|--------|----------|---------|------------|
| GET | `/production-plans` | รายการแผนการผลิต | `production_plans.read` |
| GET | `/production-plans/:id` | ข้อมูลแผน | `production_plans.read` |
| GET | `/production-plans/:id/details` | รายละเอียดแผน | `production_plans.read` |
| POST | `/production-plans` | สร้างแผน | `production_plans.create` |
| PATCH | `/production-plans/:id` | แก้ไขแผน | `production_plans.update` |
| DELETE | `/production-plans/:id` | ลบแผน | `production_plans.delete` |
| POST | `/production-plans/:id/items` | เพิ่มรายการในแผน | `production_plans.update` |
| PATCH | `/production-plans/:id/items/:itemId` | แก้ไขรายการ | `production_plans.update` |
| DELETE | `/production-plans/:id/items/:itemId` | ลบรายการ | `production_plans.update` |
| POST | `/production-plans/:id/reserve` | จองวัตถุดิบ | `production_plans.reserve` |
| POST | `/production-plans/:id/confirm` | ยืนยันแผน | `production_plans.approve` |
| POST | `/production-plans/:id/issue` | จ่ายวัตถุดิบ | `production_plans.issue` |
| POST | `/production-plans/:id/confirm-and-issue` | ยืนยัน + จ่าย | `production_plans.approve`, `production_plans.issue` |
| POST | `/production-plans/:id/generate-product-qr-orders` | สร้าง Production Order + QR lots | `production_plans.generate_orders` |
| POST | `/production-plans/:id/cancel` | ยกเลิกแผน | `production_plans.cancel` |
| GET | `/production-plans/materials/availability` | ตรวจสอบวัตถุดิบ available | `production_plans.read` |
| GET | `/production-plans/materials/reservations` | การจองวัตถุดิบ | `production_plans.read` |
| POST | `/production-plans/fix-remaining-quantity` | แก้ไข quantity คงเหลือ | `production_plans.manage` |
| POST | `/production-plans/fix-lots-from-stock` | แก้ไข lots | `production_plans.manage` |
| GET | `/production-plans/debug/material/:materialCode` | debug ข้อมูลวัตถุดิบ | `production_plans.manage` |
| GET | `/production-plans/debug/check-availability/:materialId` | debug availability | `production_plans.manage` |

---

### 5.9 Production Orders (`/production-orders`)

| Method | Endpoint | คำอธิบาย | Permission |
|--------|----------|---------|------------|
| POST | `/production-orders` | สร้างคำสั่งผลิต | `production_orders.create` |
| GET | `/production-orders` | รายการคำสั่งผลิต | `production_orders.read` |
| GET | `/production-orders/:id` | ข้อมูลคำสั่งผลิตพร้อม lots | `production_orders.read` |
| POST | `/production-orders/:id/start` | เริ่มคำสั่งผลิต | `production_orders.update` |
| GET | `/production-orders/reports/lot-step-trace` | รายงานติดตามล็อต | `production_orders.read` |
| GET | `/production-orders/in-progress/my-dept` | ล็อตที่กำลังดำเนินการในแผนตัวเอง | `production_orders.read` + `production_orders.update` |
| GET | `/production-orders/lots/:qrCode/station` | ข้อมูลสถานี QR | `production_orders.read` / `production_orders.update` |
| GET | `/production-orders/lots/:qrCode/step-quantities` | จำนวนต่อขั้นตอน | `production_orders.read` / `production_orders.update` |
| GET | `/production-orders/lots/:qrCode/tracking` | ติดตามล็อต | `production_orders.read` / `production_orders.update` |
| GET | `/production-orders/lots/:qrCode/lineage` | ประวัติการ split | `production_orders.read` / `production_orders.update` |
| GET | `/production-orders/lots/:qrCode/status` | สถานะล็อต | `production_orders.read` / `production_orders.update` |
| POST | `/production-orders/lots/:qrCode/start` | เริ่มขั้นตอนถัดไป | `production_orders.update` |
| POST | `/production-orders/lots/:qrCode/complete` | จบขั้นตอนปัจจุบัน | `production_orders.update` |
| POST | `/production-orders/lots/:qrCode/split` | แบ่งล็อต | `production_orders.update` |
| POST | `/production-orders/processes` | สร้าง process ให้กับ order | `production_orders.manage` |
| GET | `/production-orders/processes/all` | รายการ processes ทั้งหมด | `production_orders.read` |

---

### 5.10 Materials (`/materials`)

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| GET | `/materials` | รายการวัตถุดิบ (paginated, query: search, locationId, unit, isActive, sortBy, sortOrder) |
| GET | `/materials/all` | รายการวัตถุดิบทั้งหมด (dropdown) |
| GET | `/materials/stock` | สรุปสต็อก |
| GET | `/materials/:id` | ข้อมูลวัตถุดิบ |
| POST | `/materials` | สร้างวัตถุดิบ |
| PATCH | `/materials/:id` | แก้ไขวัตถุดิบ |
| DELETE | `/materials/:id` | ลบวัตถุดิบ |
| POST | `/materials/stock/receive` | รับเข้าสต็อก |
| POST | `/materials/stock/issue` | จ่ายออกสต็อก |

---

### 5.11 Material Transactions (`/materials/transactions`)

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| POST | `/materials/transactions/receive` | รับวัตถุดิบ |
| POST | `/materials/transactions/issue-with-document` | จ่ายพร้อมเอกสาร |
| POST | `/materials/transactions/issue-from-bom` | จ่ายจาก BOM สินค้า |
| POST | `/materials/transactions/issue-from-material-bom` | จ่ายจาก material BOM (FIFO) |
| POST | `/materials/transactions/issue-manual` | จ่ายด้วยตนเอง |
| POST | `/materials/transactions/issue-production` | จ่ายให้การผลิต |
| POST | `/materials/transactions/issue-production/preview` | ดูตัวอย่างก่อนจ่ายให้การผลิต |
| GET | `/materials/transactions/issues` | รายการจ่าย |
| GET | `/materials/transactions/issues/:id` | ข้อมูลการจ่าย |
| GET | `/materials/transactions/issues/:id/documents` | เอกสารการจ่าย |
| GET | `/materials/transactions/receivings` | รายการรับ |
| GET | `/materials/transactions/issuings` | รายการจ่าย (issuings) |
| GET | `/materials/transactions/qr/:qrCode` | ข้อมูล lot ตาม QR |
| GET | `/materials/transactions/qr/:qrCode/transactions` | ธุรกรรมของ lot |
| GET | `/materials/transactions/lots` | รายการ lot |
| GET | `/materials/transactions/issuing-types` | ประเภทการจ่าย |
| GET | `/materials/transactions/issuing-types/:id` | ประเภทการจ่ายตาม ID |
| GET | `/materials/transactions/stock` | สต็อกรวม |
| GET | `/materials/transactions/stock/:materialId` | สต็อกตามวัตถุดิบ |
| GET | `/materials/transactions/report/transactions` | รายงานธุรกรรม |
| GET | `/materials/transactions/traceability/by-lot` | Traceability ตาม lot |
| GET | `/materials/transactions/traceability/by-issuing` | Traceability ตาม issuing |
| GET | `/materials/transactions/traceability/by-production-order` | Traceability ตาม production order |

---

### 5.12 Material Issues (`/material-issues`)

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| POST | `/material-issues` | สร้างการจ่ายด้วยตนเอง |
| POST | `/material-issues/production` | จ่ายให้การผลิต |
| POST | `/material-issues/production/preview` | ดูตัวอย่าง |
| GET | `/material-issues` | รายการจ่าย |
| GET | `/material-issues/:id` | ข้อมูลการจ่าย |

---

### 5.13 Material Uploads (`/materials/upload`)

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| POST | `/materials/upload/document` | อัปโหลดเอกสาร (multipart, field: `files`, สูงสุด 10 ไฟล์, ประเภท pdf/jpg/png/doc/docx, สูงสุด 10MB) |
| POST | `/materials/upload/workpiece-image` | อัปโหลดรูปชิ้นงาน (multipart, field: `file`, jpeg/png/webp, สูงสุด 5MB) |

---

### 5.14 Products (`/products`)

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| GET | `/products` | รายการสินค้า (paginated, query: search, isActive, sortBy, sortOrder) |
| GET | `/products/all` | รายการสินค้าทั้งหมด (dropdown) |
| GET | `/products/:id` | ข้อมูลสินค้า |
| GET | `/products/code/:code` | ค้นหาตามรหัสสินค้า |
| POST | `/products` | สร้างสินค้า |
| POST | `/products/with-bom` | สร้างสินค้าพร้อม BOM |
| PATCH | `/products/:id` | แก้ไขสินค้า |
| DELETE | `/products/:id` | ลบสินค้า |
| GET | `/products/:id/bom` | ดู BOM |
| POST | `/products/:id/bom` | เพิ่มรายการ BOM |
| PATCH | `/products/:id/bom` | แก้ไข BOM |
| DELETE | `/products/:id/bom/:bomId` | ลบรายการ BOM |
| GET | `/products/:id/production-steps` | ขั้นตอนการผลิตของสินค้า |
| PUT | `/products/:id/production-steps` | กำหนดขั้นตอนการผลิต |
| GET | `/products/:id/material-requirements?quantity=100` | คำนวณวัตถุดิบที่ต้องใช้ |

---

### 5.15 Product Inventory (`/products`)

| Method | Endpoint | คำอธิบาย | Permission |
|--------|----------|---------|------------|
| GET | `/products/reports/fg-lot-trace` | รายงานติดตามล็อตสินค้าสำเร็จ | `products.stock.read` |
| GET | `/products/stock/alerts` | แจ้งเตือนสต็อก | `products.stock.read` |
| GET | `/products/stock` | สต็อกสินค้า (paginated) | `products.stock.read` |
| GET | `/products/sales-reservations` | การจองสินค้าเพื่อขาย | `products.stock.read` หรือ `products.sales.reserve` |
| POST | `/products/sales-reservations` | จองสินค้า | `products.sales.reserve` |
| POST | `/products/sales-reservations/:id/release` | ยกเลิกการจอง | `products.sales.reserve` |
| POST | `/products/sales-reservations/:id/fulfill` | ตัดขาย (fulfill) | `products.sales.reserve` |

---

### 5.16 Product Uploads (`/products/upload`)

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| POST | `/products/upload/product-image` | อัปโหลดรูปสินค้า (multipart, field: `file`, jpeg/png/webp, สูงสุด 5MB) |

---

### 5.17 Masters — Product Masters (`/masters/products`)

รายการ endpoints สำหรับข้อมูลมาตรฐานของสินค้า แต่ละรายการมี pattern: `GET .../all` (dropdown), `GET ...` (paginated), `GET .../:id`, `POST ...`, `PUT/PATCH .../:id`, `DELETE .../:id`

- `/masters/products/locations`
- `/masters/products/customers`
- `/masters/products/types`
- `/masters/products/models`
- `/masters/products/delivery-types`
- `/masters/products/units`
- `/masters/products/loading-points`
- `/masters/products/process-lines`

---

### 5.18 Masters — Material Masters (`/masters`)

- `/masters/models`
- `/masters/delivery-types`
- `/masters/units`
- `/masters/loading-points`
- `/masters/process-lines`
- `/masters/suppliers`
- `/masters/materials-types`
- `/masters/materials-locations`

---

### 5.19 Masters — Production Processes (`/masters/production-processes`)

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| GET | `/masters/production-processes` | รายการ |
| GET | `/masters/production-processes/:id` | ข้อมูล |
| POST | `/masters/production-processes` | สร้าง |
| PATCH | `/masters/production-processes/:id` | แก้ไข |
| DELETE | `/masters/production-processes/:id` | ลบ |

---

### 5.20 Masters — Product Production Steps (`/masters/product-production-steps`)

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| GET | `/masters/product-production-steps` | รายการ |
| GET | `/masters/product-production-steps/:id` | ข้อมูล |
| POST | `/masters/product-production-steps` | สร้าง |
| PATCH | `/masters/product-production-steps/:id` | แก้ไข |
| DELETE | `/masters/product-production-steps/:id` | ลบ |

---

### 5.21 Logs (`/logs`)

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| GET | `/logs/api/recent?limit=100` | API calls ล่าสุด |
| GET | `/logs/api/errors?limit=50` | Error ล่าสุด |
| GET | `/logs/api/statistics?timeWindow=60` | สถิติ API |
| GET | `/logs/api/slow?threshold=1000&limit=20` | Request ที่ช้า |
| GET | `/logs/api/by-ip/:ip` | Request ตาม IP |
| GET | `/logs/api/by-endpoint?method=GET&url=/products` | Request ตาม endpoint |
| GET | `/logs/health` | สุขภาพ logs |
| GET | `/logs/database/stats` | สถิติฐานข้อมูล |
| GET | `/logs/database/cleanup?days=90` | ล้าง logs เก่า |

---

### 5.22 AI Chat (`/ai/chat`)

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| POST | `/ai/chat` | ส่งข้อความแชท |

---

### 5.23 Health Check (`/`)

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| GET | `/` | hello message |
| GET | `/health` | health status |

---

## 6. Permission Reference สำหรับ Frontend

หลัง login จะได้รับ `permissions` array มาจาก backend ใช้ตรวจสอบว่าผู้ใช้สามารถทำ action ใดได้บ้าง

| Module | Permission ที่ใช้ |
|--------|------------------|
| **Sales Orders** | `sales_order.read`, `sales_order.create`, `sales_order.update`, `sales_order.delete`, `sales_order.approve`, `sales_order.export` |
| **Production Plans** | `production_plans.read`, `production_plans.create`, `production_plans.update`, `production_plans.delete`, `production_plans.approve`, `production_plans.issue`, `production_plans.reserve`, `production_plans.generate_orders`, `production_plans.cancel`, `production_plans.manage` |
| **Production Orders** | `production_orders.read`, `production_orders.create`, `production_orders.update`, `production_orders.manage` |
| **Product Stock** | `products.stock.read`, `products.sales.reserve` |

หมายเหตุ: บาง endpoint ใช้ `@PermissionMatch('any')` คือ มีสิทธิ์ใดสิทธิ์หนึ่งในรายการที่ระบุก็เข้าใช้ได้

---

## 7. File Upload Patterns

### 7.1 Excel Import

```javascript
const formData = new FormData();
formData.append('file', file);

fetch('http://localhost:3006/sales-planning/import', {
  method: 'POST',
  headers: {
    'x-user-id': userId,
  },
  body: formData, // ไม่ต้องใส่ Content-Type
});
```

### 7.2 Image Upload

```javascript
const formData = new FormData();
formData.append('file', imageFile);

const res = await fetch('http://localhost:3006/products/upload/product-image', {
  method: 'POST',
  headers: { 'x-user-id': userId },
  body: formData,
});

const { data } = await res.json();
// data.filePath = "uploads/product-images/xxx.jpg"
```

### 7.3 การเข้าถึงไฟล์

ไฟล์ที่อัปโหลดจะถูก serve ผ่าน `/uploads/<path>` เช่น:
```
http://localhost:3006/uploads/product-images/xxx.jpg
```

---

## 8. Production QR Workflow

flow หลักที่ frontend ต้องรู้สำหรับการผลิต:

1. **สร้าง Production Plan** → `POST /production-plans`
2. **เพิ่มรายการ** → `POST /production-plans/:id/items`
3. **จองวัตถุดิบ** → `POST /production-plans/:id/reserve`
4. **ยืนยัน + จ่ายวัตถุดิบ** → `POST /production-plans/:id/confirm-and-issue`
5. **สร้าง Production Order + QR lots** → `POST /production-plans/:id/generate-product-qr-orders`
6. **สแกน QR ที่สถานี** → `GET /production-orders/lots/:qrCode/station`
7. **เริ่มขั้นตอน** → `POST /production-orders/lots/:qrCode/start`
8. **เสร็จขั้นตอน** → `POST /production-orders/lots/:qrCode/complete`
9. **แบ่งล็อต** → `POST /production-orders/lots/:qrCode/split`

สำหรับ material receiving/issuing ก็สามารถสแกน QR lot ได้ที่:
- `GET /materials/transactions/qr/:qrCode`
- `GET /materials/transactions/qr/:qrCode/transactions`

---

## 9. สถานะที่ใช้บ่อย

- **Sales Orders**: draft → submitted → approved → rejected → cancelled
- **Production Plans**: draft → reserved → confirmed → issued → cancelled
- **Production Order Lots**: PENDING → IN_PROGRESS → COMPLETED → SCRAPPED, split/retired
- **Material Lots**: ติดตามสถานะผ่าน QR / transaction history

---

## 10. ข้อควรระวังสำหรับ Frontend

1. **Auth ไม่ใช้ JWT Bearer**: ปัจจุบันต้องส่ง `x-user-id` และ `x-department-id` headers
2. **Response format ไม่สม่ำเสมอ**: Auth endpoints ใช้ `{ message, user }` ไม่มี `success` / `timestamp`; ส่วนอื่นใช้ ResponseHelper มาตรฐาน
3. **Department scoping**: `production-plans`, `production-orders` ต้องส่ง `x-department-id`
4. **Pagination params**: ส่วนใหญ่ใช้ `page` / `limit` แต่บาง endpoint ใช้ `skip` / `take` (เช่น sales-planning import history)
5. **File upload**: ใช้ `multipart/form-data` โดยไม่ต้องตั้ง `Content-Type` header เอง
6. **Delete responses**: บาง endpoint คืน `204 No Content` หรือ `{ message }` ไม่มี data

---

## 11. ไฟล์อ้างอิงในโปรเจกต์

- รายการ controller ทั้งหมด: `src/modules/**/controllers/*.controller.ts`
- Response helper: `libs/common/src/response/response.helper.ts`
- Auth response: `src/modules/auth/utils/auth-response.util.ts`
- CORS & global config: `src/main.ts`
- เอกสารที่เกี่ยวข้อง: `.project-ai/api-map.md`, `.project-ai/frontend-guide.md`, `.project-ai/domain-rules.md`

---

*สร้างเมื่อ: 6 กรกฎาคม 2026 — อ้างอิงจากโค้ด backend ในขณะนั้น*
