# ออกแบบระบบ Product และ Bill of Materials (BOM)

## 📋 ภาพรวมระบบ

ระบบนี้จะจัดการความสัมพันธ์ระหว่าง **สินค้า (Products)** และ **วัตถุดิบ (Materials)** โดยใช้ **BOM (Bill of Materials)** เป็นตัวกำหนดว่าสินค้าแต่ละชิ้นต้องใช้วัตถุดิบอะไรบ้าง และใช้จำนวนเท่าไร

---

## 🗄️ โครงสร้างฐานข้อมูล

### 1. ตาราง `products` (สินค้า)

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  product_code VARCHAR(50) UNIQUE NOT NULL,           -- รหัสสินค้า เช่น PROD-A001
  product_name VARCHAR(255) NOT NULL,                 -- ชื่อสินค้า
  description TEXT,                                   -- รายละเอียดสินค้า
  unit VARCHAR(50),                                   -- หน่วยนับ เช่น ชิ้น, กล่อง
  is_active BOOLEAN DEFAULT true,                     -- สถานะใช้งาน
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  create_by VARCHAR(255),
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_by VARCHAR(255)
);

-- Index
CREATE INDEX idx_products_code ON products(product_code);
CREATE INDEX idx_products_active ON products(is_active);
```

### 2. ตาราง `product_bom` (Bill of Materials - สูตรการผลิต)

```sql
CREATE TABLE product_bom (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,                        -- FK ไปยัง products
  material_id INTEGER NOT NULL,                       -- FK ไปยัง materials
  quantity_per_unit DECIMAL(10,4) NOT NULL,          -- จำนวนวัตถุดิบที่ใช้ต่อ 1 หน่วยสินค้า
  unit VARCHAR(50),                                   -- หน่วยของวัตถุดิบ
  sequence_order INTEGER,                             -- ลำดับการประกอบ (ถ้ามี)
  is_active BOOLEAN DEFAULT true,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  create_by VARCHAR(255),
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_by VARCHAR(255),
  
  CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_material FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE RESTRICT,
  CONSTRAINT uq_product_material UNIQUE (product_id, material_id)
);

-- Index
CREATE INDEX idx_bom_product ON product_bom(product_id);
CREATE INDEX idx_bom_material ON product_bom(material_id);
```

### 3. ตาราง `production_orders` (คำสั่งผลิต)

```sql
CREATE TABLE production_orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(50) UNIQUE NOT NULL,               -- เลขที่คำสั่งผลิต
  product_id INTEGER NOT NULL,                        -- FK ไปยัง products
  quantity DECIMAL(10,2) NOT NULL,                   -- จำนวนที่สั่งผลิต
  status VARCHAR(50) DEFAULT 'PENDING',              -- PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  planned_date DATE,                                  -- วันที่วางแผนผลิต
  completed_date DATE,                                -- วันที่ผลิตเสร็จ
  notes TEXT,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  create_by VARCHAR(255),
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_by VARCHAR(255),
  
  CONSTRAINT fk_production_product FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Index
CREATE INDEX idx_production_orders_no ON production_orders(order_no);
CREATE INDEX idx_production_orders_status ON production_orders(status);
CREATE INDEX idx_production_orders_date ON production_orders(planned_date);
```

### 4. ปรับปรุงตาราง `material_issuing` (ใช้ตารางเดิม)

```sql
-- เพิ่มฟิลด์ใหม่ในตาราง material_issuing ที่มีอยู่
ALTER TABLE material_issuing 
ADD COLUMN production_order_id INTEGER,
ADD COLUMN required_quantity DECIMAL(15,4),
ADD CONSTRAINT fk_issuing_production FOREIGN KEY (production_order_id) 
  REFERENCES production_orders(id) ON DELETE SET NULL;

-- Index
CREATE INDEX idx_material_issuing_production ON material_issuing(production_order_id);

