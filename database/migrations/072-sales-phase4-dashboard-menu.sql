-- Phase 4: Add dashboard menu

INSERT INTO auth.menus (
  code, label, path, icon_key, sort_order, admin_only,
  permission_codes, permission_match, allowed_departments, parent_id
)
VALUES
  ('sales_dashboard', 'Dashboard ขาย', '/sales/dashboard', NULL, 10, FALSE,
   ARRAY['sales_order.read']::text[], 'all', NULL,
   (SELECT id FROM auth.menus WHERE code = 'sales_root'))
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label, path = EXCLUDED.path, sort_order = 10,
    permission_codes = EXCLUDED.permission_codes, permission_match = EXCLUDED.permission_match,
    parent_id = EXCLUDED.parent_id, is_active = TRUE, updated_at = now();
