-- เมนู "คำสั่งผลิต / QR ล็อต" + สิทธิ์สำหรับ we.admin / we.staff (แผนก WE หรือ WELDING)

UPDATE auth.menus
SET
  is_active = true,
  admin_only = false,
  label = 'คำสั่งผลิต / QR ล็อต',
  path = '/production/production-orders',
  permission_codes = ARRAY['production_orders.read']::text[],
  permission_match = 'any',
  allowed_departments = ARRAY['WE', 'WELDING']::text[],
  updated_at = now()
WHERE code = 'production_orders';

UPDATE auth.menus
SET
  is_active = true,
  admin_only = false,
  permission_codes = ARRAY['production_plans.read', 'production_orders.read']::text[],
  permission_match = 'any',
  allowed_departments = NULL,
  updated_at = now()
WHERE code IN ('production_root', 'production_overview');

UPDATE auth.menus
SET
  is_active = true,
  admin_only = false,
  permission_codes = ARRAY['production_orders.read', 'production_orders.update']::text[],
  permission_match = 'any',
  allowed_departments = ARRAY['WE', 'WELDING']::text[],
  updated_at = now()
WHERE code = 'production_dept_step_scan';

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.code = 'production_orders.read'
WHERE r.code IN ('DEPT_ADMIN', 'DEPT_STAFF')
ON CONFLICT DO NOTHING;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.code IN (
  'production_orders.create',
  'production_orders.update'
)
WHERE r.code = 'DEPT_ADMIN'
ON CONFLICT DO NOTHING;

-- แผนก WE สำหรับผู้ใช้ตัวอย่าง
UPDATE auth.users u
SET
  department_id = d.id,
  updated_at = now()
FROM auth.departments d
WHERE d.code = 'WE'
  AND u.username IN ('we.admin', 'we.staff')
  AND (u.department_id IS DISTINCT FROM d.id);

INSERT INTO auth.user_role_assignments (user_id, role_id, department_id)
SELECT u.id, r.id, d.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'DEPT_ADMIN'
JOIN auth.departments d ON d.code = 'WE'
WHERE u.username = 'we.admin'
ON CONFLICT DO NOTHING;

INSERT INTO auth.user_role_assignments (user_id, role_id, department_id)
SELECT u.id, r.id, d.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'DEPT_STAFF'
JOIN auth.departments d ON d.code = 'WE'
WHERE u.username = 'we.staff'
ON CONFLICT DO NOTHING;

INSERT INTO auth.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'DEPT_ADMIN'
WHERE u.username = 'we.admin'
ON CONFLICT DO NOTHING;

INSERT INTO auth.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'DEPT_STAFF'
WHERE u.username = 'we.staff'
ON CONFLICT DO NOTHING;
