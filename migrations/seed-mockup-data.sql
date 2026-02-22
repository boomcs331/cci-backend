-- Mockup Data for CCI Backend
-- Run this script AFTER running add-product-master-data-tables.sql
-- This script assumes all tables already exist

-- ============================================
-- CUSTOMERS (Must insert first for foreign keys)
-- ============================================

INSERT INTO customers (customer_code, customer_name, phone, email, address, is_active, create_by) VALUES
('CUST001', 'ABC Corporation', '0812345678', 'contact@abc-corp.com', '100 Business St, Bangkok 10100', true, 'system'),
('CUST002', 'XYZ Industries', '0898765432', 'info@xyz-ind.com', '200 Industrial Rd, Bangkok 10200', true, 'system'),
('CUST003', 'Global Trading Co.', '0823456789', 'sales@globaltrading.com', '300 Trade Ave, Bangkok 10300', true, 'system')
ON CONFLICT (customer_code) DO NOTHING;

-- ============================================
-- PRODUCT LOCATIONS
-- ============================================

INSERT INTO product_locations (code, name, description, create_by) VALUES
('PWH01', 'Product Warehouse 1', 'Main product warehouse', 'system'),
('PWH02', 'Product Warehouse 2', 'Secondary product warehouse', 'system'),
('PSHOP', 'Shop Floor', 'Production shop floor', 'system')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- PRODUCT MODELS
-- ============================================

INSERT INTO product_models (code, name, description, create_by) VALUES
('MODEL-A', 'Model A', 'Standard model', 'system'),
('MODEL-B', 'Model B', 'Premium model', 'system'),
('MODEL-C', 'Model C', 'Economy model', 'system')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- PRODUCT LOADING POINTS
-- ============================================

INSERT INTO product_loading_points (code, name, description, create_by) VALUES
('LP01', 'Loading Point 1', 'Main loading point', 'system'),
('LP02', 'Loading Point 2', 'Secondary loading point', 'system'),
('LP03', 'Loading Point 3', 'Backup loading point', 'system')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- PRODUCT PROCESS LINES
-- ============================================

INSERT INTO product_process_lines (code, name, description, create_by) VALUES
('LINE01', 'Process Line 1', 'Main production line', 'system'),
('LINE02', 'Process Line 2', 'Secondary production line', 'system'),
('LINE03', 'Process Line 3', 'Assembly line', 'system')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- SAMPLE PRODUCTS
-- ============================================

INSERT INTO products (product_code, product_name, description, customer_id, is_active, create_by, update_by) VALUES
('PROD001', 'Widget A', 'Standard widget for general use', (SELECT id FROM customers WHERE customer_code = 'CUST001'), true, 'system', 'system'),
('PROD002', 'Widget B', 'Premium widget with enhanced features', (SELECT id FROM customers WHERE customer_code = 'CUST001'), true, 'system', 'system'),
('PROD003', 'Assembly Kit C', 'Complete assembly kit', (SELECT id FROM customers WHERE customer_code = 'CUST002'), true, 'system', 'system'),
('PROD004', 'Component D', 'Replacement component', (SELECT id FROM customers WHERE customer_code = 'CUST002'), true, 'system', 'system'),
('PROD005', 'Module E', 'Electronic module', (SELECT id FROM customers WHERE customer_code = 'CUST003'), true, 'system', 'system')
ON CONFLICT (product_code) DO NOTHING;

-- Complete product with all specifications
INSERT INTO products (
    product_code, product_name, description, product_type_id, default_location_id,
    lr, lot_size, min_stock, customer_id, model_id, delivery_type_id, unit_id,
    scale, loading_point_id, process_line_id, is_active, create_by, update_by
) VALUES 
(
    'PROD00555', 'Deluxe Assembly Product', 'Complete deluxe product with all specifications',
    (SELECT id FROM product_types WHERE code = 'FG'),
    (SELECT id FROM product_locations WHERE code = 'PWH01'),
    'LR', 50, 20,
    (SELECT id FROM customers WHERE customer_code = 'CUST001'),
    (SELECT id FROM product_models WHERE code = 'MODEL-A'),
    (SELECT id FROM product_delivery_types WHERE code = 'STD'),
    (SELECT id FROM product_units WHERE code = 'PCS'),
    '1:1',
    (SELECT id FROM product_loading_points WHERE code = 'LP01'),
    (SELECT id FROM product_process_lines WHERE code = 'LINE01'),
    true, 'system', 'system'
),
(
    'PROD00666', 'Premium Widget Set', 'High-end widget with express delivery',
    (SELECT id FROM product_types WHERE code = 'FG'),
    (SELECT id FROM product_locations WHERE code = 'PWH02'),
    'L', 100, 30,
    (SELECT id FROM customers WHERE customer_code = 'CUST002'),
    (SELECT id FROM product_models WHERE code = 'MODEL-B'),
    (SELECT id FROM product_delivery_types WHERE code = 'EXP'),
    (SELECT id FROM product_units WHERE code = 'BOX'),
    '1:2',
    (SELECT id FROM product_loading_points WHERE code = 'LP02'),
    (SELECT id FROM product_process_lines WHERE code = 'LINE02'),
    true, 'system', 'system'
),
(
    'PROD00777', 'Raw Material Component', 'Essential raw material for production',
    (SELECT id FROM product_types WHERE code = 'RM'),
    (SELECT id FROM product_locations WHERE code = 'PSHOP'),
    'R', 200, 50,
    (SELECT id FROM customers WHERE customer_code = 'CUST003'),
    (SELECT id FROM product_models WHERE code = 'MODEL-A'),
    (SELECT id FROM product_delivery_types WHERE code = 'URG'),
    (SELECT id FROM product_units WHERE code = 'KG'),
    '1:1',
    (SELECT id FROM product_loading_points WHERE code = 'LP01'),
    (SELECT id FROM product_process_lines WHERE code = 'LINE01'),
    true, 'system', 'system'
)
ON CONFLICT (product_code) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'Product Locations', COUNT(*) FROM product_locations
UNION ALL
SELECT 'Products', COUNT(*) FROM products;
