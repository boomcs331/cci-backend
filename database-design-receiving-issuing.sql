-- ========================================
-- Material Receiving & Issuing System with QR Code & FIFO
-- ========================================

-- 1. ใบรับวัตถุดิบ (Receiving Document - Header)
CREATE TABLE material_receiving (
  id SERIAL PRIMARY KEY,
  receiving_no VARCHAR(50) UNIQUE NOT NULL,           -- เลขที่ใบรับ (RCV-2024-0001)
  receiving_date TIMESTAMP NOT NULL,                  -- วันที่รับ
  supplier_id INT REFERENCES supplier(id),            -- ผู้จัดจำหน่าย
  material_id INT REFERENCES materials(id),           -- วัตถุดิบที่รับ
  total_quantity DECIMAL(15,2) NOT NULL,              -- จำนวนรวมที่รับ
  unit VARCHAR(50),                                    -- หน่วย
  po_no VARCHAR(50),                                   -- เลขที่ PO (ถ้ามี)
  remark TEXT,                                         -- หมายเหตุ
  status VARCHAR(20) DEFAULT 'ACTIVE',                 -- ACTIVE, COMPLETED, CANCELLED
  create_date TIMESTAMP DEFAULT NOW(),
  create_by VARCHAR(255),
  update_date TIMESTAMP DEFAULT NOW(),
  update_by VARCHAR(255)
);

-- 2. รายการย่อยของใบรับ (Receiving Lots - แยกเป็น Lot ย่อย พร้อม QR Code)
CREATE TABLE material_receiving_lots (
  id SERIAL PRIMARY KEY,
  receiving_id INT REFERENCES material_receiving(id) ON DELETE CASCADE,
  lot_no VARCHAR(50) UNIQUE NOT NULL,                 -- เลข Lot (LOT-2024-0001)
  qr_code VARCHAR(100) UNIQUE NOT NULL,                -- QR Code (สร้างจาก lot_no + timestamp)
  material_id INT REFERENCES materials(id),           -- วัตถุดิบ
  quantity DECIMAL(15,2) NOT NULL,                    -- จำนวนใน Lot นี้
  remaining_quantity DECIMAL(15,2) NOT NULL,          -- จำนวนคงเหลือ
  unit VARCHAR(50),                                    -- หน่วย
  location_id INT REFERENCES materials_location(id),  -- ตำแหน่งจัดเก็บ
  expiry_date DATE,                                    -- วันหมดอายุ (ถ้ามี)
  status VARCHAR(20) DEFAULT 'AVAILABLE',              -- AVAILABLE, PARTIAL_USED, USED_UP, EXPIRED
  create_date TIMESTAMP DEFAULT NOW(),
  create_by VARCHAR(255)
);

-- 3. ใบจ่ายวัตถุดิบ (Issuing Document - Header)
CREATE TABLE material_issuing (
  id SERIAL PRIMARY KEY,
  issuing_no VARCHAR(50) UNIQUE NOT NULL,             -- เลขที่ใบจ่าย (ISS-2024-0001)
  issuing_date TIMESTAMP NOT NULL,                    -- วันที่จ่าย
  material_id INT REFERENCES materials(id),           -- วัตถุดิบที่จ่าย
  total_quantity DECIMAL(15,2) NOT NULL,              -- จำนวนรวมที่จ่าย
  unit VARCHAR(50),                                    -- หน่วย
  department VARCHAR(100),                             -- แผนกที่เบิก
  work_order_no VARCHAR(50),                           -- เลขที่ใบสั่งผลิต (ถ้ามี)
  remark TEXT,                                         -- หมายเหตุ
  status VARCHAR(20) DEFAULT 'COMPLETED',              -- COMPLETED, CANCELLED
  create_date TIMESTAMP DEFAULT NOW(),
  create_by VARCHAR(255),
  update_date TIMESTAMP DEFAULT NOW(),
  update_by VARCHAR(255)
);

-- 4. รายการจ่ายแยกตาม Lot (FIFO - จ่ายจาก Lot เก่าก่อน)
CREATE TABLE material_issuing_lots (
  id SERIAL PRIMARY KEY,
  issuing_id INT REFERENCES material_issuing(id) ON DELETE CASCADE,
  lot_id INT REFERENCES material_receiving_lots(id),  -- อ้างอิงถึง Lot ที่จ่าย
  qr_code VARCHAR(100) NOT NULL,                       -- QR Code ของ Lot
  quantity DECIMAL(15,2) NOT NULL,                    -- จำนวนที่จ่ายจาก Lot นี้
  unit VARCHAR(50),                                    -- หน่วย
  create_date TIMESTAMP DEFAULT NOW()
);

-- 5. Transaction Log (บันทึกการเคลื่อนไหวทั้งหมด)
CREATE TABLE material_transactions (
  id SERIAL PRIMARY KEY,
  transaction_no VARCHAR(50) UNIQUE NOT NULL,         -- เลขที่ Transaction
  transaction_type VARCHAR(20) NOT NULL,               -- RECEIVE, ISSUE, ADJUST, RETURN
  transaction_date TIMESTAMP NOT NULL,
  material_id INT REFERENCES materials(id),
  lot_id INT REFERENCES material_receiving_lots(id),  -- Lot ที่เกี่ยวข้อง
  qr_code VARCHAR(100),                                -- QR Code
  quantity DECIMAL(15,2) NOT NULL,                    -- จำนวน (+/-)
  remaining_quantity DECIMAL(15,2),                   -- คงเหลือหลัง Transaction
  reference_no VARCHAR(50),                            -- เลขที่เอกสารอ้างอิง
  remark TEXT,
  create_date TIMESTAMP DEFAULT NOW(),
  create_by VARCHAR(255)
);

