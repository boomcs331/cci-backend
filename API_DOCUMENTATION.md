# API Documentation - Materials Receiving & Issuing

## Base URL
```
/materials/transactions
```

---

## Endpoints

### 1. รับวัสดุเข้าคลัง (Receive Material)
**POST** `/materials/transactions/receive`

รับวัสดุเข้าคลังพร้อมสร้าง Lot และ QR Code

#### Request Body
```json
{
  "materialId": 1,
  "quantity": 100,
  "unit": "kg",
  "supplierId": 5,
  "receivedDate": "2024-01-15T10:30:00Z",
  "lotNumber": "LOT-2024-001",
  "expiryDate": "2025-01-15T00:00:00Z",
  "locationId": 3,
  "remarks": "รับวัสดุจากซัพพลายเออร์"
}
```

#### Response
```json
{
  "success": true,
  "message": "Material received successfully",
  "data": {
    "id": 1,
    "materialId": 1,
    "quantity": 100,
    "qrCode": "QR-2024-001-ABC123",
    "lotNumber": "LOT-2024-001",
    "receivedDate": "2024-01-15T10:30:00Z"
  }
}
```

---

### 2. เบิกวัสดุพร้อมเอกสาร (Issue Material with Document)
**POST** `/materials/transactions/issue-with-document`

เบิกวัสดุออกจากคลังพร้อมระบุเอกสารอ้างอิง

#### Request Body
```json
{
  "qrCode": "QR-2024-001-ABC123",
  "quantity": 50,
  "department": "Production",
  "issuedDate": "2024-01-20T14:00:00Z",
  "documentType": "WORK_ORDER",
  "documentNumber": "WO-2024-001",
  "remarks": "เบิกวัสดุสำหรับใบสั่งผลิต"
}
```

#### Response
```json
{
  "success": true,
  "message": "Material issued with documents successfully",
  "data": {
    "id": 1,
    "qrCode": "QR-2024-001-ABC123",
    "quantity": 50,
    "department": "Production",
    "documentType": "WORK_ORDER",
    "documentNumber": "WO-2024-001",
    "issuedDate": "2024-01-20T14:00:00Z"
  }
}
```

---

### 3. เบิกวัสดุตาม BOM (Issue Material from BOM)
**POST** `/materials/transactions/issue-from-bom`

เบิกวัสดุตามสูตรการผลิต (Bill of Materials)

#### Request Body
```json
{
  "productId": 10,
  "quantity": 5,
  "workOrderNumber": "WO-2024-001",
  "department": "Production",
  "issuedDate": "2024-01-20T14:00:00Z",
  "remarks": "เบิกวัสดุสำหรับผลิตสินค้า 5 ชิ้น"
}
```

#### Response
```json
{
  "success": true,
  "message": "Materials issued from product BOM successfully",
  "data": [
    {
      "materialId": 1,
      "materialName": "Steel Sheet",
      "quantity": 25,
      "unit": "kg",
      "qrCode": "QR-2024-001-ABC123"
    },
    {
      "materialId": 2,
      "materialName": "Bolt M8",
      "quantity": 100,
      "unit": "pcs",
      "qrCode": "QR-2024-002-DEF456"
    }
  ]
}
```

---

### 4. ดึงรายการรับวัสดุทั้งหมด (Get All Receivings)
**GET** `/materials/transactions/receivings`

ดึงรายการการรับวัสดุเข้าคลังพร้อม Pagination และ Filter

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | หน้าที่ต้องการ |
| limit | number | No | 10 | จำนวนรายการต่อหน้า |
| search | string | No | - | ค้นหาจาก lot number, material name |
| sortBy | string | No | id | เรียงตาม (id, receivedDate, quantity) |
| sortOrder | string | No | DESC | ASC หรือ DESC |
| materialId | number | No | - | กรองตาม Material ID |
| supplierId | number | No | - | กรองตาม Supplier ID |
| status | string | No | - | กรองตามสถานะ (ACTIVE, DEPLETED) |

#### Example Request
```
GET /materials/transactions/receivings?page=1&limit=20&materialId=5&status=ACTIVE
```

