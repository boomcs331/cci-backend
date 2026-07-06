-- บทบาทสำหรับผู้ใช้หลายแผนก (Production ข้ามไลน์)
--
-- PRODUCTION_ALL_STAFF
--   เข้าเมนู Production + Stock ได้ครบ (module production, stock)
--   ไม่มีสิทธิ์ PC (inbound/outbound ฯลฯ)
--
-- PRODUCTION_PC_ADMIN
--   เหมือน staff ใน Production + Stock
--   + เมนู PC แบบอ่านอย่างเดียว (สิทธิ์ pc ที่ลงท้าย .read)
--
-- ผู้ใช้ตัวอย่าง (รหัสผ่าน: Passw0rd!)
--   multi.prod.staff — WELDING + PRESS, role PRODUCTION_ALL_STAFF
--   multi.prod.admin — WELDING + PRESS + PC, role PRODUCTION_PC_ADMIN

INSERT INTO auth.roles (code, name, description, is_system, scope_type)
VALUES
  (
    'PRODUCTION_ALL_STAFF',
    'Production — ทุกเมนู (หลายแผนก)',
    'ใช้งานเมนู Production และ Stock ได้ครบ ข้ามแผนกที่สังกัด (ไม่รวม PC)',
    TRUE,
    'GLOBAL'
  ),
  (
    'PRODUCTION_PC_ADMIN',
    'Production + PC อ่านอย่างเดียว',
    'เมนู Production/Stock ครบ + เมนู PC ดูได้อย่างเดียว (ไม่มี create/update/delete ใน PC)',
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

-- ล้างสิทธิ์เดิมของ role แล้วใส่ใหม่
DELETE FROM auth.role_permissions rp
USING auth.roles r
WHERE rp.role_id = r.id
  AND r.code IN ('PRODUCTION_ALL_STAFF', 'PRODUCTION_PC_ADMIN');

-- Staff: production + stock ครบ
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.module IN ('production', 'stock')
WHERE r.code = 'PRODUCTION_ALL_STAFF'
ON CONFLICT DO NOTHING;

-- Admin: production + stock ครบ + PC read-only
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.module IN ('production', 'stock')
WHERE r.code = 'PRODUCTION_PC_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.module = 'pc' AND p.code LIKE '%.read'
WHERE r.code = 'PRODUCTION_PC_ADMIN'
ON CONFLICT DO NOTHING;

-- ผู้ใช้ตัวอย่าง
INSERT INTO auth.users (username, email, password_hash, first_name, last_name, department_id, is_active)
VALUES
  (
    'multi.prod.staff',
    'multi.prod.staff@example.com',
    '$2b$10$hT1ZFDmF37INxZaYoBukrOHbwulybuJ0yDS.1TeHit9/qtleUibq6',
    'Multi',
    'Prod Staff',
    (SELECT id FROM auth.departments WHERE code = 'WELDING'),
    TRUE
  ),
  (
    'multi.prod.admin',
    'multi.prod.admin@example.com',
    '$2b$10$hT1ZFDmF37INxZaYoBukrOHbwulybuJ0yDS.1TeHit9/qtleUibq6',
    'Multi',
    'Prod Admin',
    (SELECT id FROM auth.departments WHERE code = 'WELDING'),
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

-- หลายแผนก: staff = WELDING (หลัก) + PRESS
INSERT INTO auth.user_departments (user_id, department_id, is_primary)
SELECT u.id, d.id, (d.code = 'WELDING')
FROM auth.users u
CROSS JOIN auth.departments d
WHERE u.username = 'multi.prod.staff'
  AND d.code IN ('WELDING', 'PRESS')
ON CONFLICT (user_id, department_id) DO UPDATE
SET is_primary = EXCLUDED.is_primary;

-- admin = WELDING (หลัก) + PRESS + PC (ดูเมนู PC)
INSERT INTO auth.user_departments (user_id, department_id, is_primary)
SELECT u.id, d.id, (d.code = 'WELDING')
FROM auth.users u
CROSS JOIN auth.departments d
WHERE u.username = 'multi.prod.admin'
  AND d.code IN ('WELDING', 'PRESS', 'PC')
ON CONFLICT (user_id, department_id) DO UPDATE
SET is_primary = EXCLUDED.is_primary;

DELETE FROM auth.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id
  AND u.username IN ('multi.prod.staff', 'multi.prod.admin');

DELETE FROM auth.user_role_assignments ura
USING auth.users u
WHERE ura.user_id = u.id
  AND u.username IN ('multi.prod.staff', 'multi.prod.admin');

INSERT INTO auth.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'PRODUCTION_ALL_STAFF'
WHERE u.username = 'multi.prod.staff'
ON CONFLICT DO NOTHING;

INSERT INTO auth.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'PRODUCTION_PC_ADMIN'
WHERE u.username = 'multi.prod.admin'
ON CONFLICT DO NOTHING;

-- ให้เมนู production รองรับสลับแผนก WELDING / PRESS (มีอยู่แล้วจาก 051 — ยืนยันอีกครั้ง)
UPDATE auth.menus
SET
  allowed_departments = ARRAY['WE', 'WELDING', 'PRESS', 'PD', 'PC']::text[],
  updated_at = now()
WHERE code IN (
  'production_root',
  'production_orders',
  'production_dept_step_scan',
  'production_products',
  'production_steps',
  'production_tracking',
  'production_overview',
  'stock_balance_root',
  'pc_product_stock'
);
