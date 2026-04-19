-- Dynamic navigation menu sourced from auth schema

CREATE TABLE IF NOT EXISTS auth.menus (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  label VARCHAR(150) NOT NULL,
  path VARCHAR(255) NULL,
  icon_key VARCHAR(100) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_collapsible BOOLEAN NOT NULL DEFAULT FALSE,
  admin_only BOOLEAN NOT NULL DEFAULT FALSE,
  permission_codes TEXT[] NULL,
  permission_match VARCHAR(10) NOT NULL DEFAULT 'all',
  allowed_departments TEXT[] NULL,
  parent_id BIGINT NULL REFERENCES auth.menus(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_menus_parent_id ON auth.menus(parent_id);
CREATE INDEX IF NOT EXISTS idx_auth_menus_sort_order ON auth.menus(sort_order);
CREATE INDEX IF NOT EXISTS idx_auth_menus_is_active ON auth.menus(is_active);

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
  ('dashboard', 'Dashboard', '/', 'gauge', 10, FALSE, ARRAY['production_plans.read', 'production_orders.read'], 'any', NULL, NULL),
  ('users_mgmt', 'Users Management', NULL, 'users', 20, TRUE, NULL, 'all', NULL, NULL),
  ('pc_root', 'PC', NULL, 'boxes', 30, FALSE, ARRAY['production_plans.read', 'production_orders.read'], 'any', NULL, NULL),
  ('production_root', 'Production', NULL, 'industry', 40, FALSE, ARRAY['production_plans.read', 'production_orders.read'], 'any', NULL, NULL),
  ('master_data_root', 'Master Data', NULL, 'database', 50, TRUE, NULL, 'all', NULL, NULL)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  icon_key = EXCLUDED.icon_key,
  sort_order = EXCLUDED.sort_order,
  admin_only = EXCLUDED.admin_only,
  permission_codes = EXCLUDED.permission_codes,
  permission_match = EXCLUDED.permission_match,
  allowed_departments = EXCLUDED.allowed_departments,
  parent_id = EXCLUDED.parent_id,
  is_active = TRUE,
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
VALUES
  ('users_all', 'All Users', '/users', NULL, 10, TRUE, NULL, 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'users_mgmt')),
  ('users_add', 'Add User', '/users/add', NULL, 20, TRUE, NULL, 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'users_mgmt')),
  ('users_roles', 'User Roles', '/users/roles', NULL, 30, TRUE, NULL, 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'users_mgmt')),
  ('users_permissions', 'Permissions', '/users/permissions', NULL, 40, TRUE, NULL, 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'users_mgmt')),
  ('users_menus', 'Menus', '/users/menus', NULL, 50, TRUE, NULL, 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'users_mgmt')),

  ('pc_home', 'ข้อมูลวัตถุดิบ', '/pc', NULL, 10, FALSE, ARRAY['production_plans.read'], 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'pc_root')),
  ('pc_income', 'รายการรับเข้า', '/pc/income', NULL, 20, FALSE, ARRAY['production_plans.create'], 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'pc_root')),
  ('pc_outcome', 'รายการจ่ายออก', '/pc/outcome', NULL, 30, FALSE, ARRAY['production_plans.issue'], 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'pc_root')),
  ('pc_reservations', 'รายการจอง', '/pc/reservations', NULL, 40, FALSE, ARRAY['production_plans.reserve'], 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'pc_root')),
  ('pc_schedule_res', 'แผนผลิตที่จองสำเร็จแล้ว', '/pc/schedule/reservations', NULL, 50, FALSE, ARRAY['production_plans.read'], 'all', ARRAY['WE'], (SELECT id FROM auth.menus WHERE code = 'pc_root')),
  ('pc_tracking_scan', 'ติดตามสถานะการผลิตสินค้า', '/pc/production-step-scan', NULL, 60, FALSE, ARRAY['production_orders.read'], 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'pc_root')),
  ('pc_stock', 'Stock คงเหลือ', '/pc/stock', NULL, 70, FALSE, ARRAY['production_plans.read'], 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'pc_root')),
  ('pc_report', 'รายงาน', '/pc/report', NULL, 80, FALSE, ARRAY['production_plans.read'], 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'pc_root')),

  ('production_products', 'Products', '/production/products', NULL, 10, FALSE, ARRAY['production_orders.read'], 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'production_root')),
  ('production_orders', 'คำสั่งผลิต / QR', '/production/production-orders', NULL, 20, FALSE, ARRAY['production_orders.read'], 'all', ARRAY['WE'], (SELECT id FROM auth.menus WHERE code = 'production_root')),
  ('production_steps', 'ลำดับขั้นตอนผลิต', '/production/production-steps', NULL, 30, FALSE, ARRAY['production_orders.read'], 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'production_root')),
  ('production_schedule', 'จัดงานล่วงหน้า', '/pc/schedule', NULL, 40, FALSE, ARRAY['production_plans.read'], 'all', ARRAY['WE'], (SELECT id FROM auth.menus WHERE code = 'production_root')),
  ('production_tracking', 'ติดตามสถานะการผลิตสินค้า', '/pc/production-tracking', NULL, 50, FALSE, ARRAY['production_orders.read'], 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'production_root')),

  ('master_data_home', 'ภาพรวม Master Data', '/master-data', NULL, 10, TRUE, NULL, 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'master_data_root')),
  ('md_material_types', 'ประเภทวัตถุดิบ', '/master-data/material-types', NULL, 20, TRUE, NULL, 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'master_data_root')),
  ('md_locations', 'สถานที่เก็บ (วัตถุดิบ)', '/master-data/locations', NULL, 30, TRUE, NULL, 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'master_data_root')),
  ('md_suppliers', 'ผู้จัดจำหน่าย', '/master-data/suppliers', NULL, 40, TRUE, NULL, 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'master_data_root')),
  ('md_models', 'โมเดล', '/master-data/models', NULL, 50, TRUE, NULL, 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'master_data_root')),
  ('md_delivery_types', 'ประเภทการส่ง', '/master-data/delivery-types', NULL, 60, TRUE, NULL, 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'master_data_root')),
  ('md_units', 'หน่วย', '/master-data/units', NULL, 70, TRUE, NULL, 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'master_data_root')),
  ('md_loading_points', 'จุดขนถ่าย', '/master-data/loading-points', NULL, 80, TRUE, NULL, 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'master_data_root')),
  ('md_process_lines', 'สายการผลิต', '/master-data/process-lines', NULL, 90, TRUE, NULL, 'all', NULL, (SELECT id FROM auth.menus WHERE code = 'master_data_root'))
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  icon_key = EXCLUDED.icon_key,
  sort_order = EXCLUDED.sort_order,
  admin_only = EXCLUDED.admin_only,
  permission_codes = EXCLUDED.permission_codes,
  permission_match = EXCLUDED.permission_match,
  allowed_departments = EXCLUDED.allowed_departments,
  parent_id = EXCLUDED.parent_id,
  is_active = TRUE,
  updated_at = now();