#### Response
```json
{
  "success": true,
  "message": "Receivings retrieved successfully",
  "data": [
    {
      "id": 1,
      "materialId": 5,
      "materialName": "Steel Sheet",
      "quantity": 100,
      "lotNumber": "LOT-2024-001",
      "qrCode": "QR-2024-001-ABC123",
      "supplierName": "ABC Steel Co.",
      "receivedDate": "2024-01-15T10:30:00Z",
      "status": "ACTIVE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 5. ดึงรายการเบิกวัสดุทั้งหมด (Get All Issuings)
**GET** `/materials/transactions/issuings`

ดึงรายการการเบิกวัสดุออกจากคลังพร้อม Pagination และ Filter

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | หน้าที่ต้องการ |
| limit | number | No | 10 | จำนวนรายการต่อหน้า |
| search | string | No | - | ค้นหาจาก document number, material name |
| sortBy | string | No | id | เรียงตาม (id, issuedDate, quantity) |
| sortOrder | string | No | DESC | ASC หรือ DESC |
| materialId | number | No | - | กรองตาม Material ID |
| department | string | No | - | กรองตามแผนก |
| status | string | No | - | กรองตามสถานะ |
| issuingType | string | No | - | กรองตามประเภทการเบิก |

#### Example Request
```
GET /materials/transactions/issuings?page=1&limit=20&department=Production&issuingType=WORK_ORDER
```

#### Response
```json
{
  "success": true,
  "message": "Issuings retrieved successfully",
  "data": [
    {
      "id": 1,
      "materialId": 5,
      "materialName": "Steel Sheet",
      "quantity": 50,
      "qrCode": "QR-2024-001-ABC123",
      "department": "Production",
      "documentType": "WORK_ORDER",
      "documentNumber": "WO-2024-001",
      "issuedDate": "2024-01-20T14:00:00Z",
      "issuingType": "WORK_ORDER"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 78,
    "totalPages": 4
  }
}
```

---

### 6. ดึงข้อมูล Lot จาก QR Code
**GET** `/materials/transactions/qr/:qrCode`

ดึงข้อมูล Lot และวัสดุจาก QR Code

#### Example Request
```
GET /materials/transactions/qr/QR-2024-001-ABC123
```

#### Response
```json
{
  "success": true,
  "message": "Lot retrieved successfully",
  "data": {
    "id": 1,
    "qrCode": "QR-2024-001-ABC123",
    "lotNumber": "LOT-2024-001",
    "materialId": 5,
    "materialName": "Steel Sheet",
    "materialCode": "MAT-001",
    "currentQuantity": 50,
    "originalQuantity": 100,
    "unit": "kg",
    "locationId": 3,
    "locationName": "Warehouse A - Rack 1",
    "expiryDate": "2025-01-15T00:00:00Z",
    "status": "ACTIVE",
    "receivedDate": "2024-01-15T10:30:00Z"
  }
}
```

---

### 7. ดึงประวัติการทำรายการของ Lot
**GET** `/materials/transactions/qr/:qrCode/transactions`

ดึงประวัติการรับ-เบิกวัสดุของ Lot นั้นๆ

#### Example Request
```
GET /materials/transactions/qr/QR-2024-001-ABC123/transactions
```

#### Response
```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": [
    {
      "id": 1,
      "type": "RECEIVING",
      "quantity": 100,
      "date": "2024-01-15T10:30:00Z",
      "remarks": "รับวัสดุจากซัพพลายเออร์",
      "supplierName": "ABC Steel Co."
    },
    {
      "id": 2,
      "type": "ISSUING",
      "quantity": 50,
      "date": "2024-01-20T14:00:00Z",
      "department": "Production",
      "documentNumber": "WO-2024-001",
      "remarks": "เบิกวัสดุสำหรับใบสั่งผลิต"
    }
  ]
}
```

---

### 8. ดึงรายการ Lot ทั้งหมด
**GET** `/materials/transactions/lots`

ดึงรายการ Lot ทั้งหมดพร้อม Pagination และ Filter

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | หน้าที่ต้องการ |
| limit | number | No | 10 | จำนวนรายการต่อหน้า |
| materialId | number | No | - | กรองตาม Material ID |
| status | string | No | - | กรองตามสถานะ (ACTIVE, DEPLETED, EXPIRED) |
| locationId | number | No | - | กรองตามตำแหน่งจัดเก็บ |

#### Example Request
```
GET /materials/transactions/lots?page=1&limit=20&status=ACTIVE&locationId=3
```

#### Response
```json
{
  "success": true,
  "message": "Lots retrieved successfully",
  "data": [
    {
      "id": 1,
      "qrCode": "QR-2024-001-ABC123",
      "lotNumber": "LOT-2024-001",
      "materialName": "Steel Sheet",
      "currentQuantity": 50,
      "unit": "kg",
      "locationName": "Warehouse A - Rack 1",
      "expiryDate": "2025-01-15T00:00:00Z",
      "status": "ACTIVE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

---

### 9. ดึงประเภทการเบิกทั้งหมด
**GET** `/materials/transactions/issuing-types`

ดึงรายการประเภทการเบิกวัสดุทั้งหมด

#### Response
```json
{
  "success": true,
  "message": "Issuing types retrieved successfully",
  "data": [
    {
      "id": 1,
      "code": "WORK_ORDER",
      "name": "ใบสั่งผลิต",
      "description": "เบิกวัสดุสำหรับการผลิต"
    },
    {
      "id": 2,
      "code": "MAINTENANCE",
      "name": "ซ่อมบำรุง",
      "description": "เบิกวัสดุสำหรับการซ่อมบำรุง"
    },
    {
      "id": 3,
      "code": "GENERAL",
      "name": "ทั่วไป",
      "description": "เบิกวัสดุทั่วไป"
    }
  ]
}
```

---

### 10. ดึงประเภทการเบิกตาม ID
**GET** `/materials/transactions/issuing-types/:id`

ดึงข้อมูลประเภทการเบิกวัสดุตาม ID

#### Example Request
```
GET /materials/transactions/issuing-types/1
```

#### Response
```json
{
  "success": true,
  "message": "Issuing type retrieved successfully",
  "data": {
    "id": 1,
    "code": "WORK_ORDER",
    "name": "ใบสั่งผลิต",
    "description": "เบิกวัสดุสำหรับการผลิต",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "quantity",
      "message": "Quantity must be greater than 0"
    }
  ]
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Material not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details..."
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

---

## Notes

- ทุก endpoint ใช้ ResponseHelper สำหรับ format response ที่สม่ำเสมอ
- วันที่และเวลาใช้ ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
- Pagination เริ่มต้นที่หน้า 1
- QR Code จะถูกสร้างอัตโนมัติเมื่อรับวัสดุเข้าคลัง
- การเบิกวัสดุจะตรวจสอบ stock ก่อนทำรายการ
