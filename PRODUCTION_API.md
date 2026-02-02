# Production Orders API Documentation

## Base URL
```
/production-orders
```

## Endpoints

### 1. Get All Production Orders (Without Pagination)
```http
GET /production-orders/all
```

**Response:**
```json
{
  "success": true,
  "message": "Production orders retrieved successfully",
  "data": [
    {
      "id": 1,
      "orderNo": "PO-2024-001",
      "status": "pending",
      // ... other fields
    }
  ]
}
```

### 2. Get Production Orders (With Pagination)
```http
GET /production-orders
```

**Query Parameters:**
- `page` (optional): หน้าที่ต้องการ (default: 1)
- `limit` (optional): จำนวนรายการต่อหน้า (default: 10)
- `search` (optional): คำค้นหา
- `sortBy` (optional): เรียงตาม field (default: id)
- `sortOrder` (optional): ASC หรือ DESC (default: DESC)
- `status` (optional): กรองตาม status

**Example:**
```http
GET /production-orders?page=1&limit=20&search=PO-2024&sortBy=orderNo&sortOrder=ASC&status=pending
```

**Response:**
```json
{
  "success": true,
  "message": "Production orders retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 3. Get Production Order by ID
```http
GET /production-orders/:id
```

**Parameters:**
- `id`: Production Order ID (number)

**Response:**
```json
{
  "success": true,
  "message": "Production order retrieved successfully",
  "data": {
    "id": 1,
    "orderNo": "PO-2024-001",
    // ... other fields
  }
}
```

### 4. Get Production Order by Order Number
```http
GET /production-orders/order-no/:orderNo
```

**Parameters:**
- `orderNo`: หมายเลขใบสั่งผลิต (string)

**Example:**
```http
GET /production-orders/order-no/PO-2024-001
```

### 5. Create Production Order
```http
POST /production-orders
```

**Request Body:**
```json
{
  "orderNo": "PO-2024-001",
  "productId": 1,
  "quantity": 100,
  "dueDate": "2024-12-31",
  "priority": "high",
  "notes": "Urgent order"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Production order created successfully",
  "data": {
    "id": 1,
    "orderNo": "PO-2024-001",
    // ... created order data
  }
}
```

### 6. Update Production Order
```http
PUT /production-orders/:id
```

**Parameters:**
- `id`: Production Order ID (number)

**Request Body:**
```json
{
  "quantity": 150,
  "dueDate": "2024-12-25",
  "priority": "medium",
  "status": "in_progress"
}
```

### 7. Get Material Requirements
```http
GET /production-orders/:id/requirements
```

**Parameters:**
- `id`: Production Order ID (number)

**Response:**
```json
{
  "success": true,
  "message": "Material requirements retrieved successfully",
  "data": [
    {
      "materialId": 1,
      "materialName": "Steel Sheet",
      "requiredQuantity": 50,
      "availableQuantity": 30,
      "shortageQuantity": 20,
      "unit": "kg"
    }
  ]
}
```

### 8. Get Material Requirements by Type
```http
GET /production-orders/:id/requirements/by-type/:type
```

**Parameters:**
- `id`: Production Order ID (number)
- `type`: ประเภทวัสดุ (string)

**Example:**
```http
GET /production-orders/1/requirements/by-type/raw-material
```

### 9. Issue Materials
```http
POST /production-orders/:id/issue-materials
```

**Parameters:**
- `id`: Production Order ID (number)

**Request Body:**
```json
{
  "materials": [
    {
      "materialId": 1,
      "quantity": 25,
      "lotNumber": "LOT-001",
      "notes": "First batch"
    },
    {
      "materialId": 2,
      "quantity": 10,
      "lotNumber": "LOT-002"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Materials issued successfully",
  "data": {
    "issuedMaterials": [...],
    "remainingRequirements": [...]
  }
}
```

## Response Format

ทุก API จะส่งข้อมูลในรูปแบบ:

```json
{
  "success": boolean,
  "message": string,
  "data": any,
  "pagination": {  // สำหรับ API ที่มี pagination
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

## Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

## Notes

- ทุก endpoint ต้องการ authentication (ยกเว้นถ้ามีการกำหนดเป็นอย่างอื่น)
- วันที่ใช้รูปแบบ ISO 8601 (YYYY-MM-DD)
- จำนวนเงินและปริมาณเป็น number
- ID ทั้งหมดเป็น integer