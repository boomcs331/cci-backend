-- Create issuing_types table (Master Data)
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

-- Create material_issuing_documents table
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

-- Add issuing_type_id column to material_issuing table
ALTER TABLE material_issuing 
ADD COLUMN IF NOT EXISTS issuing_type_id INTEGER;

-- Add foreign key constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_issuing_type'
    ) THEN
        ALTER TABLE material_issuing 
        ADD CONSTRAINT fk_issuing_type FOREIGN KEY (issuing_type_id) 
            REFERENCES issuing_types(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Modify issuing_type column to be nullable
DO $$ 
BEGIN
    ALTER TABLE material_issuing 
    ALTER COLUMN issuing_type DROP DEFAULT,
    ALTER COLUMN issuing_type DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Insert default issuing types
INSERT INTO issuing_types (code, name, description, active, create_by) VALUES
('BACKORDER', 'Back Order', 'การจ่ายออกสำหรับ Back Order', true, 'system'),
('NORMAL', 'Normal', 'การจ่ายออกปกติ', true, 'system'),
('OTHER', 'Other', 'การจ่ายออกอื่นๆ', true, 'system')
ON CONFLICT (code) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_issuing_documents_issuing_id ON material_issuing_documents(issuing_id);
CREATE INDEX IF NOT EXISTS idx_material_issuing_type_id ON material_issuing(issuing_type_id);
CREATE INDEX IF NOT EXISTS idx_issuing_types_code ON issuing_types(code);
CREATE INDEX IF NOT EXISTS idx_issuing_types_active ON issuing_types(active);

COMMENT ON TABLE issuing_types IS 'Master data สำหรับประเภทการจ่ายออกวัตถุดิบ';
COMMENT ON TABLE material_issuing_documents IS 'เก็บเอกสารแนบของการจ่ายออกวัตถุดิบ';
COMMENT ON COLUMN material_issuing.issuing_type_id IS 'อ้างอิงไปยัง issuing_types master data';