-- อัพเดท issuing_type enum
-- เพิ่ม 'PRODUCTION_ORDER' ใน IssuingType enum
```

**โครงสร้างตาราง material_issuing ที่มีอยู่แล้ว:**
- `issuing_no` - เลขที่จ่าย
- `issuing_date` - วันที่จ่าย
- `issuing_type` - ประเภทการจ่าย (เพิ่ม PRODUCTION_ORDER)
- `material_id` - FK ไปยัง materials
- `total_quantity` - จำนวนที่จ่ายจริง
- `work_order_no` - เลขที่ใบสั่งงาน (ใช้ได้)
- `part_no` - รหัสชิ้นส่วน (ใช้เก็บ product_code)
- `requester` - ผู้เบิก
- `remark` - หมายเหตุ
- `status` - สถานะ
- **`production_order_id`** - (ใหม่) FK ไปยัง production_orders
- **`required_quantity`** - (ใหม่) จำนวนที่ต้องใช้ตาม BOM

---

## 📊 ตัวอย่างข้อมูล

### ข้อมูลสินค้า (Products)

```sql
INSERT INTO products (product_code, product_name, description, unit) VALUES
('PROD-A001', 'สินค้า A รุ่น 001', 'สินค้าประกอบจากวัตถุดิบหลายชนิด', 'ชิ้น');
```

### ข้อมูล BOM (สูตรการผลิต)

สมมติว่ามี materials อยู่แล้ว:
- MAT-001 (PC) - id: 1
- MAT-002 (OF) - id: 2  
- MAT-003 (PC) - id: 3

```sql
-- PROD-A001 ประกอบด้วย
INSERT INTO product_bom (product_id, material_id, quantity_per_unit, unit, sequence_order) VALUES
(1, 1, 2.0000, 'ชิ้น', 1),  -- MAT-001 (PC) ใช้ 2 ชิ้นต่อ 1 สินค้า
(1, 2, 1.0000, 'ชิ้น', 2),  -- MAT-002 (OF) ใช้ 1 ชิ้นต่อ 1 สินค้า
(1, 3, 1.0000, 'ชิ้น', 3);  -- MAT-003 (PC) ใช้ 1 ชิ้นต่อ 1 สินค้า
```

### สร้างคำสั่งผลิต

```sql
INSERT INTO production_orders (order_no, product_id, quantity, status, planned_date, create_by) VALUES
('PO-2024-001', 1, 100, 'PENDING', '2024-01-15', 'admin');
```

### คำนวณและสร้างรายการจ่ายวัตถุดิบ

```sql
-- คำนวณอัตโนมัติจาก BOM
INSERT INTO production_material_issues (production_order_id, material_id, required_quantity, unit, status)
SELECT 
  1 as production_order_id,
  pb.material_id,
  pb.quantity_per_unit * 100 as required_quantity,  -- 100 คือจำนวนที่สั่งผลิต
  pb.unit,
  'PENDING' as status
FROM product_bom pb
WHERE pb.product_id = 1 AND pb.is_active = true;

-- ผลลัพธ์:
-- MAT-001 (PC): 2 * 100 = 200 ชิ้น
-- MAT-002 (OF): 1 * 100 = 100 ชิ้น
-- MAT-003 (PC): 1 * 100 = 100 ชิ้น
```

---

### 5. ตาราง `production_material_requirements` (ความต้องการวัตถุดิบ - ตารางชั่วคราว)

```sql
-- ตารางนี้เก็บข้อมูลความต้องการวัตถุดิบที่คำนวณจาก BOM
-- ใช้เป็นตัวกลางก่อนจ่ายจริง
CREATE TABLE production_material_requirements (
  id SERIAL PRIMARY KEY,
  production_order_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  required_quantity DECIMAL(15,4) NOT NULL,          -- จำนวนที่ต้องใช้ (จาก BOM)
  issued_quantity DECIMAL(15,4) DEFAULT 0,           -- จำนวนที่จ่ายไปแล้ว
  unit VARCHAR(50),
  status VARCHAR(50) DEFAULT 'PENDING',              -- PENDING, PARTIAL, COMPLETED
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_req_production FOREIGN KEY (production_order_id) 
    REFERENCES production_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_req_material FOREIGN KEY (material_id) 
    REFERENCES materials(id),
  CONSTRAINT uq_production_material UNIQUE (production_order_id, material_id)
);

-- Index
CREATE INDEX idx_requirements_order ON production_material_requirements(production_order_id);
CREATE INDEX idx_requirements_material ON production_material_requirements(material_id);
CREATE INDEX idx_requirements_status ON production_material_requirements(status);
```

---

## 🔍 Query ที่สำคัญ

### 1. ดูสูตรการผลิตของสินค้า (BOM)

```sql
SELECT 
  p.product_code,
  p.product_name,
  m.mat_code,
  mt.name as material_type,
  pb.quantity_per_unit,
  pb.unit,
  pb.sequence_order
FROM products p
JOIN product_bom pb ON p.id = pb.product_id
JOIN materials m ON pb.material_id = m.id
JOIN materials_type mt ON m.mat_type_id = mt.id
WHERE p.product_code = 'PROD-A001' 
  AND pb.is_active = true
