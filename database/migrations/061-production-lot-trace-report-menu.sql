-- เมนูรายงานสอบกลับล็อต (รับเข้า / จ่ายออก ทุกขั้นตอน)

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
SELECT
  'production_lot_trace_report',
  'สอบกลับล็อต (รับเข้า-จ่ายออก)',
  '/production/lot-trace-report',
  NULL,
  85,
  FALSE,
  ARRAY['production_order.read', 'production_orders.read']::text[],
  'any',
  ARRAY['WE', 'WELDING', 'PRESS', 'PD', 'PC']::text[],
  id
FROM auth.menus
WHERE code = 'production_root'
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  sort_order = EXCLUDED.sort_order,
  permission_codes = EXCLUDED.permission_codes,
  permission_match = EXCLUDED.permission_match,
  allowed_departments = EXCLUDED.allowed_departments,
  parent_id = EXCLUDED.parent_id,
  updated_at = now();
