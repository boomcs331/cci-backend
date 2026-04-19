-- เมนูหลัก "Stock" (แยกจาก PC) + เมนูย่อย: วัตถุดิบ / สินค้าขาย

INSERT INTO auth.menus (
  code,
  label,
  path,
  icon_key,
  sort_order,
  is_collapsible,
  admin_only,
  permission_codes,
  permission_match,
  allowed_departments,
  parent_id
)
VALUES (
  'stock_balance_root',
  'Stock',
  NULL,
  'warehouse',
  32,
  TRUE,
  FALSE,
  ARRAY['production_plans.read', 'products.stock.read']::text[],
  'any',
  NULL,
  NULL
)
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  icon_key = EXCLUDED.icon_key,
  sort_order = EXCLUDED.sort_order,
  is_collapsible = EXCLUDED.is_collapsible,
  admin_only = EXCLUDED.admin_only,
  permission_codes = EXCLUDED.permission_codes,
  permission_match = EXCLUDED.permission_match,
  allowed_departments = EXCLUDED.allowed_departments,
  parent_id = EXCLUDED.parent_id,
  updated_at = now();

UPDATE auth.menus
SET
  parent_id = (SELECT id FROM auth.menus WHERE code = 'stock_balance_root'),
  label = 'ยอดคงเหลือ วัตถุดิบ',
  sort_order = 10,
  updated_at = now()
WHERE code = 'pc_stock';

UPDATE auth.menus
SET
  parent_id = (SELECT id FROM auth.menus WHERE code = 'stock_balance_root'),
  label = 'ยอดคงเหลือ สินค้าขาย',
  sort_order = 20,
  updated_at = now()
WHERE code = 'pc_product_stock';
