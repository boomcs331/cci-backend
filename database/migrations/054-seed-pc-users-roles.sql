-- แผนก PC + Role PC_STAFF / PC_ADMIN + ผู้ใช้ทดสอบ
-- รหัสผ่าน: Passw0rd!
--
-- สิทธิ์ (ใช้ production_plans.* ที่มีในระบบปัจจุบัน):
--   รับเข้า      → create + read
--   จ่ายออก      → issue + read
--   วัตถุดิบ     → read
--   แผนจองสำเร็จ → create + update + read
--   รายงาน       → read
--   PC_ADMIN     → production_plans ครบ (CRUD + งานปฏิบัติการ)

INSERT INTO auth.departments (code, name, description)
VALUES ('PC', 'Production Control (PC)', 'แผนกควบคุมการผลิต / PC')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, updated_at = now();

INSERT INTO auth.roles (code, name, description, is_system, scope_type)
VALUES
  (
    'PC_STAFF',
    'PC Staff',
    'ใช้งานเมนู PC ตามสิทธิ์ปฏิบัติการ (รับเข้า/จ่ายออก/แผนจอง/รายงาน)',
    TRUE,
    'GLOBAL'
  ),
  (
    'PC_ADMIN',
    'PC Administrator',
    'จัดการเมนู PC ได้เต็มรูปแบบ (production_plans ครบชุด)',
    TRUE,
    'GLOBAL'
  )
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  scope_type = EXCLUDED.scope_type,
  is_system = EXCLUDED.is_system,
  updated_at = now();

-- PC_STAFF
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.code IN (
  'production_plans.read',
  'production_plans.create',
  'production_plans.update',
  'production_plans.issue'
)
WHERE r.code = 'PC_STAFF'
ON CONFLICT DO NOTHING;

-- PC_ADMIN — สิทธิ์ production_plans ทั้งหมด
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.module = 'production_plans'
WHERE r.code = 'PC_ADMIN'
ON CONFLICT DO NOTHING;

-- ผู้ใช้ pc.staff / pc.admin
INSERT INTO auth.users (username, email, password_hash, first_name, last_name, department_id, is_active)
VALUES
  (
    'pc.staff',
    'pc.staff@example.com',
    '$2b$10$hT1ZFDmF37INxZaYoBukrOHbwulybuJ0yDS.1TeHit9/qtleUibq6',
    'PC',
    'Staff',
    (SELECT id FROM auth.departments WHERE code = 'PC'),
    TRUE
  ),
  (
    'pc.admin',
    'pc.admin@example.com',
    '$2b$10$hT1ZFDmF37INxZaYoBukrOHbwulybuJ0yDS.1TeHit9/qtleUibq6',
    'PC',
    'Admin',
    (SELECT id FROM auth.departments WHERE code = 'PC'),
    TRUE
  )
ON CONFLICT (username) DO UPDATE
SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  department_id = EXCLUDED.department_id,
  is_active = TRUE,
  updated_at = now();

INSERT INTO auth.user_departments (user_id, department_id, is_primary)
SELECT u.id, d.id, TRUE
FROM auth.users u
JOIN auth.departments d ON d.code = 'PC'
WHERE u.username IN ('pc.staff', 'pc.admin')
ON CONFLICT (user_id, department_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;

DELETE FROM auth.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id AND u.username IN ('pc.staff', 'pc.admin');

DELETE FROM auth.user_role_assignments ura
USING auth.users u
WHERE ura.user_id = u.id AND u.username IN ('pc.staff', 'pc.admin');

INSERT INTO auth.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'PC_STAFF'
WHERE u.username = 'pc.staff'
ON CONFLICT DO NOTHING;

INSERT INTO auth.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'PC_ADMIN'
WHERE u.username = 'pc.admin'
ON CONFLICT DO NOTHING;

-- เมนู PC: แผนจองให้แผนก PC เข้าได้, ซ่อน Stock/จอง/ติดตามจาก role ที่ไม่มีสิทธิ์
UPDATE auth.menus
SET
  allowed_departments = ARRAY['WE', 'PC', 'PD']::text[],
  permission_codes = ARRAY['production_plans.read', 'production_plans.create', 'production_plans.update']::text[],
  permission_match = 'any',
  updated_at = now()
WHERE code = 'pc_schedule_res';

UPDATE auth.menus
SET
  permission_codes = ARRAY['production_plans.manage']::text[],
  permission_match = 'all',
  updated_at = now()
WHERE code = 'pc_stock';

UPDATE auth.menus
SET
  allowed_departments = ARRAY['WE', 'PC', 'PD']::text[],
  updated_at = now()
WHERE code IN ('pc_home', 'pc_income', 'pc_outcome', 'pc_report', 'pc_root');

UPDATE auth.menus
SET
  permission_codes = ARRAY[
    'production_plans.read',
    'production_plans.create',
    'production_plans.issue',
    'production_plans.update'
  ]::text[],
  permission_match = 'any',
  updated_at = now()
WHERE code = 'pc_root';
