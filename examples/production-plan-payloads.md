# ตัวอย่าง Payload สำหรับ Frontend

## 1. สร้างแผนการผลิต (พร้อมรายการสินค้า)

**POST** `/production-plans`

```json
{
  "planName": "แผนการผลิตเดือนมกราคม 2024",
  "planDate": "2024-01-15",
  "remarks": "แผนสำหรับลูกค้า ABC",
  "items": [
    {
      "productId": 1,
      "quantity": 100,
      "unit": "ชิ้น",
      "remarks": "ผลิตก่อน 15 ม.ค."
    },
    {
      "productId": 2,
      "quantity": 50,
      "unit": "ชิ้น"
    }
  ]
}
```

**Response:**
```json
{
  "id": 1,
  "planCode": "PP2401-0001",
  "planName": "แผนการผลิตเดือนมกราคม 2024",
  "planDate": "2024-01-15",
  "status": "draft",
  "remarks": "แผนสำหรับลูกค้า ABC",
  "createDate": "2024-01-10T10:00:00.000Z",
  "createBy": "admin",
  "updateDate": "2024-01-10T10:00:00.000Z",
  "updateBy": null,
  "items": [
    {
      "id": 1,
      "planId": 1,
      "productId": 1,
      "quantity": "100.0000",
      "unit": "ชิ้น",
      "remarks": "ผลิตก่อน 15 ม.ค.",
      "createDate": "2024-01-10T10:00:00.000Z",
      "product": {
        "id": 1,
        "productCode": "P001",
        "productName": "สินค้า A"
      }
    },
    {
      "id": 2,
      "planId": 1,
      "productId": 2,
      "quantity": "50.0000",
      "unit": "ชิ้น",
      "remarks": null,
      "createDate": "2024-01-10T10:00:00.000Z",
      "product": {
        "id": 2,
        "productCode": "P002",
        "productName": "สินค้า B"
      }
    }
  ],
  "reservations": []
}
```

---

## 2. สร้างแผนการผลิต (ไม่มีรายการสินค้า)

**POST** `/production-plans`

```json
{
  "planName": "แผนการผลิตเดือนกุมภาพันธ์",
  "planDate": "2024-02-01"
}
```

---

## 3. แก้ไขแผนการผลิต

**PATCH** `/production-plans/1`

```json
{
  "planName": "แผนการผลิตเดือนมกราคม 2024 (แก้ไข)",
  "planDate": "2024-01-20",
  "remarks": "เปลี่ยนวันที่ผลิต"
}
```

---

## 4. เพิ่มรายการสินค้า

**POST** `/production-plans/1/items`

```json
{
  "productId": 3,
  "quantity": 75,
  "unit": "ชิ้น",
  "remarks": "เพิ่มเติม"
}
```

**Response:**
```json
{
  "id": 3,
  "planId": 1,
  "productId": 3,
  "quantity": "75.0000",
  "unit": "ชิ้น",
  "remarks": "เพิ่มเติม",
  "createDate": "2024-01-10T11:00:00.000Z"
}
```

---

## 5. แก้ไขรายการสินค้า

**PATCH** `/production-plans/1/items/1`

```json
{
  "quantity": 120,
  "remarks": "เพิ่มจำนวนจาก 100 เป็น 120"
}
```

---

## 6. ลบรายการสินค้า

**DELETE** `/production-plans/1/items/1`

**Response:**
```json
{
  "message": "ลบรายการสินค้าสำเร็จ"
}
```

---

## 7. จอง Material (FIFO)

**POST** `/production-plans/1/reserve`

**Body:** (ไม่ต้องส่งอะไร)
```json
{}
```

**Response:**
```json
{
  "id": 1,
  "planCode": "PP2401-0001",
  "planName": "แผนการผลิตเดือนมกราคม 2024",
  "planDate": "2024-01-15",
  "status": "reserved",
  "remarks": "แผนสำหรับลูกค้า ABC",
  "createDate": "2024-01-10T10:00:00.000Z",
  "createBy": "admin",
  "updateDate": "2024-01-10T12:00:00.000Z",
  "updateBy": "admin",
  "items": [...],
  "reservations": [
    {
      "id": 1,
      "planId": 1,
      "materialId": 10,
      "reservedQuantity": "500.0000",
      "lotNumber": null,
      "receiveDate": null,
      "createDate": "2024-01-10T12:00:00.000Z",
      "material": {
        "id": 10,
        "matCode": "M010",
        "matName": "วัตถุดิบ A"
      }
    }
  ]
}
```

