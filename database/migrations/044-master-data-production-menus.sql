-- เมนู Master Production ภายใต้ Master Data (sidebar)

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
    'md_production_processes',
    'กระบวนการผลิต',
    '/master-data/production-processes',
    NULL,
    95,
    TRUE,
    NULL,
    'all',
    NULL,
    (SELECT id FROM auth.menus WHERE code = 'master_data_root')
  ),
  (
    'md_production_steps',
    'ลำดับขั้นตอนผลิต (สินค้า)',
    '/master-data/production-steps',
    NULL,
    96,
    TRUE,
    NULL,
    'all',
    NULL,
    (SELECT id FROM auth.menus WHERE code = 'master_data_root')
  ),
  (
    'md_product_production_steps',
    'ขั้นตอนผลิตต่อสินค้า',
    '/master-data/product-production-steps',
    NULL,
    97,
    TRUE,
    NULL,
    'all',
    NULL,
    (SELECT id FROM auth.menus WHERE code = 'master_data_root')
  )
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  sort_order = EXCLUDED.sort_order,
  admin_only = EXCLUDED.admin_only,
  permission_codes = EXCLUDED.permission_codes,
  permission_match = EXCLUDED.permission_match,
  allowed_departments = EXCLUDED.allowed_departments,
  parent_id = EXCLUDED.parent_id,
  is_active = TRUE,
  updated_at = now();
