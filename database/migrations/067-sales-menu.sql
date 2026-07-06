-- เมนู Sales (กลุ่ม + ลูกที่มีอยู่จริงใน Phase 1)
-- parent: sales_root ; child Phase 1: sales_orders (/sales/orders)

INSERT INTO auth.menus (
  code, label, path, icon_key, sort_order, admin_only,
  permission_codes, permission_match, allowed_departments, parent_id
)
VALUES
  ('sales_root', 'จัดการการขาย', NULL, 'cart', 45, FALSE,
   ARRAY['sales_order.read']::text[], 'any', NULL, NULL)
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label, path = EXCLUDED.path, icon_key = EXCLUDED.icon_key,
    sort_order = EXCLUDED.sort_order, admin_only = EXCLUDED.admin_only,
    permission_codes = EXCLUDED.permission_codes, permission_match = EXCLUDED.permission_match,
    allowed_departments = EXCLUDED.allowed_departments, parent_id = EXCLUDED.parent_id,
    is_active = TRUE, updated_at = now();

INSERT INTO auth.menus (
  code, label, path, icon_key, sort_order, admin_only,
  permission_codes, permission_match, allowed_departments, parent_id
)
VALUES
  ('sales_orders', 'ออเดอร์ขาย', '/sales/orders', NULL, 20, FALSE,
   ARRAY['sales_order.read']::text[], 'all', NULL,
   (SELECT id FROM auth.menus WHERE code = 'sales_root'))
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label, path = EXCLUDED.path, icon_key = EXCLUDED.icon_key,
    sort_order = EXCLUDED.sort_order, admin_only = EXCLUDED.admin_only,
    permission_codes = EXCLUDED.permission_codes, permission_match = EXCLUDED.permission_match,
    allowed_departments = EXCLUDED.allowed_departments, parent_id = EXCLUDED.parent_id,
    is_active = TRUE, updated_at = now();
