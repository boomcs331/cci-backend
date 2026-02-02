# การรวม Production Material Issues กับ Material Issuing

## 🎯 สรุปการออกแบบ

แทนที่จะสร้างตาราง `production_material_issues` ใหม่ เราจะ**ใช้ตาราง `material_issuing` ที่มีอยู่แล้ว** โดยเพิ่มฟิลด์เพื่อรองรับการจ่ายวัตถุดิบสำหรับการผลิต

---

## 📊 โครงสร้างตาราง

### 1. ตาราง `material_issuing` (ปรับปรุง)

```sql
-- เพิ่มฟิลด์ใหม่
ALTER TABLE material_issuing 
ADD COLUMN production_order_id INTEGER,
ADD COLUMN required_quantity DECIMAL(15,4),
ADD CONSTRAINT fk_issuing_production 
  FOREIGN KEY (production_order_id) 
  REFERENCES production_orders(id) 
  ON DELETE SET NULL;

-- Index
CREATE INDEX idx_material_issuing_production 
  ON material_issuing(production_order_id);
```

### 2. ตาราง `production_material_requirements` (ใหม่)

ตารางชั่วคราวเก็บความต้องการวัตถุดิบที่คำนวณจาก BOM

```sql
CREATE TABLE production_material_requirements (
  id SERIAL PRIMARY KEY,
  production_order_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  required_quantity DECIMAL(15,4) NOT NULL,
  issued_quantity DECIMAL(15,4) DEFAULT 0,
  unit VARCHAR(50),
  status VARCHAR(50) DEFAULT 'PENDING',
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_req_production 
    FOREIGN KEY (production_order_id) 
    REFERENCES production_orders(id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_req_material 
    FOREIGN KEY (material_id) 
    REFERENCES materials(id),
  CONSTRAINT uq_production_material 
    UNIQUE (production_order_id, material_id)
);
```

### 3. อัพเดท IssuingType Enum

```typescript
export enum IssuingType {
  NORMAL_PRODUCTION = 'NORMAL_PRODUCTION',
  STOCK_DEDUCTION = 'STOCK_DEDUCTION',
  SPARE_PARTS_REPLACEMENT = 'SPARE_PARTS_REPLACEMENT',
  PRODUCTION_ORDER = 'PRODUCTION_ORDER'  // ← เพิ่มใหม่
}
```

---

## 🔄 Flow การทำงาน

### 1. สร้างคำสั่งผลิต
```
production_orders
  ↓
คำนวณจาก product_bom
  ↓
สร้าง production_material_requirements
```

### 2. จ่ายวัตถุดิบ
```
ดูจาก production_material_requirements
  ↓
สร้าง material_issuing
  - issuing_type = 'PRODUCTION_ORDER'
  - production_order_id = xxx
  - required_quantity = จาก requirements
  - total_quantity = จำนวนที่จ่ายจริง
  ↓
อัพเดท issued_quantity ใน requirements
  ↓
หักสต็อก materials_stock
```

---

## 📋 ตัวอย่าง SQL

### สร้างคำสั่งผลิตและคำนวณความต้องการ

```sql
-- 1. สร้างคำสั่งผลิต
INSERT INTO production_orders (order_no, product_id, quantity, status, planned_date)
VALUES ('PO-2024-001', 1, 100, 'PENDING', '2024-01-15');

-- 2. คำนวณและสร้างความต้องการวัตถุดิบ
INSERT INTO production_material_requirements 
  (production_order_id, material_id, required_quantity, unit, status)
SELECT 
  1 as production_order_id,
  pb.material_id,
  pb.quantity_per_unit * 100 as required_quantity,
  pb.unit,
  'PENDING' as status
FROM product_bom pb
WHERE pb.product_id = 1 AND pb.is_active = true;
```

### จ่ายวัตถุดิบ