ORDER BY pb.sequence_order;
```

### 2. คำนวณวัตถุดิบที่ต้องใช้สำหรับการผลิต

```sql
SELECT 
  m.mat_code,
  mt.code as material_type,
  pb.quantity_per_unit,
  100 as production_quantity,  -- จำนวนที่ต้องการผลิต
  (pb.quantity_per_unit * 100) as total_required,
  pb.unit,
  ms.quantity as current_stock
FROM products p
JOIN product_bom pb ON p.id = pb.product_id
JOIN materials m ON pb.material_id = m.id
JOIN materials_type mt ON m.mat_type_id = mt.id
LEFT JOIN materials_stock ms ON m.id = ms.material_id
WHERE p.product_code = 'PROD-A001' 
  AND pb.is_active = true;
```

### 3. ดูความต้องการวัตถุดิบตามประเภท (เช่น PC)

```sql
SELECT 
  po.order_no,
  p.product_code,
  p.product_name,
  po.quantity as production_qty,
  m.mat_code,
  mt.code as material_type,
  pmr.required_quantity,
  pmr.issued_quantity,
  pmr.status,
  ms.quantity as current_stock
FROM production_orders po
JOIN products p ON po.product_id = p.id
JOIN production_material_requirements pmr ON po.id = pmr.production_order_id
JOIN materials m ON pmr.material_id = m.id
JOIN materials_type mt ON m.mat_type_id = mt.id
LEFT JOIN materials_stock ms ON m.id = ms.material_id
WHERE mt.code = 'PC'  -- กรองเฉพาะประเภท PC
  AND po.order_no = 'PO-2024-001'
ORDER BY m.mat_code;
```

### 4. ดูประวัติการจ่ายวัตถุดิบจริง (จาก material_issuing)

```sql
SELECT 
  po.order_no,
  p.product_code,
  mi.issuing_no,
  mi.issuing_date,
  m.mat_code,
  mt.code as material_type,
  mi.required_quantity,
  mi.total_quantity as issued_quantity,
  mi.status
FROM material_issuing mi
JOIN production_orders po ON mi.production_order_id = po.id
JOIN products p ON po.product_id = p.id
JOIN materials m ON mi.material_id = m.id
JOIN materials_type mt ON m.mat_type_id = mt.id
WHERE po.order_no = 'PO-2024-001'
  AND mt.code = 'PC'
ORDER BY mi.issuing_date, m.mat_code;
```

### 5. สรุปการใช้วัตถุดิบแต่ละประเภท

```sql
SELECT 
  mt.code as material_type,
  mt.name as type_name,
  m.mat_code,
  pmr.required_quantity,
  COALESCE(SUM(mi.total_quantity), 0) as total_issued,
  pmr.required_quantity - COALESCE(SUM(mi.total_quantity), 0) as remaining,
  m.unit
FROM production_material_requirements pmr
JOIN materials m ON pmr.material_id = m.id
JOIN materials_type mt ON m.mat_type_id = mt.id
LEFT JOIN material_issuing mi ON pmr.production_order_id = mi.production_order_id 
  AND pmr.material_id = mi.material_id
WHERE pmr.production_order_id = 1
GROUP BY mt.code, mt.name, m.mat_code, pmr.required_quantity, m.unit
ORDER BY mt.code, m.mat_code;
```

---

## 🔄 Flow การทำงาน

### 1. สร้างสินค้าและกำหนด BOM

```
1. สร้างสินค้าใหม่ใน products
2. กำหนดสูตรการผลิตใน product_bom
   - เลือกวัตถุดิบที่ต้องใช้
   - ระบุจำนวนที่ใช้ต่อ 1 หน่วยสินค้า
```

### 2. สร้างคำสั่งผลิต

```
1. สร้าง production_orders
   - เลือกสินค้าที่ต้องการผลิต
   - ระบุจำนวนที่ต้องการผลิต
   
2. ระบบคำนวณวัตถุดิบที่ต้องใช้อัตโนมัติ
   - ดึงข้อมูลจาก product_bom
   - คำนวณ: required_quantity = quantity_per_unit × production_quantity
   - สร้างรายการใน production_material_requirements
```

### 3. จ่ายวัตถุดิบ

```
1. ดูรายการวัตถุดิบที่ต้องจ่าย (จาก production_material_requirements)
2. กรองตามประเภทวัตถุดิบ (เช่น PC, OF)
3. ทำการจ่ายวัตถุดิบ
   - สร้างรายการใน material_issuing
     * issuing_type = 'PRODUCTION_ORDER'
     * production_order_id = คำสั่งผลิต
     * required_quantity = จำนวนที่ต้องใช้
     * total_quantity = จำนวนที่จ่ายจริง
   - สร้าง material_issuing_lots (ถ้าจ่ายแบบ lot)
   - อัพเดท issued_quantity ใน production_material_requirements
   - อัพเดท status (PARTIAL/COMPLETED)
   - หักสต็อกจาก materials_stock
