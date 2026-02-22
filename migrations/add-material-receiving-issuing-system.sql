-- ============================================
-- Material Receiving & Issuing System Migration (Compatible)
-- Version: 1.1
-- Date: 2024
-- ============================================

-- ============================================
-- 1. Create Material Lots Table
-- ============================================
CREATE TABLE IF NOT EXISTS material_lots (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL,
    lot_number VARCHAR(100) UNIQUE NOT NULL,
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    original_quantity DECIMAL(15,3) NOT NULL,
    current_quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    location_id INTEGER,
    location_name VARCHAR(255),
    received_date TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    create_by VARCHAR(255),
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(255),
    CONSTRAINT fk_material_lot_material FOREIGN KEY (material_id) 
        REFERENCES materials(id) ON DELETE RESTRICT,
    CONSTRAINT chk_lot_quantity CHECK (current_quantity >= 0),
    CONSTRAINT chk_lot_status CHECK (status IN ('ACTIVE', 'DEPLETED', 'EXPIRED'))
);

-- ============================================
-- 2. Create Material Receiving Table
-- ============================================
CREATE TABLE IF NOT EXISTS material_receiving (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL,
    lot_id INTEGER NOT NULL,
    quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    supplier_id INTEGER,
    supplier_name VARCHAR(255),
    received_date TIMESTAMP NOT NULL,
    location_id INTEGER,
    location_name VARCHAR(255),
    remarks TEXT,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    create_by VARCHAR(255),
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(255),
    CONSTRAINT fk_receiving_material FOREIGN KEY (material_id) 
        REFERENCES materials(id) ON DELETE RESTRICT,
    CONSTRAINT fk_receiving_lot FOREIGN KEY (lot_id) 
        REFERENCES material_lots(id) ON DELETE RESTRICT,
    CONSTRAINT chk_receiving_quantity CHECK (quantity > 0)
);

-- ============================================
-- 3. Create Issuing Types Table (Master Data)
-- ============================================
CREATE TABLE IF NOT EXISTS issuing_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    create_by VARCHAR(255),
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(255)
);

-- ============================================
-- 4. Alter Material Issuing Table (if exists)
-- ============================================
DO $$ 
BEGIN
    -- Add lot_id column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'material_issuing' AND column_name = 'lot_id'
    ) THEN
        ALTER TABLE material_issuing ADD COLUMN lot_id INTEGER;
    END IF;

    -- Add issuing_type_id column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'material_issuing' AND column_name = 'issuing_type_id'
    ) THEN
        ALTER TABLE material_issuing ADD COLUMN issuing_type_id INTEGER;
    END IF;

    -- Add document_type column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'material_issuing' AND column_name = 'document_type'
    ) THEN
        ALTER TABLE material_issuing ADD COLUMN document_type VARCHAR(50);
    END IF;

    -- Add document_number column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'material_issuing' AND column_name = 'document_number'
    ) THEN
        ALTER TABLE material_issuing ADD COLUMN document_number VARCHAR(100);
    END IF;

    -- Add work_order_id column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'material_issuing' AND column_name = 'work_order_id'
    ) THEN
        ALTER TABLE material_issuing ADD COLUMN work_order_id INTEGER;
    END IF;
END $$;

