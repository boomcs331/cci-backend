-- Migration script for Product Master Data Tables
-- Created: 2024

-- Create product_types table
CREATE TABLE IF NOT EXISTS product_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    create_by VARCHAR(255),
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(255)
);

-- Create product_models table
CREATE TABLE IF NOT EXISTS product_models (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    create_by VARCHAR(255),
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(255)
);

-- Create product_delivery_types table
CREATE TABLE IF NOT EXISTS product_delivery_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    create_by VARCHAR(255),
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(255)
);

-- Create product_units table
CREATE TABLE IF NOT EXISTS product_units (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    create_by VARCHAR(255),
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(255)
);

-- Create product_loading_points table
CREATE TABLE IF NOT EXISTS product_loading_points (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    create_by VARCHAR(255),
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(255)
);

-- Create product_process_lines table
CREATE TABLE IF NOT EXISTS product_process_lines (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    create_by VARCHAR(255),
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(255)
);

-- Add new columns to products table if they don't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_type_id INTEGER,
ADD COLUMN IF NOT EXISTS lr VARCHAR(2),
ADD COLUMN IF NOT EXISTS lot_size INTEGER,
ADD COLUMN IF NOT EXISTS min_stock SMALLINT,
ADD COLUMN IF NOT EXISTS customer_id INTEGER,
ADD COLUMN IF NOT EXISTS model_id INTEGER,
ADD COLUMN IF NOT EXISTS delivery_type_id INTEGER,
ADD COLUMN IF NOT EXISTS unit_id INTEGER,
ADD COLUMN IF NOT EXISTS scale VARCHAR(50),
ADD COLUMN IF NOT EXISTS loading_point_id INTEGER,
ADD COLUMN IF NOT EXISTS process_line_id INTEGER;

-- Add foreign key constraints (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_product_type') THEN
        ALTER TABLE products ADD CONSTRAINT fk_products_product_type 
        FOREIGN KEY (product_type_id) REFERENCES product_types(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_customer') THEN
        ALTER TABLE products ADD CONSTRAINT fk_products_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_model') THEN
        ALTER TABLE products ADD CONSTRAINT fk_products_model 
        FOREIGN KEY (model_id) REFERENCES product_models(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_delivery_type') THEN
        ALTER TABLE products ADD CONSTRAINT fk_products_delivery_type 
        FOREIGN KEY (delivery_type_id) REFERENCES product_delivery_types(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_unit') THEN
        ALTER TABLE products ADD CONSTRAINT fk_products_unit 
        FOREIGN KEY (unit_id) REFERENCES product_units(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_loading_point') THEN
        ALTER TABLE products ADD CONSTRAINT fk_products_loading_point 
        FOREIGN KEY (loading_point_id) REFERENCES product_loading_points(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_process_line') THEN
        ALTER TABLE products ADD CONSTRAINT fk_products_process_line 
        FOREIGN KEY (process_line_id) REFERENCES product_process_lines(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_product_type_id ON products(product_type_id);
CREATE INDEX IF NOT EXISTS idx_products_customer_id ON products(customer_id);
CREATE INDEX IF NOT EXISTS idx_products_model_id ON products(model_id);
CREATE INDEX IF NOT EXISTS idx_products_delivery_type_id ON products(delivery_type_id);
CREATE INDEX IF NOT EXISTS idx_products_unit_id ON products(unit_id);
CREATE INDEX IF NOT EXISTS idx_products_loading_point_id ON products(loading_point_id);
CREATE INDEX IF NOT EXISTS idx_products_process_line_id ON products(process_line_id);

-- Insert sample data (optional)
INSERT INTO product_types (code, name, description, create_by) VALUES
('FG', 'Finished Goods', 'Finished products ready for sale', 'system'),
('WIP', 'Work In Progress', 'Products in production', 'system'),
('RM', 'Raw Material', 'Raw materials for production', 'system')
ON CONFLICT (code) DO NOTHING;

INSERT INTO product_units (code, name, description, create_by) VALUES
('PCS', 'Pieces', 'Individual pieces', 'system'),
('BOX', 'Box', 'Box packaging', 'system'),
('KG', 'Kilogram', 'Weight in kilograms', 'system'),
('L', 'Liter', 'Volume in liters', 'system')
ON CONFLICT (code) DO NOTHING;

INSERT INTO product_delivery_types (code, name, description, create_by) VALUES
('STD', 'Standard', 'Standard delivery', 'system'),
('EXP', 'Express', 'Express delivery', 'system'),
('URG', 'Urgent', 'Urgent delivery', 'system')
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE product_types IS 'Product types master data';
COMMENT ON TABLE product_models IS 'Product models master data';
COMMENT ON TABLE product_delivery_types IS 'Product delivery types master data';
COMMENT ON TABLE product_units IS 'Product units master data';
COMMENT ON TABLE product_loading_points IS 'Product loading points master data';
COMMENT ON TABLE product_process_lines IS 'Product process lines master data';
