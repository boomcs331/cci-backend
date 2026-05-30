-- เมนู Sales Planning (แผนการขาย)
-- parent: sales_root ; children: sales_planning_import, sales_planning_data

INSERT INTO auth.menus (
  code, label, path, icon_key, sort_order, admin_only,
  permission_codes, permission_match, allowed_departments, parent_id
)
VALUES
  ('sales_planning', 'แผนการขาย', NULL, 'database', 20, FALSE,
   ARRAY['sales_planning.read']::text[], 'any', NULL,
   (SELECT id FROM auth.menus WHERE code = 'sales_root'))
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label, path = EXCLUDED.path, icon_key = EXCLUDED.icon_key,
    sort_order = EXCLUDED.sort_order, admin_only = EXCLUDED.admin_only,
    permission_codes = EXCLUDED.permission_codes, permission_match = EXCLUDED.permission_match,
    allowed_departments = EXCLUDED.allowed_departments, parent_id = EXCLUDED.parent_id,
    is_active = TRUE, updated_at = now();

INSERT INTO auth.menus (
  code, label, path, icon_key, sort_order, admin_only,
  permission_codes, permission_match, allowed_departments, parent_id
)
VALUES
  ('sales_planning_import', 'นำเข้าแผนการขาย', '/sales-planning/import', NULL, 10, FALSE,
   ARRAY['sales_planning.import']::text[], 'all', NULL,
   (SELECT id FROM auth.menus WHERE code = 'sales_planning'))
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label, path = EXCLUDED.path, icon_key = EXCLUDED.icon_key,
    sort_order = EXCLUDED.sort_order, admin_only = EXCLUDED.admin_only,
    permission_codes = EXCLUDED.permission_codes, permission_match = EXCLUDED.permission_match,
    allowed_departments = EXCLUDED.allowed_departments, parent_id = EXCLUDED.parent_id,
    is_active = TRUE, updated_at = now();

INSERT INTO auth.menus (
  code, label, path, icon_key, sort_order, admin_only,
  permission_codes, permission_match, allowed_departments, parent_id
)
VALUES
  ('sales_planning_data', 'ข้อมูลแผนการขาย', '/sales-planning/data', NULL, 20, FALSE,
   ARRAY['sales_planning.read']::text[], 'all', NULL,
   (SELECT id FROM auth.menus WHERE code = 'sales_planning'))
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label, path = EXCLUDED.path, icon_key = EXCLUDED.icon_key,
    sort_order = EXCLUDED.sort_order, admin_only = EXCLUDED.admin_only,
    permission_codes = EXCLUDED.permission_codes, permission_match = EXCLUDED.permission_match,
    allowed_departments = EXCLUDED.allowed_departments, parent_id = EXCLUDED.parent_id,
    is_active = TRUE, updated_at = now();