-- ============================================
-- 5. Add Foreign Keys to Material Issuing (if table exists)
-- ============================================
DO $$ 
BEGIN
    -- Add foreign key to material_lots if not exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'material_issuing') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_issuing_lot'
        ) THEN
            ALTER TABLE material_issuing 
            ADD CONSTRAINT fk_issuing_lot FOREIGN KEY (lot_id) 
                REFERENCES material_lots(id) ON DELETE RESTRICT;
        END IF;

        -- Add foreign key to issuing_types if not exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_issuing_type'
        ) THEN
            ALTER TABLE material_issuing 
            ADD CONSTRAINT fk_issuing_type FOREIGN KEY (issuing_type_id) 
                REFERENCES issuing_types(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- ============================================
-- 6. Create Material Issuing Documents Table
-- ============================================
CREATE TABLE IF NOT EXISTS material_issuing_documents (
    id SERIAL PRIMARY KEY,
    issuing_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    create_by VARCHAR(255),
    CONSTRAINT fk_issuing_document FOREIGN KEY (issuing_id) 
        REFERENCES material_issuing(id) ON DELETE CASCADE
);

-- ============================================
-- 7. Create Indexes for Performance
-- ============================================

-- Material Lots Indexes
CREATE INDEX IF NOT EXISTS idx_material_lots_material_id ON material_lots(material_id);
CREATE INDEX IF NOT EXISTS idx_material_lots_qr_code ON material_lots(qr_code);
CREATE INDEX IF NOT EXISTS idx_material_lots_lot_number ON material_lots(lot_number);
CREATE INDEX IF NOT EXISTS idx_material_lots_status ON material_lots(status);
CREATE INDEX IF NOT EXISTS idx_material_lots_location_id ON material_lots(location_id);
CREATE INDEX IF NOT EXISTS idx_material_lots_expiry_date ON material_lots(expiry_date);

-- Material Receiving Indexes
CREATE INDEX IF NOT EXISTS idx_receiving_material_id ON material_receiving(material_id);
CREATE INDEX IF NOT EXISTS idx_receiving_lot_id ON material_receiving(lot_id);
CREATE INDEX IF NOT EXISTS idx_receiving_supplier_id ON material_receiving(supplier_id);
CREATE INDEX IF NOT EXISTS idx_receiving_received_date ON material_receiving(received_date);
CREATE INDEX IF NOT EXISTS idx_receiving_status ON material_receiving(status);

-- Material Issuing Indexes
CREATE INDEX IF NOT EXISTS idx_issuing_lot_id ON material_issuing(lot_id);
CREATE INDEX IF NOT EXISTS idx_issuing_type_id ON material_issuing(issuing_type_id);
CREATE INDEX IF NOT EXISTS idx_issuing_document_number ON material_issuing(document_number);

-- Issuing Types Indexes
CREATE INDEX IF NOT EXISTS idx_issuing_types_code ON issuing_types(code);
CREATE INDEX IF NOT EXISTS idx_issuing_types_active ON issuing_types(active);

-- Issuing Documents Indexes
CREATE INDEX IF NOT EXISTS idx_issuing_documents_issuing_id ON material_issuing_documents(issuing_id);

-- ============================================
-- 8. Insert Default Issuing Types
-- ============================================
INSERT INTO issuing_types (code, name, description, active, create_by) VALUES
('WORK_ORDER', 'ใบสั่งผลิต', 'เบิกวัสดุสำหรับการผลิต', true, 'system'),
('MAINTENANCE', 'ซ่อมบำรุง', 'เบิกวัสดุสำหรับการซ่อมบำรุง', true, 'system'),
('GENERAL', 'ทั่วไป', 'เบิกวัสดุทั่วไป', true, 'system'),
('BACKORDER', 'Back Order', 'การจ่ายออกสำหรับ Back Order', true, 'system'),
('NORMAL', 'Normal', 'การจ่ายออกปกติ', true, 'system'),
('OTHER', 'Other', 'การจ่ายออกอื่นๆ', true, 'system')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 9. Add Comments
-- ============================================
COMMENT ON TABLE material_lots IS 'เก็บข้อมูล Lot และ QR Code ของวัสดุ';
COMMENT ON TABLE material_receiving IS 'บันทึกการรับวัสดุเข้าคลัง';
COMMENT ON TABLE issuing_types IS 'Master data สำหรับประเภทการเบิกวัสดุ';
COMMENT ON TABLE material_issuing_documents IS 'เก็บเอกสารแนบของการเบิกวัสดุ';

-- ============================================
-- 10. Create Views for Reporting
-- ============================================

-- View: Material Lot Summary
CREATE OR REPLACE VIEW v_material_lot_summary AS
SELECT 
    ml.id,
    ml.qr_code,
    ml.lot_number,
    m.id as material_id,
    m.name as material_name,
    m.code as material_code,
    ml.current_quantity,
    ml.original_quantity,
    ml.unit,
    ml.location_name,
    ml.received_date,
    ml.expiry_date,
    ml.status,
    CASE 
        WHEN ml.expiry_date < CURRENT_TIMESTAMP THEN 'EXPIRED'
        WHEN ml.current_quantity = 0 THEN 'DEPLETED'
        ELSE ml.status
    END as computed_status
FROM material_lots ml
JOIN materials m ON ml.material_id = m.id;

-- View: Receiving Transactions
CREATE OR REPLACE VIEW v_receiving_transactions AS
SELECT 
    mr.id,
    mr.received_date,
    m.name as material_name,
    m.code as material_code,
    mr.quantity,
    mr.unit,
    ml.lot_number,
    ml.qr_code,
    mr.supplier_name,
    mr.location_name,
    mr.remarks,
    mr.status,
    mr.create_by,
    mr.create_date
FROM material_receiving mr
JOIN materials m ON mr.material_id = m.id
JOIN material_lots ml ON mr.lot_id = ml.id;

-- View: Issuing Transactions
CREATE OR REPLACE VIEW v_issuing_transactions AS
SELECT 
    mi.id,
    mi.issued_date,
    m.name as material_name,
    m.code as material_code,
    mi.quantity,
    mi.unit,
    ml.lot_number,
    ml.qr_code,
    mi.department,
    it.name as issuing_type_name,
    mi.document_type,
    mi.document_number,
    mi.remarks,
    mi.status,
    mi.create_by,
    mi.create_date
FROM material_issuing mi
JOIN materials m ON mi.material_id = m.id
LEFT JOIN material_lots ml ON mi.lot_id = ml.id
LEFT JOIN issuing_types it ON mi.issuing_type_id = it.id;

-- ============================================
-- 11. Create Functions
-- ============================================

-- Function: Update Lot Quantity After Issuing
CREATE OR REPLACE FUNCTION update_lot_quantity_after_issuing()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lot_id IS NOT NULL THEN
        UPDATE material_lots
        SET 
            current_quantity = current_quantity - NEW.quantity,
            status = CASE 
                WHEN current_quantity - NEW.quantity <= 0 THEN 'DEPLETED'
                ELSE status
            END,
            update_date = CURRENT_TIMESTAMP
        WHERE id = NEW.lot_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update Lot Quantity After Receiving
CREATE OR REPLACE FUNCTION update_lot_quantity_after_receiving()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE material_lots
    SET 
        current_quantity = current_quantity + NEW.quantity,
        status = 'ACTIVE',
        update_date = CURRENT_TIMESTAMP
    WHERE id = NEW.lot_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. Create Triggers
-- ============================================

-- Trigger: After Insert Issuing
DROP TRIGGER IF EXISTS trg_after_insert_issuing ON material_issuing;
CREATE TRIGGER trg_after_insert_issuing
    AFTER INSERT ON material_issuing
    FOR EACH ROW
    EXECUTE FUNCTION update_lot_quantity_after_issuing();

-- Trigger: After Insert Receiving
DROP TRIGGER IF EXISTS trg_after_insert_receiving ON material_receiving;
CREATE TRIGGER trg_after_insert_receiving
    AFTER INSERT ON material_receiving
    FOR EACH ROW
    EXECUTE FUNCTION update_lot_quantity_after_receiving();

-- ============================================
-- Migration Complete
-- ============================================
