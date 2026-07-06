-- เมนู "ภาพรวม" สำหรับวัตถุดิบ (PC) และสินค้า (Production) แบบเดียวกับ Master Data

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
    'pc_overview',
    'ภาพรวมวัตถุดิบ',
    '/pc/overview',
    NULL,
    5,
    FALSE,
    ARRAY['production_plans.read', 'production_orders.read']::text[],
    'any',
    NULL,
    (SELECT id FROM auth.menus WHERE code = 'pc_root')
  ),
  (
    'production_overview',
    'ภาพรวมสินค้า',
    '/production/overview',
    NULL,
    5,
    FALSE,
    ARRAY['production_plans.read', 'production_orders.read']::text[],
    'any',
    NULL,
    (SELECT id FROM auth.menus WHERE code = 'production_root')
  )
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  sort_order = EXCLUDED.sort_order,
  permission_codes = EXCLUDED.permission_codes,
  permission_match = EXCLUDED.permission_match,
  parent_id = EXCLUDED.parent_id,
  updated_at = now();
