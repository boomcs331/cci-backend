# Material Issuing Types - การจ่ายออกวัสดุ 3 แบบ

## 📋 สรุปการเปลี่ยนแปลง

เพิ่มฟีเจอร์การจ่ายออกวัสดุ 3 ประเภท:

1. **NORMAL_PRODUCTION** (จ่ายออกแบบสั่งผลิตปกติ)
   - ใช้สำหรับการผลิตสินค้าตามใบสั่งผลิต
   - มีเลขที่ Work Order
   - Prefix: `ISS-PRD-`

2. **STOCK_DEDUCTION** (จ่ายออกแบบตัดสต็อก)
   - ใช้สำหรับตัดสต็อกเมื่อวัสดุเสียหาย หมดอายุ หรือปรับปรุงสต็อก
   - Prefix: `ISS-STK-`

3. **SPARE_PARTS_REPLACEMENT** (จ่ายออกแบบเบิกอะไหล่ทดแทน)
   - ใช้สำหรับเบิกอะไหล่เพื่อซ่อมบำรุงเครื่องจักร
   - มีข้อมูลเครื่องจักร (machineNo) และหมายเลขชิ้นส่วน (partNo)
   - Prefix: `ISS-SPR-`

## 📁 ไฟล์ที่มีการเปลี่ยนแปลง

### 1. Entity (receiving-issuing.entity.ts)
- เพิ่มฟิลด์ `issuingType` สำหรับระบุประเภทการจ่ายออก
- เพิ่มฟิลด์ `machineNo` สำหรับหมายเลขเครื่องจักร
- เพิ่มฟิลด์ `partNo` สำหรับหมายเลขชิ้นส่วนอะไหล่
- เพิ่มฟิลด์ `requester` สำหรับชื่อผู้ขอเบิก

### 2. DTO (receiving-issuing.dto.ts)
- เพิ่ม enum `IssuingType` สำหรับกำหนดประเภทการจ่ายออก
- อัพเดท `CreateIssuingDto` ให้รองรับฟิลด์ใหม่ทั้งหมด

### 3. Service (receiving-issuing.service.ts)
- อัพเดท `createIssuing()` ให้สร้างเลขที่การจ่ายออกตามประเภท
- เพิ่ม filter `issuingType` ใน `getAllIssuings()`
- บันทึก issuing type ใน transaction log

### 4. Controller (receiving-issuing.controller.ts)
- เพิ่ม query parameter `issuingType` สำหรับกรองข้อมูล

### 5. Database Migration (add-issuing-types.sql)
- SQL script สำหรับเพิ่มคอลัมน์ใหม่ในตาราง material_issuing
- สร้าง index สำหรับเพิ่มประสิทธิภาพการค้นหา

## 🚀 วิธีการติดตั้ง

### 1. รัน Database Migration
```bash
# เชื่อมต่อกับ PostgreSQL และรัน migration script
psql -U postgres -d cps_cci -f src/database/migrations/add-issuing-types.sql
```

หรือใช้ SQL client ที่คุณถนัด (DBeaver, pgAdmin, etc.) เพื่อรัน script ใน `add-issuing-types.sql`

### 2. Restart Application
```bash
pnpm run start:dev
```

## 📖 การใช้งาน

### ตัวอย่างที่ 1: จ่ายออกสำหรับผลิตสินค้า
```bash
POST /materials/transactions/issue
Content-Type: application/json

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

### ตัวอย่างที่ 2: ตัดสต็อกวัสดุเสียหาย
```bash
POST /materials/transactions/issue
Content-Type: application/json

{
  "issuingType": "STOCK_DEDUCTION",
  "materialId": 2,
  "quantity": 50,
  "department": "Warehouse",
  "remark": "ตัดสต็อกเนื่องจากวัสดุเสียหาย",
  "createBy": "user456"
}
```

### ตัวอย่างที่ 3: เบิกอะไหล่ซ่อมเครื่องจักร
```bash
POST /materials/transactions/issue
Content-Type: application/json

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

### การกรองข้อมูล
```bash
# ดูเฉพาะการจ่ายออกแบบสั่งผลิต
GET /materials/transactions/issuings?issuingType=NORMAL_PRODUCTION

# ดูเฉพาะการตัดสต็อก
GET /materials/transactions/issuings?issuingType=STOCK_DEDUCTION

# ดูเฉพาะการเบิกอะไหล่
GET /materials/transactions/issuings?issuingType=SPARE_PARTS_REPLACEMENT

# ค้นหาจากหมายเลขเครื่องจักร
GET /materials/transactions/issuings?search=MC-001&issuingType=SPARE_PARTS_REPLACEMENT
```

## 📚 เอกสารเพิ่มเติม

- [API Documentation](./API-DOCUMENTATION.md) - เอกสาร API แบบละเอียด
- [Payload Examples](./payload-examples.json) - ตัวอย่าง payload สำหรับทดสอบ

## 🔍 การตรวจสอบ

### ตรวจสอบว่า migration สำเร็จ
```sql
-- ตรวจสอบคอลัมน์ใหม่
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'material_issuing' 
AND column_name IN ('issuing_type', 'machine_no', 'part_no', 'requester');

-- ตรวจสอบ index
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'material_issuing' 
AND indexname LIKE 'idx_material_issuing%';
```

### ทดสอบ API
```bash
# ทดสอบสร้างการจ่ายออก
curl -X POST http://localhost:3000/materials/transactions/issue \
  -H "Content-Type: application/json" \
  -d @.kiro/specs/material-issuing-types/test-payload.json

# ทดสอบดึงข้อมูล
curl -X GET "http://localhost:3000/materials/transactions/issuings?issuingType=NORMAL_PRODUCTION"
```

## ⚠️ หมายเหตุสำคัญ

1. **Backward Compatibility**: ข้อมูลเก่าที่มีอยู่จะถูกตั้งค่าเป็น `NORMAL_PRODUCTION` โดยอัตโนมัติ
2. **Required Fields**: ฟิลด์ `issuingType` เป็น required สำหรับการสร้างการจ่ายออกใหม่
3. **Validation**: ระบบจะตรวจสอบว่า `issuingType` ต้องเป็นหนึ่งใน 3 ค่าที่กำหนดเท่านั้น
4. **FIFO**: ระบบยังคงใช้หลักการ FIFO ในการจัดสรรวัสดุจาก Lot
5. **Transaction Log**: ทุกการจ่ายออกจะถูกบันทึกพร้อมกับประเภทการจ่ายออก

## 🐛 Troubleshooting

### ปัญหา: Migration ไม่สำเร็จ
**วิธีแก้**: ตรวจสอบว่าเชื่อมต่อกับ database ที่ถูกต้อง และมีสิทธิ์ในการแก้ไขตาราง

### ปัญหา: Validation Error เมื่อสร้างการจ่ายออก
**วิธีแก้**: ตรวจสอบว่า `issuingType` มีค่าเป็น `NORMAL_PRODUCTION`, `STOCK_DEDUCTION`, หรือ `SPARE_PARTS_REPLACEMENT` เท่านั้น

### ปัญหา: ไม่สามารถกรองตาม issuingType ได้
**วิธีแก้**: ตรวจสอบว่าได้ restart application หลังจากอัพเดทโค้ดแล้ว

## 📞 ติดต่อ

หากมีคำถามหรือพบปัญหา กรุณาติดต่อทีมพัฒนา
