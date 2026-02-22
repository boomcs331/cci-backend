-- Rollback script for Product Master Data Tables

-- Drop foreign key constraints
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_product_type;
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_customer;
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_model;
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_delivery_type;
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_unit;
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_loading_point;
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_process_line;

-- Drop indexes
DROP INDEX IF EXISTS idx_products_product_type_id;
DROP INDEX IF EXISTS idx_products_customer_id;
DROP INDEX IF EXISTS idx_products_model_id;
DROP INDEX IF EXISTS idx_products_delivery_type_id;
DROP INDEX IF EXISTS idx_products_unit_id;
DROP INDEX IF EXISTS idx_products_loading_point_id;
DROP INDEX IF EXISTS idx_products_process_line_id;

-- Drop columns from products table
ALTER TABLE products 
DROP COLUMN IF EXISTS product_type_id,
DROP COLUMN IF EXISTS lr,
DROP COLUMN IF EXISTS lot_size,
DROP COLUMN IF EXISTS min_stock,
DROP COLUMN IF EXISTS customer_id,
DROP COLUMN IF EXISTS model_id,
DROP COLUMN IF EXISTS delivery_type_id,
DROP COLUMN IF EXISTS unit_id,
DROP COLUMN IF EXISTS scale,
DROP COLUMN IF EXISTS loading_point_id,
DROP COLUMN IF EXISTS process_line_id;

-- Drop master data tables
DROP TABLE IF EXISTS product_process_lines;
DROP TABLE IF EXISTS product_loading_points;
DROP TABLE IF EXISTS product_units;
DROP TABLE IF EXISTS product_delivery_types;
DROP TABLE IF EXISTS product_models;
DROP TABLE IF EXISTS product_types;