-- ========================================
-- Indexes for Performance
-- ========================================
CREATE INDEX idx_receiving_lots_qr ON material_receiving_lots(qr_code);
CREATE INDEX idx_receiving_lots_status ON material_receiving_lots(status);
CREATE INDEX idx_receiving_lots_material ON material_receiving_lots(material_id);
CREATE INDEX idx_issuing_lots_qr ON material_issuing_lots(qr_code);
CREATE INDEX idx_transactions_qr ON material_transactions(qr_code);
CREATE INDEX idx_transactions_lot ON material_transactions(lot_id);
CREATE INDEX idx_receiving_lots_fifo ON material_receiving_lots(material_id, create_date, status);

-- ========================================
-- Sample Data Flow
-- ========================================

-- 1. รับวัตถุดิบเข้า 1,000 kg แล้วแยกเป็น 10 Lot (Lot ละ 100 kg)
INSERT INTO material_receiving (receiving_no, receiving_date, supplier_id, material_id, total_quantity, unit, create_by)
VALUES ('RCV-2024-0001', NOW(), 1, 1, 1000, 'KG', 'admin');

-- สร้าง Lot ย่อย 10 Lot พร้อม QR Code
INSERT INTO material_receiving_lots (receiving_id, lot_no, qr_code, material_id, quantity, remaining_quantity, unit, location_id, create_by)
VALUES 
  (1, 'LOT-2024-0001', 'QR-LOT-2024-0001-1234567890', 1, 100, 100, 'KG', 1, 'admin'),
  (1, 'LOT-2024-0002', 'QR-LOT-2024-0002-1234567891', 1, 100, 100, 'KG', 1, 'admin'),
  (1, 'LOT-2024-0003', 'QR-LOT-2024-0003-1234567892', 1, 100, 100, 'KG', 1, 'admin');
  -- ... ต่อไปอีก 7 Lot

-- 2. จ่ายวัตถุดิบออก 250 kg (ระบบจะหยิบจาก Lot เก่าสุดก่อน - FIFO)
-- จ่ายจาก LOT-2024-0001 = 100 kg (หมด)
-- จ่ายจาก LOT-2024-0002 = 100 kg (หมด)
-- จ่ายจาก LOT-2024-0003 = 50 kg (เหลือ 50 kg)

INSERT INTO material_issuing (issuing_no, issuing_date, material_id, total_quantity, unit, department, create_by)
VALUES ('ISS-2024-0001', NOW(), 1, 250, 'KG', 'Production', 'admin');

INSERT INTO material_issuing_lots (issuing_id, lot_id, qr_code, quantity, unit)
VALUES 
  (1, 1, 'QR-LOT-2024-0001-1234567890', 100, 'KG'),
  (1, 2, 'QR-LOT-2024-0002-1234567891', 100, 'KG'),
  (1, 3, 'QR-LOT-2024-0003-1234567892', 50, 'KG');

-- Update remaining quantity และ status
UPDATE material_receiving_lots SET remaining_quantity = 0, status = 'USED_UP' WHERE id IN (1, 2);
UPDATE material_receiving_lots SET remaining_quantity = 50, status = 'PARTIAL_USED' WHERE id = 3;

-- ========================================
-- Useful Queries
-- ========================================

-- ดูข้อมูล Lot จาก QR Code
SELECT 
  mrl.*,
  mr.receiving_no,
  mr.receiving_date,
  m.mat_code,
  i.name as material_name,
  ml.name as location_name
FROM material_receiving_lots mrl
JOIN material_receiving mr ON mrl.receiving_id = mr.id
JOIN materials m ON mrl.material_id = m.id
JOIN items_name i ON m.id = i.material_id
LEFT JOIN materials_location ml ON mrl.location_id = ml.id
WHERE mrl.qr_code = 'QR-LOT-2024-0001-1234567890';

-- ดู Lot ที่ยังใช้ได้ (FIFO Order)
SELECT * FROM material_receiving_lots
WHERE material_id = 1 
  AND status IN ('AVAILABLE', 'PARTIAL_USED')
  AND remaining_quantity > 0
ORDER BY create_date ASC, id ASC;

-- ดูประวัติการใช้งานของ QR Code
SELECT 
  mt.*,
  m.mat_code,
  i.name as material_name
FROM material_transactions mt
JOIN materials m ON mt.material_id = m.id
JOIN items_name i ON m.id = i.material_id
WHERE mt.qr_code = 'QR-LOT-2024-0001-1234567890'
ORDER BY mt.create_date DESC;

-- สรุปยอดคงเหลือแต่ละ Material
SELECT 
  m.id,
  m.mat_code,
  i.name as material_name,
  COUNT(mrl.id) as total_lots,
  SUM(mrl.remaining_quantity) as total_remaining,
  m.unit
FROM materials m
JOIN items_name i ON m.id = i.material_id
LEFT JOIN material_receiving_lots mrl ON m.id = mrl.material_id 
  AND mrl.status IN ('AVAILABLE', 'PARTIAL_USED')
GROUP BY m.id, m.mat_code, i.name, m.unit;
