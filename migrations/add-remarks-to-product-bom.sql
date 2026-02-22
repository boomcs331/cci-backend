-- Add remarks column to product_bom table

ALTER TABLE product_bom 
ADD COLUMN IF NOT EXISTS remarks TEXT;

COMMENT ON COLUMN product_bom.remarks IS 'Remarks or notes for the BOM item';
