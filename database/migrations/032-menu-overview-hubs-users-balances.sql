-- ภาพรวมเมนูย่อยแบบ Master Data: Users + ยอดคงเหลือ

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
VALUES
  (
    'users_overview',
    'ภาพรวมผู้ใช้',
    '/users/overview',
    NULL,
    5,
    TRUE,
    NULL,
    'all',
    NULL,
    (SELECT id FROM auth.menus WHERE code = 'users_mgmt')
  ),
  (
    'stock_balance_overview',
    'ภาพรวมยอดคงเหลือ',
    '/balances/overview',
    NULL,
    5,
    FALSE,
    ARRAY['production_plans.read', 'products.stock.read']::text[],
    'any',
    NULL,
    (SELECT id FROM auth.menus WHERE code = 'stock_balance_root')
  )
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  sort_order = EXCLUDED.sort_order,
  admin_only = EXCLUDED.admin_only,
  permission_codes = EXCLUDED.permission_codes,
  permission_match = EXCLUDED.permission_match,
  parent_id = EXCLUDED.parent_id,
  updated_at = now();

-- จัดลำดับเมนูย่อยยอดคงเหลือให้ภาพรวมอยู่ก่อน แล้วตามด้วยวัตถุดิบ / สินค้า
UPDATE auth.menus SET sort_order = 10, updated_at = now() WHERE code = 'pc_stock';
UPDATE auth.menus SET sort_order = 20, updated_at = now() WHERE code = 'pc_product_stock';
