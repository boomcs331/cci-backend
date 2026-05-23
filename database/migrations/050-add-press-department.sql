-- แผนก PRESS (Press) — สอดคล้อง master.production_processes.process_code = PRESS

INSERT INTO auth.departments (code, name, description)
VALUES ('PRESS', 'Press', 'Press line — QR station for PRESS step')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

-- ให้ขั้น PRESS รับผู้ใช้แผนก PRESS หรือ PD
UPDATE master.production_processes
SET allowed_department_codes = ARRAY['PRESS', 'PD']::text[]
WHERE process_code = 'PRESS'
  AND (
    allowed_department_codes IS NULL
    OR NOT ('PRESS' = ANY (allowed_department_codes))
  );
