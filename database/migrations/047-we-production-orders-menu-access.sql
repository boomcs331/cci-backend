-- เปิดเมนู "คำสั่งผลิต / QR ล็อต" สำหรับแผนก WE (we.admin, we.staff)
-- ใช้สิทธิ์ production_orders.read + allowed_departments = WE

UPDATE auth.menus
SET
  is_active = true,
  label = 'คำสั่งผลิต / QR ล็อต',
  path = '/production/production-orders',
  permission_codes = ARRAY['production_orders.read']::text[],
  permission_match = 'any',
  allowed_departments = NULL,
  updated_at = now()
WHERE code = 'production_orders';

-- กลุ่ม Production แสดงได้ถ้ามี production_orders.read หรือ production_plans.read
UPDATE auth.menus
SET
  is_active = true,
  permission_codes = ARRAY['production_plans.read', 'production_orders.read']::text[],
  permission_match = 'any',
  updated_at = now()
WHERE code IN ('production_root', 'production_overview');

-- สิทธิ์ใน role แผนก
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

-- we.admin = DEPT_ADMIN @ WE
INSERT INTO auth.user_role_assignments (user_id, role_id, department_id)
SELECT u.id, r.id, d.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'DEPT_ADMIN'
JOIN auth.departments d ON d.code = 'WE'
WHERE u.username = 'we.admin'
ON CONFLICT DO NOTHING;

-- we.staff = DEPT_STAFF @ WE
INSERT INTO auth.user_role_assignments (user_id, role_id, department_id)
SELECT u.id, r.id, d.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'DEPT_STAFF'
JOIN auth.departments d ON d.code = 'WE'
WHERE u.username = 'we.staff'
ON CONFLICT DO NOTHING;

-- สำรอง: ผูก role ตรงที่ user_roles (กรณี role_assignments ไม่ถูกโหลด)
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