---

## 8. ยืนยันแผนการผลิต

**POST** `/production-plans/1/confirm`

**Body:**
```json
{}
```

**Response:**
```json
{
  "id": 1,
  "planCode": "PP2401-0001",
  "status": "confirmed",
  "updateDate": "2024-01-10T13:00:00.000Z",
  "updateBy": "admin"
}
```

---

## 9. ยกเลิกแผนการผลิต

**POST** `/production-plans/1/cancel`

**Body:**
```json
{}
```

**Response:**
```json
{
  "id": 1,
  "planCode": "PP2401-0001",
  "status": "cancelled",
  "updateDate": "2024-01-10T14:00:00.000Z",
  "updateBy": "admin",
  "reservations": []
}
```

---

## 10. ดูรายการแผนทั้งหมด

**GET** `/production-plans`

**Response:**
```json
[
  {
    "id": 1,
    "planCode": "PP2401-0001",
    "planName": "แผนการผลิตเดือนมกราคม 2024",
    "planDate": "2024-01-15",
    "status": "draft",
    "remarks": "แผนสำหรับลูกค้า ABC",
    "createDate": "2024-01-10T10:00:00.000Z",
    "createBy": "admin",
    "updateDate": "2024-01-10T10:00:00.000Z",
    "updateBy": null,
    "items": [
      {
        "id": 1,
        "quantity": "100.0000",
        "product": {
          "id": 1,
          "productCode": "P001",
          "productName": "สินค้า A"
        }
      }
    ]
  }
]
```

---

## 11. ดูรายละเอียดแผน

**GET** `/production-plans/1`

**Response:** (เหมือนข้อ 1)

---

## 12. ลบแผนการผลิต

**DELETE** `/production-plans/1`

**Response:**
```json
{
  "message": "ลบแผนการผลิตสำเร็จ"
}
```

---

## 13. ดู Material ที่มีอยู่

**GET** `/materials/availability`

**Response:**
```json
[
  {
    "materialId": 10,
    "totalQty": 1000,
    "availableQty": 500,
    "reservedQty": 0,
    "updateDate": "2024-01-10T10:00:00.000Z",
    "material": {
      "id": 10,
      "matCode": "M010",
      "matName": "วัตถุดิบ A"
    }
  }
]
```

---

## Error Response

```json
{
  "statusCode": 400,
  "message": "สามารถแก้ไขได้เฉพาะแผนที่อยู่ในสถานะ draft เท่านั้น",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 404,
  "message": "ไม่พบแผนการผลิต",
  "error": "Not Found"
}
```

```json
{
  "statusCode": 400,
  "message": "Material ID 10 มีจำนวนไม่เพียงพอ (ต้องการ: 1000, มีอยู่: 500)",
  "error": "Bad Request"
}
```

---

## สถานะของแผน (Status)

- `draft` - ร่าง (สามารถแก้ไขได้)
- `reserved` - จอง material แล้ว
- `confirmed` - ยืนยันแล้ว (ไม่สามารถแก้ไขได้)
- `cancelled` - ยกเลิกแล้ว

---

## Validation Rules

### CreateProductionPlanDto
- `planName`: required, string
- `planDate`: required, date (YYYY-MM-DD)
- `remarks`: optional, string
- `items`: optional, array
  - `productId`: required, number
  - `quantity`: required, positive number
  - `unit`: optional, string
  - `remarks`: optional, string

### UpdateProductionPlanDto
- `planName`: optional, string
- `planDate`: optional, date (YYYY-MM-DD)
- `remarks`: optional, string

### AddPlanItemDto
- `productId`: required, number
- `quantity`: required, positive number
- `unit`: optional, string
- `remarks`: optional, string

### UpdatePlanItemDto
- `quantity`: optional, positive number
- `unit`: optional, string
- `remarks`: optional, string
