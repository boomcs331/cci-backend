-- Seed sample auth users for quick testing
-- Default password (bcrypt hash): Passw0rd!

INSERT INTO auth.users (username, email, password_hash, first_name, last_name, department_id, is_active)
VALUES (
  'admin.global',
  'admin.global@example.com',
  '$2b$10$hT1ZFDmF37INxZaYoBukrOHbwulybuJ0yDS.1TeHit9/qtleUibq6',
  'Global',
  'Admin',
  (SELECT id FROM auth.departments WHERE code = 'WE'),
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
  'we.admin',
  'we.admin@example.com',
  '$2b$10$hT1ZFDmF37INxZaYoBukrOHbwulybuJ0yDS.1TeHit9/qtleUibq6',
  'WE',
  'Admin',
  (SELECT id FROM auth.departments WHERE code = 'WE'),
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
  'we.staff',
  'we.staff@example.com',
  '$2b$10$hT1ZFDmF37INxZaYoBukrOHbwulybuJ0yDS.1TeHit9/qtleUibq6',
  'WE',
  'Staff',
  (SELECT id FROM auth.departments WHERE code = 'WE'),
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
  'pd.staff',
  'pd.staff@example.com',
  '$2b$10$hT1ZFDmF37INxZaYoBukrOHbwulybuJ0yDS.1TeHit9/qtleUibq6',
  'PD',
  'Staff',
  (SELECT id FROM auth.departments WHERE code = 'PD'),
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

DELETE FROM auth.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id
  AND u.username IN ('admin.global', 'we.admin', 'we.staff', 'pd.staff');

DELETE FROM auth.user_role_assignments ura
USING auth.users u
WHERE ura.user_id = u.id
  AND u.username IN ('admin.global', 'we.admin', 'we.staff', 'pd.staff');

INSERT INTO auth.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'ADMIN_GLOBAL'
WHERE u.username = 'admin.global'
ON CONFLICT DO NOTHING;

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

INSERT INTO auth.user_role_assignments (user_id, role_id, department_id)
SELECT u.id, r.id, d.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'DEPT_STAFF'
JOIN auth.departments d ON d.code = 'PD'
WHERE u.username = 'pd.staff'
ON CONFLICT DO NOTHING;
