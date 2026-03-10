# Production Orders Module

## ภาพรวม
ระบบติดตามการผลิตแบบ Lot-based Production Tracking

## การทำงาน

### 1. สร้างคำสั่งผลิต
```
POST /production-orders
{
  "productId": 1,
  "orderQuantity": 1005,
  "remarks": "คำสั่งผลิตเดือนมกราคม"
}
```

**ระบบจะ:**
- ดึง lotSize จาก Product (เช่น 100)
- คำนวณจำนวน Lots = ceil(1005 / 100) = 11 Lots
- สร้าง QR Code ให้แต่ละ Lot
  - Lot 1-10: 100 ชิ้น/Lot
  - Lot 11: 5 ชิ้น

**Response:**
```json
{
  "id": 1,
  "orderNo": "PO202601-0001",
  "productId": 1,
  "orderQuantity": 1005,
  "lotSize": 100,
  "totalLots": 11,
  "status": "DRAFT",
  "lots": [
    {
      "lotNo": "PO202601-0001-LOT001",
      "qrCode": "QR-PO202601-0001-LOT001-1234567890",
      "quantity": 100,
      "status": "PENDING"
    },
    ...
  ]
}
```

### 2. เริ่มคำสั่งผลิต
```
POST /production-orders/1/start
```

### 3. สแกน QR เพื่อเริ่มขั้นตอน
```
POST /production-orders/lots/QR-PO202601-0001-LOT001-1234567890/start
{
  "processId": 1,
  "operator": "นาย ก"
}
```

### 4. เสร็จสิ้นขั้นตอน
```
POST /production-orders/lots/QR-PO202601-0001-LOT001-1234567890/complete
{
  "processId": 1,
  "remarks": "ผ่าน QC"
}
```

### 5. ตรวจสอบสถานะ Lot
```
GET /production-orders/lots/QR-PO202601-0001-LOT001-1234567890/status
```

**Response:**
```json
{
  "lotNo": "PO202601-0001-LOT001",
  "qrCode": "QR-PO202601-0001-LOT001-1234567890",
  "quantity": 100,
  "status": "IN_PROGRESS",
  "orderNo": "PO202601-0001",
  "productName": "Product A",
  "currentProcess": "ประกอบ",
  "tracking": [
    {
      "processName": "เตรียมวัตถุดิบ",
      "startTime": "2024-01-15T08:00:00Z",
      "endTime": "2024-01-15T09:00:00Z",
      "status": "COMPLETED",
      "operator": "นาย ก",
      "duration": "60 นาที"
    },
    {
      "processName": "ประกอบ",
      "startTime": "2024-01-15T09:05:00Z",
      "endTime": null,
      "status": "IN_PROGRESS",
      "operator": "นาย ข",
      "duration": null
    }
  ]
}
```

## ขั้นตอนการผลิต (Production Processes)

### สร้างขั้นตอน
```
POST /production-orders/processes
{
  "processCode": "PREP",
  "processName": "เตรียมวัตถุดิบ",
  "sequenceOrder": 1
}
```

### ดูขั้นตอนทั้งหมด
```
GET /production-orders/processes/all
```

## Database Schema

```sql
-- คำสั่งผลิต
CREATE TABLE production_orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(50) UNIQUE,
  product_id INT,
  order_quantity DECIMAL(15,4),
  lot_size DECIMAL(15,4),
  total_lots INT,
  status VARCHAR(20),
  remarks TEXT,
  create_date TIMESTAMP DEFAULT NOW(),
  create_by VARCHAR(255)
);

-- Lot การผลิต
CREATE TABLE production_lots (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES production_orders(id),
  lot_no VARCHAR(50) UNIQUE,
  qr_code VARCHAR(100) UNIQUE,
  sequence_no INT,
  quantity DECIMAL(15,4),
  current_process_id INT,
  status VARCHAR(20),
  create_date TIMESTAMP DEFAULT NOW()
);

-- ขั้นตอนการผลิต
CREATE TABLE production_processes (
  id SERIAL PRIMARY KEY,
  process_code VARCHAR(50),
  process_name VARCHAR(255),
  sequence_order INT,
  is_active BOOLEAN DEFAULT true
);

-- ติดตามความคืบหน้า
CREATE TABLE production_lot_tracking (
  id SERIAL PRIMARY KEY,
  lot_id INT REFERENCES production_lots(id),
  process_id INT REFERENCES production_processes(id),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR(20),
  operator VARCHAR(255),
  remarks TEXT,
  create_date TIMESTAMP DEFAULT NOW()
);
```

## Status

### Order Status
- `DRAFT` - ร่าง
- `IN_PROGRESS` - กำลังผลิต
- `COMPLETED` - เสร็จสิ้น
- `CANCELLED` - ยกเลิก

### Lot Status
- `PENDING` - รอเริ่มผลิต
- `IN_PROGRESS` - กำลังผลิต
- `COMPLETED` - เสร็จสิ้น
- `REJECTED` - ไม่ผ่าน

### Tracking Status
- `IN_PROGRESS` - กำลังทำ
- `COMPLETED` - เสร็จสิ้น
- `REJECTED` - ไม่ผ่าน
