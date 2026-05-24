-- เมนูรายงานสอบกลับล็อตสินค้าพร้อมขาย (FG)

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
  'fg_lot_trace_report',
  'สอบกลับล็อต FG (รับเข้า-จ่ายออก)',
  '/production/fg-lot-trace-report',
  NULL,
  25,
  FALSE,
  ARRAY['product_stock.read', 'products.stock.read']::text[],
  'any',
  NULL,
  id
FROM auth.menus
WHERE code = 'stock_balance_root'
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  sort_order = EXCLUDED.sort_order,
  permission_codes = EXCLUDED.permission_codes,
  permission_match = EXCLUDED.permission_match,
  parent_id = EXCLUDED.parent_id,
  updated_at = now();
