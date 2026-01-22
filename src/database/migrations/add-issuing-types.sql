-- Migration: Add issuing types and additional fields to material_issuing table
-- Date: 2026-01-22

-- Add new columns to material_issuing table
ALTER TABLE material_issuing 
ADD COLUMN IF NOT EXISTS issuing_type VARCHAR(50) DEFAULT 'NORMAL_PRODUCTION',
ADD COLUMN IF NOT EXISTS machine_no VARCHAR(50),
ADD COLUMN IF NOT EXISTS part_no VARCHAR(50),
ADD COLUMN IF NOT EXISTS requester VARCHAR(100);

-- Add comment to issuing_type column
COMMENT ON COLUMN material_issuing.issuing_type IS 'Type of issuing: NORMAL_PRODUCTION, STOCK_DEDUCTION, SPARE_PARTS_REPLACEMENT';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_material_issuing_type ON material_issuing(issuing_type);
CREATE INDEX IF NOT EXISTS idx_material_issuing_machine_no ON material_issuing(machine_no);
CREATE INDEX IF NOT EXISTS idx_material_issuing_part_no ON material_issuing(part_no);

-- Update existing records to have default issuing type
UPDATE material_issuing 
SET issuing_type = 'NORMAL_PRODUCTION' 
WHERE issuing_type IS NULL;