```

### 4. ตรวจสอบและติดตาม

```
1. ตรวจสอบสถานะการจ่ายวัตถุดิบ
2. เปรียบเทียบ required_quantity vs issued_quantity
3. ตรวจสอบสต็อกคงเหลือ
4. อัพเดทสถานะคำสั่งผลิต
```

---

## 📱 API Endpoints ที่ควรมี

### Products

```
GET    /api/products                    - ดูรายการสินค้าทั้งหมด
GET    /api/products/:id                - ดูรายละเอียดสินค้า
POST   /api/products                    - สร้างสินค้าใหม่
PUT    /api/products/:id                - แก้ไขสินค้า
DELETE /api/products/:id                - ลบสินค้า
```

### Product BOM

```
GET    /api/products/:id/bom            - ดู BOM ของสินค้า
POST   /api/products/:id/bom            - เพิ่มวัตถุดิบใน BOM
PUT    /api/products/:id/bom/:bomId     - แก้ไข BOM
DELETE /api/products/:id/bom/:bomId     - ลบวัตถุดิบออกจาก BOM
GET    /api/products/:id/bom/calculate  - คำนวณวัตถุดิบที่ต้องใช้
```

### Production Orders

```
GET    /api/production-orders           - ดูรายการคำสั่งผลิต
GET    /api/production-orders/:id       - ดูรายละเอียดคำสั่งผลิต
POST   /api/production-orders           - สร้างคำสั่งผลิตใหม่
PUT    /api/production-orders/:id       - แก้ไขคำสั่งผลิต
DELETE /api/production-orders/:id       - ยกเลิกคำสั่งผลิต
```

### Material Requirements & Issuing

```
GET    /api/production-orders/:id/requirements           - ดูความต้องการวัตถุดิบ
GET    /api/production-orders/:id/requirements/by-type/:type  - กรองตามประเภท (PC, OF)
POST   /api/production-orders/:id/issue-materials        - จ่ายวัตถุดิบ (สร้าง material_issuing)
GET    /api/production-orders/:id/issued-materials       - ดูประวัติการจ่ายจริง
GET    /api/production-orders/:id/material-summary       - สรุปการใช้วัตถุดิบ
```

---

## 💡 ตัวอย่างการใช้งาน

### สถานการณ์: สั่งผลิต PROD-A001 จำนวน 100 ชิ้น

#### ขั้นตอนที่ 1: สร้างคำสั่งผลิต

```json
POST /api/production-orders
{
  "productCode": "PROD-A001",
  "quantity": 100,
  "plannedDate": "2024-01-15",
  "notes": "คำสั่งผลิตเดือนมกราคม"
}
```

#### ขั้นตอนที่ 2: ระบบคำนวณวัตถุดิบอัตโนมัติ

Response (สร้าง production_material_requirements):
```json
{
  "orderId": 1,
  "orderNo": "PO-2024-001",
  "product": {
    "code": "PROD-A001",
    "name": "สินค้า A รุ่น 001"
  },
  "quantity": 100,
  "materialRequirements": [
    {
      "requirementId": 1,
      "materialCode": "MAT-001",
      "materialType": "PC",
      "quantityPerUnit": 2,
      "requiredQuantity": 200,
      "issuedQuantity": 0,
      "unit": "ชิ้น",
      "currentStock": 500,
      "status": "PENDING"
    },
    {
      "requirementId": 2,
      "materialCode": "MAT-002",
      "materialType": "OF",
      "quantityPerUnit": 1,
      "requiredQuantity": 100,
      "issuedQuantity": 0,
      "unit": "ชิ้น",
      "currentStock": 300,
      "status": "PENDING"
    },
    {
      "requirementId": 3,
      "materialCode": "MAT-003",
      "materialType": "PC",
      "quantityPerUnit": 1,
      "requiredQuantity": 100,
      "issuedQuantity": 0,
      "unit": "ชิ้น",
      "currentStock": 250,
      "status": "PENDING"
    }
  ]
}
```

#### ขั้นตอนที่ 3: ดูความต้องการวัตถุดิบประเภท PC

```json
GET /api/production-orders/1/requirements/by-type/PC