```sql
-- 3. สร้างรายการจ่ายวัตถุดิบ
INSERT INTO material_issuing (
  issuing_no, issuing_date, issuing_type, 
  material_id, total_quantity, unit,
  production_order_id, required_quantity,
  work_order_no, part_no, requester, remark, status
)
VALUES (
  'ISS-2024-001', 
  NOW(), 
  'PRODUCTION_ORDER',
  1,  -- MAT-001
  200,  -- จ่าย 200 ชิ้น
  'ชิ้น',
  1,  -- production_order_id
  200,  -- required_quantity
  'PO-2024-001',
  'PROD-A001',
  'admin',
  'จ่ายวัตถุดิบสำหรับคำสั่งผลิต PO-2024-001',
  'COMPLETED'
);

-- 4. อัพเดทความต้องการ
UPDATE production_material_requirements
SET issued_quantity = issued_quantity + 200,
    status = CASE 
      WHEN issued_quantity + 200 >= required_quantity THEN 'COMPLETED'
      ELSE 'PARTIAL'
    END
WHERE production_order_id = 1 AND material_id = 1;
```

### Query ดูสถานะการจ่าย

```sql
SELECT 
  po.order_no,
  p.product_code,
  m.mat_code,
  mt.code as material_type,
  pmr.required_quantity,
  pmr.issued_quantity,
  pmr.required_quantity - pmr.issued_quantity as remaining,
  pmr.status,
  ms.quantity as current_stock
FROM production_material_requirements pmr
JOIN production_orders po ON pmr.production_order_id = po.id
JOIN products p ON po.product_id = p.id
JOIN materials m ON pmr.material_id = m.id
JOIN materials_type mt ON m.mat_type_id = mt.id
LEFT JOIN materials_stock ms ON m.id = ms.material_id
WHERE po.order_no = 'PO-2024-001'
ORDER BY mt.code, m.mat_code;
```

---

## ✅ ข้อดีของการรวมตาราง

1. **ไม่ต้องสร้างตารางใหม่** - ใช้ระบบที่มีอยู่
2. **รองรับ Lot Tracking** - ใช้ material_issuing_lots ได้เลย
3. **ประวัติครบถ้วน** - เก็บประวัติการจ่ายทั้งหมดในที่เดียว
4. **ยืดหยุ่น** - issuing_type แยกประเภทได้ชัดเจน
5. **ง่ายต่อการ Query** - ใช้ตารางเดียวในการดูประวัติ

---

## 🔑 ฟิลด์สำคัญใน material_issuing

| ฟิลด์ | ใช้งาน |
|------|--------|
| `issuing_type` | ตั้งเป็น 'PRODUCTION_ORDER' |
| `production_order_id` | เชื่อมกับคำสั่งผลิต |
| `required_quantity` | จำนวนที่ต้องใช้ตาม BOM |
| `total_quantity` | จำนวนที่จ่ายจริง |
| `work_order_no` | เก็บ order_no ของคำสั่งผลิต |
| `part_no` | เก็บ product_code |

---

## 📝 Migration Script

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductionOrderToMaterialIssuing1234567890 
  implements MigrationInterface {
  
  public async up(queryRunner: QueryRunner): Promise<void> {
    // เพิ่มฟิลด์ใหม่
    await queryRunner.query(`
      ALTER TABLE material_issuing 
      ADD COLUMN production_order_id INTEGER,
      ADD COLUMN required_quantity DECIMAL(15,4)
    `);
    
    // เพิ่ม Foreign Key
    await queryRunner.query(`
      ALTER TABLE material_issuing
      ADD CONSTRAINT fk_issuing_production 
      FOREIGN KEY (production_order_id) 
      REFERENCES production_orders(id) 
      ON DELETE SET NULL
    `);
    
    // เพิ่ม Index
    await queryRunner.query(`
      CREATE INDEX idx_material_issuing_production 
      ON material_issuing(production_order_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE material_issuing 
      DROP CONSTRAINT fk_issuing_production
    `);
    
    await queryRunner.query(`
      DROP INDEX idx_material_issuing_production
    `);
    
    await queryRunner.query(`
      ALTER TABLE material_issuing 
      DROP COLUMN production_order_id,
      DROP COLUMN required_quantity
    `);
  }
}
```

---

## 🎯 สรุป

ใช้ **2 ตาราง** หลัก:

1. **`production_material_requirements`** - เก็บความต้องการวัตถุดิบ (คำนวณจาก BOM)
2. **`material_issuing`** - เก็บการจ่ายวัตถุดิบจริง (ใช้ตารางเดิม + เพิ่มฟิลด์)

ความสัมพันธ์:
```
production_orders (1) → (N) production_material_requirements
production_orders (1) → (N) material_issuing
```
