# API สำหรับรับเข้าและจ่ายออกวัตถุดิบ

## 📥 รับวัตถุดิบเข้า (Receiving)

### POST `/materials/transactions/receive`

รับวัตถุดิบเข้าและแยกเป็น Lot ย่อย พร้อมสร้าง QR Code อัตโนมัติ

**Request Body:**
```json
{
  "materialId": 1,
  "totalQuantity": 1000,
  "supplierId": 1,
  "poNo": "PO-2024-001",
  "remark": "รับเหล็กแผ่นจากซัพพลายเออร์ ABC",
  "lots": [
    {
      "quantity": 100,
      "locationId": 1,
      "expiryDate": "2025-12-31"
    },
    {
      "quantity": 100,
      "locationId": 1
    },
    {
      "quantity": 100,
      "locationId": 1
    },
    {
      "quantity": 100,
      "locationId": 1
    },
    {
      "quantity": 100,
      "locationId": 1
    },
    {
      "quantity": 100,
      "locationId": 1
    },
    {
      "quantity": 100,
      "locationId": 1
    },
    {
      "quantity": 100,
      "locationId": 1
    },
    {
      "quantity": 100,
      "locationId": 1
    },
    {
      "quantity": 100,
      "locationId": 1
    }
  ],
  "createBy": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Material received successfully",
  "data": {
    "id": 1,
    "receivingNo": "RCV-2024-0001",
    "receivingDate": "2024-01-15T10:30:00.000Z",
    "materialId": 1,
    "supplierId": 1,
    "totalQuantity": 1000,
    "unit": "KG",
    "poNo": "PO-2024-001",
    "status": "ACTIVE",
    "lots": [
      {
        "id": 1,
        "lotNo": "LOT-2024-0001",
        "qrCode": "QR-LOT-2024-0001-1705312345-ABC123",
        "quantity": 100,
        "remainingQuantity": 100,
        "status": "AVAILABLE"
      },
      // ... 9 lots อื่นๆ
    ]
  }
}
```

---

## 📤 จ่ายวัตถุดิบออก (Issuing) - FIFO

### POST `/materials/transactions/issue`

จ่ายวัตถุดิบออก ระบบจะหยิบจาก Lot เก่าสุดก่อนอัตโนมัติ (FIFO)

**Request Body:**
```json
{
  "materialId": 1,
  "quantity": 250,
  "department": "Production",
  "workOrderNo": "WO-2024-001",
  "remark": "เบิกเหล็กแผ่นสำหรับผลิต",
  "createBy": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Material issued successfully",
  "data": {
    "id": 1,
    "issuingNo": "ISS-2024-0001",
    "issuingDate": "2024-01-20T14:30:00.000Z",
    "materialId": 1,
    "totalQuantity": 250,
    "unit": "KG",
    "department": "Production",
    "workOrderNo": "WO-2024-001",
    "status": "COMPLETED",
    "lots": [
      {
        "id": 1,
        "lotId": 1,
        "qrCode": "QR-LOT-2024-0001-1705312345-ABC123",
        "quantity": 100,
        "lot": {
          "lotNo": "LOT-2024-0001",
          "remainingQuantity": 0,
          "status": "USED_UP"
        }
      },
      {
        "id": 2,
        "lotId": 2,
        "qrCode": "QR-LOT-2024-0002-1705312346-DEF456",
        "quantity": 100,
        "lot": {
          "lotNo": "LOT-2024-0002",
          "remainingQuantity": 0,
          "status": "USED_UP"
        }
      },
      {
        "id": 3,
        "lotId": 3,
        "qrCode": "QR-LOT-2024-0003-1705312347-GHI789",
        "quantity": 50,
        "lot": {
          "lotNo": "LOT-2024-0003",
          "remainingQuantity": 50,
          "status": "PARTIAL_USED"
        }
      }
    ]
  }
}
```

**หมายเหตุ:** ระบบจะจ่ายจาก Lot เก่าสุดก่อนเสมอ (FIFO)
- LOT-0001: จ่าย 100 kg (หมด)
- LOT-0002: จ่าย 100 kg (หมด)
- LOT-0003: จ่าย 50 kg (เหลือ 50 kg)

---

## 📋 ดูรายการรับทั้งหมด

### GET `/materials/transactions/receivings`

**Response:**
```json
{
  "success": true,
  "message": "Receivings retrieved successfully",
  "data": [
    {
      "id": 1,
      "receivingNo": "RCV-2024-0001",
      "receivingDate": "2024-01-15T10:30:00.000Z",
      "totalQuantity": 1000,
      "material": {
        "id": 1,
        "matCode": "MAT-001",
        "itemsName": {
          "name": "เหล็กแผ่น"
        }
      },
      "supplier": {
        "id": 1,
        "name": "ABC Steel Corporation"
      },
      "lots": [...]
    }
  ]
}
```

---

## 📋 ดูรายการจ่ายทั้งหมด

### GET `/materials/transactions/issuings`

**Response:**
```json
{
  "success": true,
  "message": "Issuings retrieved successfully",
  "data": [
    {
      "id": 1,
      "issuingNo": "ISS-2024-0001",
      "issuingDate": "2024-01-20T14:30:00.000Z",
      "totalQuantity": 250,
      "department": "Production",
      "material": {
        "id": 1,
        "matCode": "MAT-001",
        "itemsName": {
          "name": "เหล็กแผ่น"
        }
      },
      "lots": [...]
    }
  ]
}
```

---

## 📱 สแกน QR Code

### GET `/materials/transactions/qr/:qrCode`

ดูข้อมูล Lot จาก QR Code