Response:
{
  "orderNo": "PO-2024-001",
  "materialType": "PC",
  "items": [
    {
      "requirementId": 1,
      "materialId": 1,
      "materialCode": "MAT-001",
      "requiredQuantity": 200,
      "issuedQuantity": 0,
      "remainingQuantity": 200,
      "unit": "ชิ้น",
      "currentStock": 500,
      "status": "PENDING"
    },
    {
      "requirementId": 3,
      "materialId": 3,
      "materialCode": "MAT-003",
      "requiredQuantity": 100,
      "issuedQuantity": 0,
      "remainingQuantity": 100,
      "unit": "ชิ้น",
      "currentStock": 250,
      "status": "PENDING"
    }
  ],
  "totalRequired": 300,
  "totalIssued": 0
}
```

#### ขั้นตอนที่ 4: ทำการจ่ายวัตถุดิบ (สร้าง material_issuing)

```json
POST /api/production-orders/1/issue-materials
{
  "issuingDate": "2024-01-15T10:00:00Z",
  "issuingType": "PRODUCTION_ORDER",
  "items": [
    {
      "materialCode": "MAT-001",
      "quantity": 200,
      "lots": [  // ถ้าจ่ายแบบ lot
        {"qrCode": "LOT-001", "quantity": 100},
        {"qrCode": "LOT-002", "quantity": 100}
      ]
    },
    {
      "materialCode": "MAT-003",
      "quantity": 100,
      "lots": [
        {"qrCode": "LOT-003", "quantity": 100}
      ]
    }
  ],
  "requester": "admin",
  "remark": "จ่ายวัตถุดิบประเภท PC สำหรับคำสั่งผลิต PO-2024-001"
}

Response:
{
  "success": true,
  "issuings": [
    {
      "issuingNo": "ISS-2024-001",
      "materialCode": "MAT-001",
      "quantity": 200,
      "status": "COMPLETED"
    },
    {
      "issuingNo": "ISS-2024-002",
      "materialCode": "MAT-003",
      "quantity": 100,
      "status": "COMPLETED"
    }
  ]
}
```

---

## ⚠️ ข้อควรระวัง

1. **ตรวจสอบสต็อก**: ก่อนจ่ายวัตถุดิบต้องตรวจสอบว่ามีสต็อกเพียงพอ
2. **Transaction**: การจ่ายวัตถุดิบต้องใช้ Database Transaction เพื่อความถูกต้อง
3. **Audit Trail**: บันทึกประวัติการเปลี่ยนแปลงทุกครั้ง
4. **Validation**: ตรวจสอบข้อมูลก่อนบันทึก (จำนวนต้องมากกว่า 0, สินค้าต้องมี BOM)
5. **Cascade Delete**: ระวังการลบข้อมูลที่มีความสัมพันธ์

---

## 🎯 ขั้นตอนการพัฒนา

### Phase 1: สร้าง Entity และ Database
- [ ] สร้าง Product Entity
- [ ] สร้าง ProductBom Entity
- [ ] สร้าง ProductionOrder Entity
- [ ] สร้าง ProductionMaterialRequirement Entity
- [ ] แก้ไข MaterialIssuing Entity (เพิ่ม production_order_id, required_quantity)
- [ ] เพิ่ม IssuingType.PRODUCTION_ORDER
- [ ] สร้าง Migration Files
- [ ] Run Migration

### Phase 2: สร้าง Service และ Controller
- [ ] Products Module (CRUD)
- [ ] Product BOM Module
- [ ] Production Orders Module
- [ ] Production Material Requirements Module
- [ ] ปรับปรุง Material Issuing Module (รองรับ production_order_id)

### Phase 3: Business Logic
- [ ] คำนวณวัตถุดิบจาก BOM → สร้าง production_material_requirements
- [ ] ตรวจสอบสต็อกก่อนจ่าย
- [ ] จ่ายวัตถุดิบ → สร้าง material_issuing + อัพเดท requirements
- [ ] อัพเดทสต็อกเมื่อจ่ายวัตถุดิบ
- [ ] สรุปรายงานการใช้วัตถุดิบ

### Phase 4: Integration
- [ ] ใช้ระบบ Material Issuing เดิม (เพิ่มฟิลด์)
- [ ] สร้าง API สำหรับ Frontend
- [ ] ทดสอบ End-to-End
- [ ] Migration ข้อมูลเก่า (ถ้ามี)

---

## 📝 หมายเหตุ

- ระบบนี้ออกแบบให้ยืดหยุ่น สามารถเพิ่มฟีเจอร์ได้ในอนาคต เช่น:
  - BOM แบบหลายระดับ (Multi-level BOM)
  - Alternative Materials (วัตถุดิบทดแทน)
  - Scrap/Waste Tracking (ติดตามของเสีย)
  - Production Routing (ขั้นตอนการผลิต)
  
- สามารถปรับแต่งตามความต้องการเฉพาะของธุรกิจได้
