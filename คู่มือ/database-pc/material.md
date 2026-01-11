DATABASE EXPORT (Schema + Relation + Index)
1️⃣ materials_type
CREATE TABLE materials_type (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  create_date TIMESTAMP,
  create_by VARCHAR(255),
  update_date TIMESTAMP,
  update_by VARCHAR(255)
);

CREATE UNIQUE INDEX uq_materials_type_code
  ON materials_type(code);

2️⃣ materials_location
CREATE TABLE materials_location (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  create_date TIMESTAMP,
  create_by VARCHAR(255),
  update_date TIMESTAMP,
  update_by VARCHAR(255)
);

CREATE UNIQUE INDEX uq_materials_location_code
  ON materials_location(code);

3️⃣ materials
CREATE TABLE materials (
  id SERIAL PRIMARY KEY,
  mat_code VARCHAR(50) NOT NULL,
  mat_type_id INT NOT NULL,
  default_location_id INT NOT NULL,
  lr VARCHAR(2),
  lot_size INT,
  unit VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  create_date TIMESTAMP,
  create_by VARCHAR(255),
  update_date TIMESTAMP,
  update_by VARCHAR(255)
);

CREATE UNIQUE INDEX uq_materials_mat_code
  ON materials(mat_code);

CREATE INDEX idx_materials_type
  ON materials(mat_type_id);

CREATE INDEX idx_materials_location
  ON materials(default_location_id);

4️⃣ items_name
CREATE TABLE items_name (
  id SERIAL PRIMARY KEY,
  material_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  create_date TIMESTAMP,
  update_date TIMESTAMP,
  create_by VARCHAR(255),
  update_by VARCHAR(255)
);

CREATE INDEX idx_items_material
  ON items_name(material_id);

5️⃣ materials_stock
CREATE TABLE materials_stock (
  material_id INT PRIMARY KEY,
  total_qty INT DEFAULT 0,
  available_qty INT DEFAULT 0,
  reserved_qty INT DEFAULT 0,
  update_date TIMESTAMP
);

6️⃣ Foreign Keys (Relations)

แยกออกมาเพื่อความชัดเจนตอน import

ALTER TABLE materials
ADD CONSTRAINT fk_materials_type
FOREIGN KEY (mat_type_id)
REFERENCES materials_type(id);

ALTER TABLE materials
ADD CONSTRAINT fk_materials_location
FOREIGN KEY (default_location_id)
REFERENCES materials_location(id);

ALTER TABLE items_name
ADD CONSTRAINT fk_items_material
FOREIGN KEY (material_id)
REFERENCES materials(id);

ALTER TABLE materials_stock
ADD CONSTRAINT fk_materials_stock_material
FOREIGN KEY (material_id)
REFERENCES materials(id)
ON DELETE CASCADE;

📌 ลำดับ Import (แนะนำ)
1. materials_type
2. materials_location
3. materials
4. items_name
5. materials_stock
6. foreign keys


📌 DATABASE INDEX (PostgreSQL)
1️⃣ Unique Index (Business Key)
-- materials_type
CREATE UNIQUE INDEX uq_materials_type_code
ON materials_type (code);

-- materials_location
CREATE UNIQUE INDEX uq_materials_location_code
ON materials_location (code);

-- materials
CREATE UNIQUE INDEX uq_materials_mat_code
ON materials (mat_code);

2️⃣ Foreign Key Index (สำคัญมาก)

PostgreSQL ไม่สร้าง index ให้ FK อัตโนมัติ

-- materials → materials_type
CREATE INDEX idx_materials_mat_type
ON materials (mat_type_id);

-- materials → materials_location
CREATE INDEX idx_materials_default_location
ON materials (default_location_id);

-- items_name → materials
CREATE INDEX idx_items_name_material
ON items_name (material_id);

-- materials_stock → materials
-- (PK อยู่แล้ว ไม่ต้องสร้างเพิ่ม)

3️⃣ Index สำหรับ Query ใช้งานบ่อย
-- ค้นหาวัสดุที่ active
CREATE INDEX idx_materials_active
ON materials (is_active);

-- ค้นหาชื่อวัสดุ
CREATE INDEX idx_items_name_name
ON items_name (name);

4️⃣ Composite Index (ถ้า join + filter บ่อย)
-- ใช้กรณี join + filter พร้อมกัน
CREATE INDEX idx_materials_type_location
ON materials (mat_type_id, default_location_id);

5️⃣ ตรวจสอบ Index ที่มีอยู่
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;