-- ผู้ใช้ 1 คน สังกัดได้หลายแผนก (user_departments) + แผนกหลักที่ users.department_id

CREATE TABLE IF NOT EXISTS auth.user_departments (
  user_id BIGINT NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  department_id BIGINT NOT NULL REFERENCES auth.departments (id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, department_id)
);

CREATE INDEX IF NOT EXISTS idx_user_departments_department
  ON auth.user_departments (department_id);

-- ย้ายแผนกเดิมจาก users.department_id
INSERT INTO auth.user_departments (user_id, department_id, is_primary)
SELECT u.id, u.department_id, true
FROM auth.users u
WHERE u.department_id IS NOT NULL
ON CONFLICT (user_id, department_id) DO UPDATE
SET is_primary = EXCLUDED.is_primary;

-- we.admin / we.staff: ตัวอย่างหลายแผนก (WE + WELDING)
INSERT INTO auth.user_departments (user_id, department_id, is_primary)
SELECT u.id, d.id, (d.code = 'WE')
FROM auth.users u
CROSS JOIN auth.departments d
WHERE u.username IN ('we.admin', 'we.staff')
  AND d.code IN ('WE', 'WELDING')
ON CONFLICT (user_id, department_id) DO NOTHING;

UPDATE auth.users u
SET department_id = d.id, updated_at = now()
FROM auth.departments d
WHERE u.username IN ('we.admin', 'we.staff')
  AND d.code = 'WE'
  AND (u.department_id IS DISTINCT FROM d.id);
