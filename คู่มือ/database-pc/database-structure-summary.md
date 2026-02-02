# สรุปโครงสร้างฐานข้อมูล CPS_CCI และการออกแบบ Product-BOM

## 📊 ตารางที่มีอยู่แล้วในระบบ

### 1. Materials Module
```
materials_type (ประเภทวัตถุดิบ)
  ├── materials (วัตถุดิบ)
  │     ├── items_name (ชื่อวัตถุดิบ)
  │     ├── materials_stock (สต็อก)
  │     └── materials_location (ตำแหน่งจัดเก็บ)
  └── supplier (ผู้จัดจำหน่าย)
```

### 2. Auth Module
```
users (ผู้ใช้)
  └── user_roles
        └── roles (บทบาท)
              └── role_permissions
                    └── permissions (สิทธิ์)
```

### 3. Logging Module
```
api_logs (บันทึก API)
auth_logs (บันทึกการเข้าสู่ระบบ)
```

---

## 🆕 ตารางใหม่ที่ต้องสร้างสำหรับ Product-BOM

### 1. products (สินค้า)
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  product_code VARCHAR(50) UNIQUE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  unit VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  create_by VARCHAR(255),
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_by VARCHAR(255)
);

CREATE INDEX idx_products_code ON products(product_code);
CREATE INDEX idx_products_active ON products(is_active);
```

### 2. product_bom (สูตรการผลิต)
```sql
CREATE TABLE product_bom (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  quantity_per_unit DECIMAL(15,4) NOT NULL,
  unit VARCHAR(50),
  sequence_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  create_by VARCHAR(255),
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_by VARCHAR(255),
  
  CONSTRAINT fk_bom_product FOREIGN KEY (product_id) 
    REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_bom_material FOREIGN KEY (material_id) 
    REFERENCES materials(id) ON DELETE RESTRICT,
  CONSTRAINT uq_product_material UNIQUE (product_id, material_id)
);

CREATE INDEX idx_bom_product ON product_bom(product_id);
CREATE INDEX idx_bom_material ON product_bom(material_id);
```

### 3. production_orders (คำสั่งผลิต)
```sql
CREATE TABLE production_orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER NOT NULL,
  quantity DECIMAL(15,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  planned_date DATE,
  completed_date DATE,
  notes TEXT,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  create_by VARCHAR(255),
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_by VARCHAR(255),
  
  CONSTRAINT fk_production_product FOREIGN KEY (product_id) 
    REFERENCES products(id)
);

CREATE INDEX idx_production_orders_no ON production_orders(order_no);
CREATE INDEX idx_production_orders_status ON production_orders(status);
CREATE INDEX idx_production_orders_date ON production_orders(planned_date);
```

### 4. production_material_requirements (ความต้องการวัตถุดิบ)
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
  
  CONSTRAINT fk_req_production FOREIGN KEY (production_order_id) 
    REFERENCES production_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_req_material FOREIGN KEY (material_id) 
    REFERENCES materials(id),
  CONSTRAINT uq_production_material UNIQUE (production_order_id, material_id)
);

CREATE INDEX idx_requirements_order ON production_material_requirements(production_order_id);
CREATE INDEX idx_requirements_material ON production_material_requirements(material_id);
CREATE INDEX idx_requirements_status ON production_material_requirements(status);
```

### 5. material_issuing (ปรับปรุงตารางเดิม)
```sql
-- เพิ่มฟิลด์ใหม่ในตาราง material_issuing ที่มีอยู่
ALTER TABLE material_issuing 
ADD COLUMN production_order_id INTEGER,
ADD COLUMN required_quantity DECIMAL(15,4);

ALTER TABLE material_issuing
ADD CONSTRAINT fk_issuing_production 
  FOREIGN KEY (production_order_id) 
  REFERENCES production_orders(id) 
  ON DELETE SET NULL;

CREATE INDEX idx_material_issuing_production 
  ON material_issuing(production_order_id);
```

---

## 🔗 ความสัมพันธ์ของตาราง

```
products (1) ──→ (N) product_bom (N) ──→ (1) materials
    │
    │
    ↓
production_orders (1) ──→ (N) production_material_requirements (N) ──→ (1) materials
    │
    │
    ↓
material_issuing (N) ──→ (1) materials
```

### สรุปความสัมพันธ์:
1. **products → product_bom → materials**: สินค้า 1 ชิ้นใช้วัตถุดิบหลายชนิด
2. **production_orders → products**: คำสั่งผลิต 1 รายการผลิตสินค้า 1 ชนิด
3. **production_orders → production_material_requirements**: คำสั่งผลิต 1 รายการต้องการวัตถุดิบหลายชนิด
4. **production_orders → material_issuing**: คำสั่งผลิต 1 รายการมีการจ่ายวัตถุดิบหลายครั้ง

---

## 📋 ตัวอย่าง Flow การทำงาน

### สร้างสินค้าและ BOM
```sql
-- 1. สร้างสินค้า
INSERT INTO products (product_code, product_name, unit, create_by)
VALUES ('PROD-A001', 'สินค้า A รุ่น 001', 'ชิ้น', 'admin');

-- 2. กำหนด BOM (สมมติ materials มี id 1,2,3)
INSERT INTO product_bom (product_id, material_id, quantity_per_unit, unit, sequence_order)
VALUES 
  (1, 1, 2.0000, 'ชิ้น', 1),  -- MAT-001 ใช้ 2 ชิ้น
  (1, 2, 1.0000, 'ชิ้น', 2),  -- MAT-002 ใช้ 1 ชิ้น
  (1, 3, 1.0000, 'ชิ้น', 3);  -- MAT-003 ใช้ 1 ชิ้น
```

