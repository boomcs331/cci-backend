-- เมนูจัดการสิทธิ์ Role สำหรับ Global Admin
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
  'users_role_permissions',
  'กำหนดสิทธิ์ Role',
  '/users/role-permissions',
  NULL,
  25,
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
  updated_at = now();

UPDATE auth.menus
SET label = 'Roles (ข้อมูล Role)', sort_order = 30
WHERE code = 'users_roles';

UPDATE auth.menus
SET label = 'รายการ Permission', sort_order = 40
WHERE code = 'users_permissions';
