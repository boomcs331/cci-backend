-- Phase 3: Add import/export permissions to sales module

INSERT INTO auth.permissions (code, name, description, created_at, updated_at)
VALUES
  ('sales_order.import', 'Import Sales Orders', 'นำเข้าออเดอร์จาก Excel', now(), now()),
  ('sales_order.export', 'Export Sales Orders', 'ส่งออกออเดอร์เป็น Excel/PDF', now(), now())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

-- Grant import permission to SALES_MANAGER
INSERT INTO auth.role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, now()
FROM auth.roles r
CROSS JOIN auth.permissions p
WHERE r.code = 'SALES_MANAGER'
  AND p.code IN ('sales_order.import', 'sales_order.export')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant import permission to ADMIN_GLOBAL
INSERT INTO auth.role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, now()
FROM auth.roles r
CROSS JOIN auth.permissions p
WHERE r.code = 'ADMIN_GLOBAL'
  AND p.code IN ('sales_order.import', 'sales_order.export')
ON CONFLICT (role_id, permission_id) DO NOTHING;
