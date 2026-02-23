-- Migration: Add Production Planning System (PostgreSQL)
-- Description: สร้างตารางสำหรับระบบจัดงานล่วงหน้าและการจอง material

-- สร้าง enum type สำหรับ status
DO $$ BEGIN
  CREATE TYPE plan_status AS ENUM ('draft', 'reserved', 'confirmed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ตาราง production_plans
CREATE TABLE IF NOT EXISTS production_plans (
  id SERIAL PRIMARY KEY,
  plan_code VARCHAR(50) UNIQUE NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  plan_date DATE NOT NULL,
  status plan_status DEFAULT 'draft',
  remarks TEXT,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  create_by VARCHAR(255) NOT NULL,
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_plan_code ON production_plans(plan_code);
CREATE INDEX IF NOT EXISTS idx_status ON production_plans(status);
CREATE INDEX IF NOT EXISTS idx_plan_date ON production_plans(plan_date);

-- ตาราง production_plan_items
CREATE TABLE IF NOT EXISTS production_plan_items (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity DECIMAL(15,4) NOT NULL,
  unit VARCHAR(50),
  remarks TEXT,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES production_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_plan_id ON production_plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_product_id ON production_plan_items(product_id);

-- ตาราง material_reservations
CREATE TABLE IF NOT EXISTS material_reservations (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  reserved_quantity DECIMAL(15,4) NOT NULL,
  lot_number VARCHAR(50),
  receive_date DATE,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES production_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id)
);

CREATE INDEX IF NOT EXISTS idx_reservation_plan_id ON material_reservations(plan_id);
CREATE INDEX IF NOT EXISTS idx_reservation_material_id ON material_reservations(material_id);

-- เพิ่มคอลัมน์ reserved_qty ในตาราง materials_stock (ถ้ายังไม่มี)
DO $$ BEGIN
  ALTER TABLE materials_stock ADD COLUMN reserved_qty INTEGER DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;
