# API การจ่ายออกวัสดุ (Material Issuing API)

## ภาพรวม
API นี้รองรับการจ่ายออกวัสดุ 3 ประเภท:
1. **NORMAL_PRODUCTION** - จ่ายออกแบบสั่งผลิตปกติ
2. **STOCK_DEDUCTION** - จ่ายออกแบบตัดสต็อก
3. **SPARE_PARTS_REPLACEMENT** - จ่ายออกแบบเบิกอะไหล่ทดแทน

## Endpoints

### 1. สร้างการจ่ายออกวัสดุ
**POST** `/materials/transactions/issue`

#### Request Body

##### 1.1 จ่ายออกแบบสั่งผลิตปกติ (NORMAL_PRODUCTION)
```json
{
  "issuingType": "NORMAL_PRODUCTION",
  "materialId": 1,
  "quantity": 100,
  "department": "Production",
  "workOrderNo": "WO-2026-001",
  "remark": "สำหรับผลิตสินค้า Batch A",
  "createBy": "user123"
}
```

**คำอธิบาย:**
- `issuingType`: ระบุเป็น "NORMAL_PRODUCTION"
- `materialId`: รหัสวัสดุที่ต้องการจ่ายออก
- `quantity`: จำนวนที่ต้องการจ่าย
- `department`: แผนกที่เบิก
- `workOrderNo`: เลขที่ใบสั่งผลิต (Work Order)
- `remark`: หมายเหตุเพิ่มเติม
- `createBy`: ผู้สร้างรายการ

##### 1.2 จ่ายออกแบบตัดสต็อก (STOCK_DEDUCTION)
```json
{
  "issuingType": "STOCK_DEDUCTION",
  "materialId": 2,
  "quantity": 50,
  "department": "Warehouse",
  "remark": "ตัดสต็อกเนื่องจากวัสดุเสียหาย",
  "createBy": "user456"
}
```

**คำอธิบาย:**
- `issuingType`: ระบุเป็น "STOCK_DEDUCTION"
- ใช้สำหรับการตัดสต็อกเมื่อวัสดุเสียหาย หมดอายุ หรือต้องการปรับปรุงสต็อก

##### 1.3 จ่ายออกแบบเบิกอะไหล่ทดแทน (SPARE_PARTS_REPLACEMENT)
```json
{
  "issuingType": "SPARE_PARTS_REPLACEMENT",
  "materialId": 3,
  "quantity": 5,
  "department": "Maintenance",
  "machineNo": "MC-001",
  "partNo": "PART-12345",
  "requester": "นาย ก. ช่างซ่อม",
  "remark": "เปลี่ยนอะไหล่เครื่องจักร MC-001",
  "createBy": "user789"
}
```

**คำอธิบาย:**
- `issuingType`: ระบุเป็น "SPARE_PARTS_REPLACEMENT"
- `machineNo`: หมายเลขเครื่องจักรที่ต้องการเปลี่ยนอะไหล่
- `partNo`: หมายเลขชิ้นส่วนอะไหล่
- `requester`: ชื่อผู้ขอเบิก
- ใช้สำหรับการเบิกอะไหล่เพื่อซ่อมบำรุงเครื่องจักร

#### Response Success (200)
```json
{
  "success": true,
  "message": "Material issued successfully",
  "data": {
    "id": 1,
    "issuingNo": "ISS-PRD-2026-0001",
    "issuingDate": "2026-01-22T10:30:00.000Z",
    "issuingType": "NORMAL_PRODUCTION",
    "materialId": 1,
    "totalQuantity": 100,
    "unit": "KG",
    "department": "Production",
    "workOrderNo": "WO-2026-001",
    "status": "COMPLETED",
    "material": {
      "id": 1,
      "matCode": "MAT-001",
      "itemsName": {
        "name": "วัสดุตัวอย่าง"
      }
    },
    "lots": [
      {
        "id": 1,
        "qrCode": "QR-LOT-1-20260122-001-ABC123",
        "quantity": 100,
        "lot": {
          "lotNo": "LOT-1-20260122-001",
          "remainingQuantity": 400
        }
      }
    ]
  }
}
```