**Example:** GET `/materials/transactions/qr/QR-LOT-2024-0001-1705312345-ABC123`

**Response:**
```json
{
  "success": true,
  "message": "Lot retrieved successfully",
  "data": {
    "id": 1,
    "lotNo": "LOT-2024-0001",
    "qrCode": "QR-LOT-2024-0001-1705312345-ABC123",
    "quantity": 100,
    "remainingQuantity": 0,
    "unit": "KG",
    "status": "USED_UP",
    "expiryDate": "2025-12-31",
    "createDate": "2024-01-15T10:30:00.000Z",
    "material": {
      "id": 1,
      "matCode": "MAT-001",
      "itemsName": {
        "name": "เหล็กแผ่น"
      }
    },
    "location": {
      "id": 1,
      "name": "คลังวัตถุดิบ A"
    },
    "receiving": {
      "receivingNo": "RCV-2024-0001",
      "receivingDate": "2024-01-15T10:30:00.000Z",
      "supplier": {
        "name": "ABC Steel Corporation"
      }
    }
  }
}
```

---

## 📜 ดูประวัติการใช้งาน QR Code

### GET `/materials/transactions/qr/:qrCode/transactions`

ดูประวัติทุกการเคลื่อนไหวของ Lot นี้

**Example:** GET `/materials/transactions/qr/QR-LOT-2024-0001-1705312345-ABC123/transactions`

**Response:**
```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": [
    {
      "id": 2,
      "transactionNo": "TXN-2024-000002",
      "transactionType": "ISSUE",
      "transactionDate": "2024-01-20T14:30:00.000Z",
      "quantity": -100,
      "remainingQuantity": 0,
      "referenceNo": "ISS-2024-0001",
      "remark": "เบิกเหล็กแผ่นสำหรับผลิต",
      "createBy": "admin",
      "material": {
        "matCode": "MAT-001",
        "itemsName": {
          "name": "เหล็กแผ่น"
        }
      }
    },
    {
      "id": 1,
      "transactionNo": "TXN-2024-000001",
      "transactionType": "RECEIVE",
      "transactionDate": "2024-01-15T10:30:00.000Z",
      "quantity": 100,
      "remainingQuantity": 100,
      "referenceNo": "RCV-2024-0001",
      "remark": "รับเหล็กแผ่นจากซัพพลายเออร์ ABC",
      "createBy": "admin",
      "material": {
        "matCode": "MAT-001",
        "itemsName": {
          "name": "เหล็กแผ่น"
        }
      }
    }
  ]
}
```

---

## 🔍 Business Logic

### การรับวัตถุดิบ (Receiving)
1. Validate material และ supplier
2. ตรวจสอบว่า totalQuantity = ผลรวมของ lots
3. สร้างเลขที่ใบรับ (RCV-YYYY-XXXX)
4. สร้าง Lot ย่อยพร้อม QR Code แต่ละ Lot
5. บันทึก Transaction Log
6. อัพเดท Stock (+)

### การจ่ายวัตถุดิบ (Issuing) - FIFO
1. Validate material
2. Query Lot ที่ใช้ได้ เรียงตาม create_date ASC (FIFO)
3. ตรวจสอบ Stock เพียงพอหรือไม่
4. หยิบจาก Lot เก่าสุดก่อน จนครบจำนวน
5. อัพเดท remaining_quantity และ status ของแต่ละ Lot
6. บันทึก Transaction Log
7. อัพเดท Stock (-)

### Status ของ Lot
- `AVAILABLE` - ยังไม่ได้ใช้เลย
- `PARTIAL_USED` - ใช้ไปบางส่วน
- `USED_UP` - ใช้หมดแล้ว
- `EXPIRED` - หมดอายุ

---

## 🎯 Use Cases

### 1. รับวัตถุดิบ 1,000 kg แยกเป็น 10 Lot
```bash
curl -X POST http://localhost:3000/materials/transactions/receive \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": 1,
    "totalQuantity": 1000,
    "supplierId": 1,
    "lots": [
      {"quantity": 100, "locationId": 1},
      {"quantity": 100, "locationId": 1},
      {"quantity": 100, "locationId": 1},
      {"quantity": 100, "locationId": 1},
      {"quantity": 100, "locationId": 1},
      {"quantity": 100, "locationId": 1},
      {"quantity": 100, "locationId": 1},
      {"quantity": 100, "locationId": 1},
      {"quantity": 100, "locationId": 1},
      {"quantity": 100, "locationId": 1}
    ],
    "createBy": "admin"
  }'
```

### 2. จ่ายวัตถุดิบ 250 kg (FIFO)
```bash
curl -X POST http://localhost:3000/materials/transactions/issue \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": 1,
    "quantity": 250,
    "department": "Production",
    "createBy": "admin"
  }'
```

### 3. สแกน QR Code
```bash
curl http://localhost:3000/materials/transactions/qr/QR-LOT-2024-0001-1705312345-ABC123
```

### 4. ดูประวัติ QR Code
```bash
curl http://localhost:3000/materials/transactions/qr/QR-LOT-2024-0001-1705312345-ABC123/transactions
```

---

## ✅ Features

- ✅ รับวัตถุดิบเป็นก้อน แยกเป็น Lot ย่อย
- ✅ สร้าง QR Code อัตโนมัติสำหรับแต่ละ Lot
- ✅ จ่ายแบบ FIFO (First In First Out)
- ✅ ติดตาม remaining_quantity และ status
- ✅ สแกน QR Code เพื่อดูข้อมูล
- ✅ ดูประวัติการใช้งานของแต่ละ Lot
- ✅ Transaction Log ครบถ้วน
- ✅ อัพเดท Stock อัตโนมัติ
