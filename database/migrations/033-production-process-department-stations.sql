-- Production processes: optional allowed_department_codes (matches auth.departments.code). NULL = no restriction.

ALTER TABLE master.production_processes
  ADD COLUMN IF NOT EXISTS allowed_department_codes TEXT[] NULL;

COMMENT ON COLUMN master.production_processes.allowed_department_codes IS
  'If set, only users in one of these auth.departments.code may start/complete this process (except ADMIN_GLOBAL). NULL = no department restriction.';

UPDATE master.production_processes
SET allowed_department_codes = ARRAY['WELDING', 'WE']::text[]
WHERE process_code = 'WELDING';

UPDATE master.production_processes
SET allowed_department_codes = ARRAY['PRESS', 'PD']::text[]
WHERE process_code = 'PRESS';

INSERT INTO auth.departments (code, name, description)
VALUES ('WELDING', 'Welding', 'Welding line — QR station for WELDING step')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

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
  'production_dept_step_scan',
  'ยิง QR ตามแผนก (ผลิต)',
  '/production/dept-step-scan',
  NULL,
  35,
  FALSE,
  ARRAY['production_orders.update']::text[],
  'all',
  NULL,
  (SELECT id FROM auth.menus WHERE code = 'production_root')
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  sort_order = EXCLUDED.sort_order,
  permission_codes = EXCLUDED.permission_codes,
  permission_match = EXCLUDED.permission_match,
  parent_id = EXCLUDED.parent_id,
  updated_at = now();