**หมายเหตุ:**
- เลขที่การจ่ายออก (issuingNo) จะมี prefix ต่างกันตามประเภท:
  - `ISS-PRD-` สำหรับ NORMAL_PRODUCTION
  - `ISS-STK-` สำหรับ STOCK_DEDUCTION
  - `ISS-SPR-` สำหรับ SPARE_PARTS_REPLACEMENT

#### Response Error (400/404/409)
```json
{
  "success": false,
  "message": "Insufficient stock. Available: 50, Requested: 100"
}
```

---

### 2. ดึงรายการการจ่ายออกทั้งหมด
**GET** `/materials/transactions/issuings`

#### Query Parameters
- `page` (optional): หน้าที่ต้องการ (default: 1)
- `limit` (optional): จำนวนรายการต่อหน้า (default: 10)
- `search` (optional): ค้นหาจาก issuingNo, workOrderNo, matCode, ชื่อวัสดุ, แผนก
- `sortBy` (optional): เรียงตาม (id, issuingNo, issuingDate, totalQuantity, createDate)
- `sortOrder` (optional): ASC หรือ DESC (default: DESC)
- `materialId` (optional): กรองตามรหัสวัสดุ
- `department` (optional): กรองตามแผนก
- `status` (optional): กรองตามสถานะ
- `issuingType` (optional): กรองตามประเภทการจ่ายออก (NORMAL_PRODUCTION, STOCK_DEDUCTION, SPARE_PARTS_REPLACEMENT)

#### ตัวอย่างการใช้งาน

##### ดึงรายการจ่ายออกแบบสั่งผลิตปกติ
```
GET /materials/transactions/issuings?issuingType=NORMAL_PRODUCTION&page=1&limit=20
```

##### ดึงรายการจ่ายออกแบบตัดสต็อก
```
GET /materials/transactions/issuings?issuingType=STOCK_DEDUCTION
```

##### ดึงรายการจ่ายออกแบบเบิกอะไหล่ทดแทน
```
GET /materials/transactions/issuings?issuingType=SPARE_PARTS_REPLACEMENT&department=Maintenance
```

##### ค้นหาและกรองหลายเงื่อนไข
```
GET /materials/transactions/issuings?search=MC-001&issuingType=SPARE_PARTS_REPLACEMENT&sortBy=issuingDate&sortOrder=DESC
```

#### Response Success (200)
```json
{
  "success": true,
  "message": "Issuings retrieved successfully",
  "data": [
    {
      "id": 1,
      "issuingNo": "ISS-PRD-2026-0001",
      "issuingDate": "2026-01-22T10:30:00.000Z",
      "issuingType": "NORMAL_PRODUCTION",
      "materialId": 1,
      "totalQuantity": 100,
      "unit": "KG",
      "department": "Production",
      "workOrderNo": "WO-2026-001",
      "status": "COMPLETED",
      "material": {
        "matCode": "MAT-001",
        "itemsName": {
          "name": "วัสดุตัวอย่าง"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

## ฟิลด์ที่ใช้ในแต่ละประเภท

| ฟิลด์ | NORMAL_PRODUCTION | STOCK_DEDUCTION | SPARE_PARTS_REPLACEMENT |
|-------|-------------------|-----------------|-------------------------|
| issuingType | ✅ Required | ✅ Required | ✅ Required |
| materialId | ✅ Required | ✅ Required | ✅ Required |
| quantity | ✅ Required | ✅ Required | ✅ Required |
| department | ✅ Recommended | ✅ Recommended | ✅ Recommended |
| workOrderNo | ✅ Recommended | ❌ | ❌ |
| machineNo | ❌ | ❌ | ✅ Recommended |
| partNo | ❌ | ❌ | ✅ Recommended |
| requester | ⚪ Optional | ⚪ Optional | ✅ Recommended |
| remark | ⚪ Optional | ⚪ Optional | ⚪ Optional |
| createBy | ⚪ Optional | ⚪ Optional | ⚪ Optional |

---

## กระบวนการทำงาน

### 1. การจ่ายออกวัสดุ (ทุกประเภท)
1. ตรวจสอบว่ามีวัสดุในระบบหรือไม่
2. ดึงรายการ Lot ที่มีสต็อกเหลือ (FIFO - First In First Out)
3. ตรวจสอบว่ามีสต็อกเพียงพอหรือไม่
4. สร้างเลขที่การจ่ายออกตามประเภท
5. จัดสรรวัสดุจาก Lot ต่างๆ ตามลำดับ FIFO
6. อัพเดทสถานะและจำนวนคงเหลือของแต่ละ Lot
7. บันทึก Transaction Log
8. อัพเดทสต็อกรวม

### 2. การตรวจสอบสต็อก
- ระบบจะตรวจสอบสต็อกที่พร้อมใช้งาน (AVAILABLE, PARTIAL_USED)
- หากสต็อกไม่เพียงพอ จะแจ้งเตือนและไม่อนุญาตให้จ่ายออก

### 3. การจัดการ Lot
- ใช้หนักการ FIFO (First In First Out)
- Lot ที่เข้ามาก่อนจะถูกจ่ายออกก่อน
- สถานะ Lot:
  - `AVAILABLE`: พร้อมใช้งาน
  - `PARTIAL_USED`: ใช้งานบางส่วน
  - `USED_UP`: ใช้หมดแล้ว

---

## ตัวอย่างการใช้งานจริง

### Scenario 1: จ่ายวัสดุสำหรับผลิตสินค้า
```bash
curl -X POST http://localhost:3000/materials/transactions/issue \
  -H "Content-Type: application/json" \
  -d '{
    "issuingType": "NORMAL_PRODUCTION",
    "materialId": 1,
    "quantity": 500,
    "department": "Production Line 1",
    "workOrderNo": "WO-2026-0123",
    "remark": "ผลิตสินค้า SKU-ABC-001",
    "createBy": "prod_user"
  }'
