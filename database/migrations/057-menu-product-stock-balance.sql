-- เมนู "ยอดคงเหลือ สินค้า" (สต็อกสินค้าขาย FG) ภายใต้กลุ่ม Stock
-- แยกสิทธิ์เมนูวัตถุดิบ (pc_stock) กับสินค้า (pc_product_stock)

INSERT INTO auth.menus (
  code,
  label,
  path,
  icon_key,
  sort_order,
  is_active,
  is_collapsible,
  admin_only,
  permission_codes,
  permission_match,
  allowed_departments,
  parent_id
)
VALUES (
  'pc_product_stock',
  'ยอดคงเหลือ สินค้า',
  '/production/product-stock',
  NULL,
  20,
  TRUE,
  FALSE,
  FALSE,
  ARRAY['product_stock.read']::text[],
  'all',
  NULL,
  (SELECT id FROM auth.menus WHERE code = 'stock_balance_root')
)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE,
  admin_only = EXCLUDED.admin_only,
  permission_codes = EXCLUDED.permission_codes,
  permission_match = EXCLUDED.permission_match,
  parent_id = EXCLUDED.parent_id,
  updated_at = now();

-- วัตถุดิบ: ใช้ material.read (ไม่ใช่ product_stock)
UPDATE auth.menus
SET
  label = 'ยอดคงเหลือ วัตถุดิบ',
  path = '/pc/stock',
  permission_codes = ARRAY['material.read']::text[],
  permission_match = 'all',
  parent_id = (SELECT id FROM auth.menus WHERE code = 'stock_balance_root'),
  sort_order = 10,
  is_active = TRUE,
  updated_at = now()
WHERE code = 'pc_stock';

-- กลุ่ม Stock แสดงเมื่อมีสิทธิ์ดูสต็อกสินค้าหรือวัตถุดิบ
UPDATE auth.menus
SET
  permission_codes = ARRAY[
    'product_stock.read',
    'material.read',
    'stock_overview.read'
  ]::text[],
  permission_match = 'any',
  is_active = TRUE,
  updated_at = now()
WHERE code = 'stock_balance_root';
