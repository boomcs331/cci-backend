-- Phase 5: Add sales product and customer management menus

INSERT INTO auth.menus (
  code, label, path, icon_key, sort_order, admin_only,
  permission_codes, permission_match, allowed_departments, parent_id
)
VALUES
  ('sales_products', 'สินค้า (ฝั่งขาย)', '/sales/products', NULL, 70, FALSE,
   ARRAY['product.read']::text[], 'all', NULL,
   (SELECT id FROM auth.menus WHERE code = 'sales_root')),
  ('sales_customers', 'ลูกค้า (ฝั่งขาย)', '/sales/customers', NULL, 80, FALSE,
   ARRAY['customer.read']::text[], 'all', NULL,
   (SELECT id FROM auth.menus WHERE code = 'sales_root'))
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label, path = EXCLUDED.path, sort_order = CASE
  WHEN EXCLUDED.code = 'sales_products' THEN 70
  WHEN EXCLUDED.code = 'sales_customers' THEN 80
  ELSE EXCLUDED.sort_order
END,
    permission_codes = EXCLUDED.permission_codes, permission_match = EXCLUDED.permission_match,
    parent_id = EXCLUDED.parent_id, is_active = TRUE, updated_at = now();