```

### Scenario 2: ตัดสต็อกวัสดุที่เสียหาย
```bash
curl -X POST http://localhost:3000/materials/transactions/issue \
  -H "Content-Type: application/json" \
  -d '{
    "issuingType": "STOCK_DEDUCTION",
    "materialId": 5,
    "quantity": 20,
    "department": "Warehouse",
    "remark": "วัสดุเสียหายจากการขนส่ง - Lot หมดอายุ",
    "createBy": "warehouse_admin"
  }'
```

### Scenario 3: เบิกอะไหล่เพื่อซ่อมเครื่องจักร
```bash
curl -X POST http://localhost:3000/materials/transactions/issue \
  -H "Content-Type: application/json" \
  -d '{
    "issuingType": "SPARE_PARTS_REPLACEMENT",
    "materialId": 10,
    "quantity": 2,
    "department": "Maintenance",
    "machineNo": "CNC-MACHINE-05",
    "partNo": "BEARING-6205",
    "requester": "นายสมชาย ช่างเทคนิค",
    "remark": "เปลี่ยนแบริ่งเครื่อง CNC เนื่องจากชำรุด",
    "createBy": "maintenance_user"
  }'
```

---

## Error Codes

| Status Code | Message | คำอธิบาย |
|-------------|---------|----------|
| 400 | Bad Request | ข้อมูลที่ส่งมาไม่ถูกต้อง |
| 404 | Material not found | ไม่พบวัสดุในระบบ |
| 409 | Insufficient stock | สต็อกไม่เพียงพอ |
| 500 | Internal Server Error | เกิดข้อผิดพลาดในระบบ |

---

## หมายเหตุสำคัญ

1. **การจัดการสต็อก**: ระบบจะอัพเดทสต็อกแบบ Real-time ทันทีที่มีการจ่ายออก
2. **FIFO**: วัสดุจะถูกจ่ายออกตามลำดับ Lot ที่เข้ามาก่อน
3. **Transaction Log**: ทุกการจ่ายออกจะถูกบันทึกใน Transaction Log เพื่อการตรวจสอบย้อนหลัง
4. **QR Code**: แต่ละ Lot จะมี QR Code สำหรับการติดตามและตรวจสอบ
5. **Validation**: ระบบจะตรวจสอบความถูกต้องของข้อมูลก่อนทำการจ่ายออกทุกครั้ง
