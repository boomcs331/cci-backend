-- ผู้ใช้ตัวอย่าง: เข้าได้ทั้งแผนก WELDING และ PRESS
-- รหัสผ่านเริ่มต้น: Passw0rd!

INSERT INTO auth.users (username, email, password_hash, first_name, last_name, department_id, is_active)
VALUES (
  'wp.admin',
  'wp.admin@example.com',
  '$2b$10$hT1ZFDmF37INxZaYoBukrOHbwulybuJ0yDS.1TeHit9/qtleUibq6',
  'Weld+Press',
  'Admin',
  (SELECT id FROM auth.departments WHERE code = 'WELDING'),
  true
)
ON CONFLICT (username) DO UPDATE
SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  department_id = EXCLUDED.department_id,
  is_active = true,
  updated_at = now();

INSERT INTO auth.users (username, email, password_hash, first_name, last_name, department_id, is_active)
VALUES (
  'wp.staff',
  'wp.staff@example.com',
  '$2b$10$hT1ZFDmF37INxZaYoBukrOHbwulybuJ0yDS.1TeHit9/qtleUibq6',
  'Weld+Press',
  'Staff',
  (SELECT id FROM auth.departments WHERE code = 'WELDING'),
  true
)
ON CONFLICT (username) DO UPDATE
SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  department_id = EXCLUDED.department_id,
  is_active = true,
  updated_at = now();

-- สังกัดหลายแผนก: WELDING (หลัก) + PRESS
INSERT INTO auth.user_departments (user_id, department_id, is_primary)
SELECT u.id, d.id, (d.code = 'WELDING')
FROM auth.users u
CROSS JOIN auth.departments d
WHERE u.username IN ('wp.admin', 'wp.staff')
  AND d.code IN ('WELDING', 'PRESS')
ON CONFLICT (user_id, department_id) DO UPDATE
SET is_primary = EXCLUDED.is_primary;

-- สิทธิ์แผนก WELDING
INSERT INTO auth.user_role_assignments (user_id, role_id, department_id)
SELECT u.id, r.id, d.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'DEPT_ADMIN'
JOIN auth.departments d ON d.code = 'WELDING'
WHERE u.username = 'wp.admin'
ON CONFLICT DO NOTHING;

INSERT INTO auth.user_role_assignments (user_id, role_id, department_id)
SELECT u.id, r.id, d.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'DEPT_STAFF'
JOIN auth.departments d ON d.code = 'WELDING'
WHERE u.username = 'wp.staff'
ON CONFLICT DO NOTHING;

-- สิทธิ์แผนก PRESS
INSERT INTO auth.user_role_assignments (user_id, role_id, department_id)
SELECT u.id, r.id, d.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'DEPT_ADMIN'
JOIN auth.departments d ON d.code = 'PRESS'
WHERE u.username = 'wp.admin'
ON CONFLICT DO NOTHING;

INSERT INTO auth.user_role_assignments (user_id, role_id, department_id)
SELECT u.id, r.id, d.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'DEPT_STAFF'
JOIN auth.departments d ON d.code = 'PRESS'
WHERE u.username = 'wp.staff'
ON CONFLICT DO NOTHING;

INSERT INTO auth.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'DEPT_ADMIN'
WHERE u.username = 'wp.admin'
ON CONFLICT DO NOTHING;

INSERT INTO auth.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'DEPT_STAFF'
WHERE u.username = 'wp.staff'
ON CONFLICT DO NOTHING;

-- เมนู production สำหรับแผนก WELDING / PRESS (และ alias WE, PD)
UPDATE auth.menus
SET
  allowed_departments = ARRAY['WE', 'WELDING', 'PRESS', 'PD']::text[],
  updated_at = now()
WHERE code IN ('production_orders', 'production_dept_step_scan');
