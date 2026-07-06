-- เมนูจัดการแผนก (CRUD) ภายใต้ Users Management
INSERT INTO auth.menus (
  code,
  label,
  path,
  icon_key,
  sort_order,
  admin_only,
  permission_codes,
  permission_match,
  allowed_departments,
  parent_id
)
VALUES (
  'users_departments',
  'จัดการแผนก',
  '/users/departments',
  NULL,
  15,
  TRUE,
  NULL,
  'all',
  NULL,
  (SELECT id FROM auth.menus WHERE code = 'users_mgmt')
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  sort_order = EXCLUDED.sort_order,
  admin_only = EXCLUDED.admin_only,
  parent_id = EXCLUDED.parent_id,
  is_active = TRUE,
  updated_at = now();
