-- Rollback script for issuing with documents feature

-- Drop indexes
DROP INDEX IF EXISTS idx_issuing_types_active;
DROP INDEX IF EXISTS idx_issuing_types_code;
DROP INDEX IF EXISTS idx_material_issuing_type_id;
DROP INDEX IF EXISTS idx_issuing_documents_issuing_id;

-- Remove foreign key constraint
ALTER TABLE material_issuing DROP CONSTRAINT IF EXISTS fk_issuing_type;

-- Remove issuing_type_id column
ALTER TABLE material_issuing DROP COLUMN IF EXISTS issuing_type_id;

-- Restore issuing_type column defaults
ALTER TABLE material_issuing 
ALTER COLUMN issuing_type SET DEFAULT 'NORMAL_PRODUCTION',
ALTER COLUMN issuing_type SET NOT NULL;

-- Drop tables
DROP TABLE IF EXISTS material_issuing_documents;
DROP TABLE IF EXISTS issuing_types;
