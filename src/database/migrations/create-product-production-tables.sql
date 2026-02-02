-- ===================================
-- Migration: Create Product and Production Tables
-- Date: 2024-01-15
-- ===================================

-- 1. สร้างตาราง products
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

COMMENT ON TABLE products IS 'ตารางเก็บข้อมูลสินค้า';
COMMENT ON COLUMN products.product_code IS 'รหัสสินค้า เช่น PROD-A001';
COMMENT ON COLUMN products.product_name IS 'ชื่อสินค้า';

-- 2. สร้างตาราง product_bom
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

COMMENT ON TABLE product_bom IS 'ตารางเก็บสูตรการผลิต (Bill of Materials)';
COMMENT ON COLUMN product_bom.quantity_per_unit IS 'จำนวนวัตถุดิบที่ใช้ต่อ 1 หน่วยสินค้า';

-- 3. สร้างตาราง production_orders
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
    REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX idx_production_orders_no ON production_orders(order_no);
CREATE INDEX idx_production_orders_status ON production_orders(status);
CREATE INDEX idx_production_orders_date ON production_orders(planned_date);
CREATE INDEX idx_production_orders_product ON production_orders(product_id);

COMMENT ON TABLE production_orders IS 'ตารางเก็บคำสั่งผลิต';
COMMENT ON COLUMN production_orders.status IS 'PENDING, IN_PROGRESS, COMPLETED, CANCELLED';

-- 4. สร้างตาราง production_material_requirements
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
    REFERENCES materials(id) ON DELETE RESTRICT,
  CONSTRAINT uq_production_material UNIQUE (production_order_id, material_id)
);

CREATE INDEX idx_requirements_order ON production_material_requirements(production_order_id);
CREATE INDEX idx_requirements_material ON production_material_requirements(material_id);
CREATE INDEX idx_requirements_status ON production_material_requirements(status);

COMMENT ON TABLE production_material_requirements IS 'ตารางเก็บความต้องการวัตถุดิบสำหรับการผลิต';
COMMENT ON COLUMN production_material_requirements.required_quantity IS 'จำนวนที่ต้องใช้ (คำนวณจาก BOM)';
COMMENT ON COLUMN production_material_requirements.issued_quantity IS 'จำนวนที่จ่ายไปแล้ว';
COMMENT ON COLUMN production_material_requirements.status IS 'PENDING, PARTIAL, COMPLETED';

-- 5. ปรับปรุงตาราง material_issuing (เพิ่มฟิลด์)
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

COMMENT ON COLUMN material_issuing.production_order_id IS 'เชื่อมโยงกับคำสั่งผลิต';
COMMENT ON COLUMN material_issuing.required_quantity IS 'จำนวนที่ต้องใช้ตาม BOM';

-- ===================================
-- ข้อมูลตัวอย่าง (Optional)
-- ===================================

-- ตัวอย่างสินค้า
INSERT INTO products (product_code, product_name, description, unit, create_by)
VALUES 
  ('PROD-A001', 'สินค้า A รุ่น 001', 'สินค้าประกอบจากวัตถุดิบหลายชนิด', 'ชิ้น', 'system'),
  ('PROD-B001', 'สินค้า B รุ่น 001', 'สินค้าทดสอบ', 'ชิ้น', 'system');

-- ตัวอย่าง BOM (สมมติว่ามี materials id 1,2,3)
-- INSERT INTO product_bom (product_id, material_id, quantity_per_unit, unit, sequence_order, create_by)
-- VALUES 
--   (1, 1, 2.0000, 'ชิ้น', 1, 'system'),
--   (1, 2, 1.0000, 'ชิ้น', 2, 'system'),
--   (1, 3, 1.0000, 'ชิ้น', 3, 'system');

COMMIT;
