# Production Planning API

API สำหรับระบบจัดงานล่วงหน้า โดยมีการจอง material ตาม FIFO

## Features

- สร้างและจัดการแผนการผลิต
- เพิ่ม/แก้ไข/ลบรายการสินค้าในแผน
- จอง material อัตโนมัติตาม BOM
- ระบบ FIFO สำหรับการจอง material
- ยืนยันและยกเลิกแผนการผลิต

## API Endpoints

### แผนการผลิต

#### สร้างแผนการผลิต
```
POST /production-plans
```

Request Body:
```json
{
  "planName": "แผนการผลิตเดือนมกราคม",
  "planDate": "2024-01-15",
  "remarks": "หมายเหตุ",
  "items": [
    {
      "productId": 1,
      "quantity": 100,
      "unit": "ชิ้น",
      "remarks": "หมายเหตุสินค้า"
    }
  ]
}
```

#### ดูรายการแผนการผลิตทั้งหมด
```
GET /production-plans
```

#### ดูรายละเอียดแผนการผลิต
```
GET /production-plans/:id
```

#### แก้ไขแผนการผลิต
```
PATCH /production-plans/:id
```

Request Body:
```json
{
  "planName": "แผนการผลิตเดือนมกราคม (แก้ไข)",
  "planDate": "2024-01-20",
  "remarks": "หมายเหตุใหม่"
}
```

#### ลบแผนการผลิต
```
DELETE /production-plans/:id
```

### รายการสินค้าในแผน

#### เพิ่มรายการสินค้า
```
POST /production-plans/:id/items
```

Request Body:
```json
{
  "productId": 2,
  "quantity": 50,
  "unit": "ชิ้น",
  "remarks": "หมายเหตุ"
}
```

#### แก้ไขรายการสินค้า
```
PATCH /production-plans/:id/items/:itemId
```

Request Body:
```json
{
  "quantity": 75,
  "remarks": "หมายเหตุใหม่"
}
```

#### ลบรายการสินค้า
```
DELETE /production-plans/:id/items/:itemId
```

### การจอง Material

#### จอง Material (FIFO)
```
POST /production-plans/:id/reserve
```

ระบบจะ:
1. คำนวณ material ที่ต้องใช้จาก BOM
2. ตรวจสอบ stock ที่มีอยู่
3. จอง material ตาม FIFO
4. อัพเดท available_qty และ reserved_qty

#### ยืนยันแผนการผลิต
```
POST /production-plans/:id/confirm
```

#### ยกเลิกแผนการผลิต
```
POST /production-plans/:id/cancel
```

ระบบจะคืน material ที่จองไว้กลับเข้า stock

### ตรวจสอบ Material

#### ดู Material ที่มีอยู่
```
GET /materials/availability
```

## สถานะของแผนการผลิต

- `draft` - แผนที่กำลังสร้าง (สามารถแก้ไขได้)
- `reserved` - จอง material แล้ว
- `confirmed` - ยืนยันแผนแล้ว (ไม่สามารถแก้ไขได้)
- `cancelled` - ยกเลิกแล้ว

## กระบวนการทำงาน

1. **สร้างแผน** - สร้างแผนการผลิตใหม่ (สถานะ: draft)
2. **เพิ่มสินค้า** - เพิ่มรายการสินค้าที่ต้องการผลิต
3. **จอง Material** - ระบบจะคำนวณและจอง material อัตโนมัติ (สถานะ: reserved)
4. **ยืนยัน** - ยืนยันแผนการผลิต (สถานะ: confirmed)

## Database Schema

### production_plans
- id, plan_code, plan_name, plan_date
- status, remarks
- create_date, create_by, update_date, update_by

### production_plan_items
- id, plan_id, product_id
- quantity, unit, remarks
- create_date

### material_reservations
- id, plan_id, material_id
- reserved_quantity, lot_number, receive_date
- create_date

## Migration

รัน migration script:
```bash
mysql -u username -p database_name < migrations/add-production-planning-system.sql
```

Rollback:
```bash
mysql -u username -p database_name < migrations/rollback-production-planning-system.sql
```