### สร้างคำสั่งผลิต
```sql
-- 3. สร้างคำสั่งผลิต 100 ชิ้น
INSERT INTO production_orders (order_no, product_id, quantity, status, planned_date, create_by)
VALUES ('PO-2024-001', 1, 100, 'PENDING', '2024-01-15', 'admin');

-- 4. คำนวณความต้องการวัตถุดิบอัตโนมัติ
INSERT INTO production_material_requirements 
  (production_order_id, material_id, required_quantity, unit, status)
SELECT 
  1,
  pb.material_id,
  pb.quantity_per_unit * 100,
  pb.unit,
  'PENDING'
FROM product_bom pb
WHERE pb.product_id = 1 AND pb.is_active = true;

-- ผลลัพธ์:
-- MAT-001: 200 ชิ้น
-- MAT-002: 100 ชิ้น
-- MAT-003: 100 ชิ้น
```

### จ่ายวัตถุดิบ
```sql
-- 5. จ่ายวัตถุดิบประเภท PC (MAT-001, MAT-003)
INSERT INTO material_issuing (
  issuing_no, issuing_date, issuing_type,
  material_id, total_quantity, unit,
  production_order_id, required_quantity,
  work_order_no, part_no, requester, status
)
VALUES 
  ('ISS-2024-001', NOW(), 'PRODUCTION_ORDER',
   1, 200, 'ชิ้น', 1, 200, 'PO-2024-001', 'PROD-A001', 'admin', 'COMPLETED'),
  ('ISS-2024-002', NOW(), 'PRODUCTION_ORDER',
   3, 100, 'ชิ้น', 1, 100, 'PO-2024-001', 'PROD-A001', 'admin', 'COMPLETED');

-- 6. อัพเดทความต้องการ
UPDATE production_material_requirements
SET issued_quantity = required_quantity,
    status = 'COMPLETED'
WHERE production_order_id = 1 AND material_id IN (1, 3);
```

---

## 🔍 Query สำคัญ

### ดู BOM ของสินค้า
```sql
SELECT 
  p.product_code,
  p.product_name,
  m.mat_code,
  mt.name as material_type,
  pb.quantity_per_unit,
  pb.unit
FROM products p
JOIN product_bom pb ON p.id = pb.product_id
JOIN materials m ON pb.material_id = m.id
JOIN materials_type mt ON m.mat_type_id = mt.id
WHERE p.product_code = 'PROD-A001'
ORDER BY pb.sequence_order;
```

### ดูความต้องการวัตถุดิบตามประเภท
```sql
SELECT 
  po.order_no,
  mt.code as material_type,
  m.mat_code,
  pmr.required_quantity,
  pmr.issued_quantity,
  pmr.required_quantity - pmr.issued_quantity as remaining,
  pmr.status
FROM production_material_requirements pmr
JOIN production_orders po ON pmr.production_order_id = po.id
JOIN materials m ON pmr.material_id = m.id
JOIN materials_type mt ON m.mat_type_id = mt.id
WHERE po.order_no = 'PO-2024-001'
  AND mt.code = 'PC'
ORDER BY m.mat_code;
```

### ดูประวัติการจ่ายวัตถุดิบ
```sql
SELECT 
  mi.issuing_no,
  mi.issuing_date,
  po.order_no,
  p.product_code,
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
ORDER BY mi.issuing_date;
```

---

## 📁 โครงสร้าง Module ที่ต้องสร้าง

```
src/
├── products/
│   ├── entities/
│   │   ├── product.entity.ts
│   │   └── product-bom.entity.ts
│   ├── dto/
│   │   ├── create-product.dto.ts
│   │   ├── update-product.dto.ts
│   │   ├── create-bom.dto.ts
│   │   └── update-bom.dto.ts
│   ├── products.controller.ts
│   ├── products.service.ts
│   └── products.module.ts
│
└── production/
    ├── entities/
    │   ├── production-order.entity.ts
    │   └── production-material-requirement.entity.ts
    ├── dto/
    │   ├── create-production-order.dto.ts
    │   ├── update-production-order.dto.ts
    │   └── issue-materials.dto.ts
    ├── production.controller.ts
    ├── production.service.ts
    └── production.module.ts
```

---

## ✅ สรุป

### ตารางใหม่ที่ต้องสร้าง: 4 ตาราง
1. `products` - สินค้า
2. `product_bom` - สูตรการผลิต
3. `production_orders` - คำสั่งผลิต
4. `production_material_requirements` - ความต้องการวัตถุดิบ

### ตารางเดิมที่ต้องปรับปรุง: 1 ตาราง
1. `material_issuing` - เพิ่ม production_order_id, required_quantity

### ข้อดี
- ใช้ระบบ material_issuing ที่มีอยู่
- รองรับ lot tracking ผ่าน material_issuing_lots
- แยกความต้องการ (requirements) กับการจ่ายจริง (issuing) ชัดเจน
- ติดตามสถานะได้ทุกขั้นตอน
