-- ผู้ใช้ทดสอบฝั่งขาย (รหัสผ่าน: Passw0rd!)
-- hash เดียวกับ migration 026

INSERT INTO auth.users (username, email, password_hash, first_name, last_name, department_id, is_active)
VALUES
  (
    'sales.staff',
    'sales.staff@example.com',
    '$2b$10$hT1ZFDmF37INxZaYoBukrOHbwulybuJ0yDS.1TeHit9/qtleUibq6',
    'Sales',
    'Staff',
    (SELECT id FROM auth.departments WHERE code = 'WE' LIMIT 1),
    TRUE
  ),
  (
    'sales.manager',
    'sales.manager@example.com',
    '$2b$10$hT1ZFDmF37INxZaYoBukrOHbwulybuJ0yDS.1TeHit9/qtleUibq6',
    'Sales',
    'Manager',
    (SELECT id FROM auth.departments WHERE code = 'WE' LIMIT 1),
    TRUE
  ),
  (
    'warehouse.staff',
    'warehouse.staff@example.com',
    '$2b$10$hT1ZFDmF37INxZaYoBukrOHbwulybuJ0yDS.1TeHit9/qtleUibq6',
    'Warehouse',
    'Staff',
    (SELECT id FROM auth.departments WHERE code = 'WE' LIMIT 1),
    TRUE
  )
ON CONFLICT (username) DO UPDATE
SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
    is_active = TRUE, updated_at = now();

DELETE FROM auth.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id
  AND u.username IN ('sales.staff', 'sales.manager', 'warehouse.staff');

INSERT INTO auth.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'SALES_STAFF'
WHERE u.username = 'sales.staff'
ON CONFLICT DO NOTHING;

INSERT INTO auth.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'SALES_MANAGER'
WHERE u.username = 'sales.manager'
ON CONFLICT DO NOTHING;

INSERT INTO auth.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
JOIN auth.roles r ON r.code = 'WAREHOUSE'
WHERE u.username = 'warehouse.staff'
ON CONFLICT DO NOTHING;
