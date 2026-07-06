-- Allow dept QR station page to be accessed by users who can operate (update)
-- even if they don't have separate read permission.
--
-- This matches the frontend behavior on /production/dept-step-scan where users
-- must be able to lookup lots and operate steps.

UPDATE auth.menus
SET
  permission_codes = ARRAY['production_orders.read', 'production_orders.update']::text[],
  permission_match = 'any',
  updated_at = now()
WHERE code = 'production_dept_step_scan';

