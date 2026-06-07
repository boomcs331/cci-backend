-- Remove unused sales menus
-- Removes: sales_import, sales_customers, sales_products

DELETE FROM auth.menus WHERE code IN ('sales_import', 'sales_customers', 'sales_products');
