-- สิทธิ์ PC แบบ resource.action (ครบ 20 รายการ) + ผูก Role / เมนู
-- รองรับ API เดิมผ่าน permission-expand (inbound.* → production_plans.*)

INSERT INTO auth.permissions (code, name, description, module)
VALUES
  ('inbound.create', 'รับเข้า - สร้าง', 'สร้างรายการรับเข้าวัตถุดิบ', 'pc'),
  ('inbound.read', 'รับเข้า - ดู', 'ดูรายการรับเข้า', 'pc'),
  ('inbound.update', 'รับเข้า - แก้ไข', 'แก้ไขรายการรับเข้า', 'pc'),
  ('inbound.delete', 'รับเข้า - ลบ', 'ลบรายการรับเข้า', 'pc'),

  ('outbound.create', 'จ่ายออก - สร้าง', 'สร้างรายการจ่ายออก', 'pc'),
  ('outbound.read', 'จ่ายออก - ดู', 'ดูรายการจ่ายออก', 'pc'),
  ('outbound.update', 'จ่ายออก - แก้ไข', 'แก้ไขรายการจ่ายออก', 'pc'),
  ('outbound.delete', 'จ่ายออก - ลบ', 'ลบรายการจ่ายออก', 'pc'),

  ('material.create', 'วัตถุดิบ - สร้าง', 'จัดการข้อมูลวัตถุดิบ (สร้าง)', 'pc'),
  ('material.read', 'วัตถุดิบ - ดู', 'ดูข้อมูลวัตถุดิบ', 'pc'),
  ('material.update', 'วัตถุดิบ - แก้ไข', 'แก้ไขข้อมูลวัตถุดิบ', 'pc'),
  ('material.delete', 'วัตถุดิบ - ลบ', 'ลบข้อมูลวัตถุดิบ', 'pc'),

  ('production_plan.create', 'แผนจองสำเร็จ - สร้าง', 'สร้าง/ดำเนินการแผนที่จองสำเร็จ', 'pc'),
  ('production_plan.read', 'แผนจองสำเร็จ - ดู', 'ดูแผนผลิตที่จองสำเร็จแล้ว', 'pc'),
  ('production_plan.update', 'แผนจองสำเร็จ - แก้ไข', 'แก้ไขแผนที่จองสำเร็จ', 'pc'),
  ('production_plan.delete', 'แผนจองสำเร็จ - ลบ', 'ลบแผนที่จองสำเร็จ', 'pc'),

  ('report.create', 'รายงาน - สร้าง', 'สร้างรายงาน PC', 'pc'),
  ('report.read', 'รายงาน - ดู', 'ดูรายงาน PC', 'pc'),
  ('report.update', 'รายงาน - แก้ไข', 'แก้ไขรายงาน PC', 'pc'),
  ('report.delete', 'รายงาน - ลบ', 'ลบรายงาน PC', 'pc')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  module = EXCLUDED.module,
  updated_at = now();

-- ล้างสิทธิ์เก่าของ PC roles แล้วใส่ชุดใหม่
DELETE FROM auth.role_permissions rp
USING auth.roles r
WHERE rp.role_id = r.id
  AND r.code IN ('PC_STAFF', 'PC_ADMIN');

-- PC_STAFF
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.code IN (
  'inbound.create',
  'inbound.read',
  'outbound.create',
  'outbound.read',
  'material.read',
  'production_plan.create',
  'production_plan.read',
  'production_plan.update',
  'report.read'
)
WHERE r.code = 'PC_STAFF'
ON CONFLICT DO NOTHING;

-- PC_ADMIN — CRUD ครบทุก resource PC + legacy งานพิเศษ (จอง/อนุมัติ/ระบบ)
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.module = 'pc'
WHERE r.code = 'PC_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.code IN (
  'production_plans.reserve',
  'production_plans.generate_orders',
  'production_plans.approve',
  'production_plans.cancel',
  'production_plans.manage'
)
WHERE r.code = 'PC_ADMIN'
ON CONFLICT DO NOTHING;

-- เมนู PC ใช้สิทธิ์ resource.action
UPDATE auth.menus
SET
  permission_codes = ARRAY['material.read']::text[],
  permission_match = 'all',
  allowed_departments = ARRAY['WE', 'PC', 'PD']::text[],
  updated_at = now()
WHERE code = 'pc_home';

UPDATE auth.menus
SET
  permission_codes = ARRAY['inbound.read', 'inbound.create']::text[],
  permission_match = 'any',
  allowed_departments = ARRAY['WE', 'PC', 'PD']::text[],
  updated_at = now()
WHERE code = 'pc_income';

UPDATE auth.menus
SET
  permission_codes = ARRAY['outbound.read', 'outbound.create']::text[],
  permission_match = 'any',
  allowed_departments = ARRAY['WE', 'PC', 'PD']::text[],
  updated_at = now()
WHERE code = 'pc_outcome';

UPDATE auth.menus
SET
  permission_codes = ARRAY[
    'production_plan.read',
    'production_plan.create',
    'production_plan.update'
  ]::text[],
  permission_match = 'any',
  allowed_departments = ARRAY['WE', 'PC', 'PD']::text[],
  updated_at = now()
WHERE code = 'pc_schedule_res';

UPDATE auth.menus
SET
  permission_codes = ARRAY['report.read']::text[],
  permission_match = 'all',
  allowed_departments = ARRAY['WE', 'PC', 'PD']::text[],
  updated_at = now()
WHERE code = 'pc_report';

UPDATE auth.menus
SET
  permission_codes = ARRAY[
    'material.read',
    'inbound.read',
    'inbound.create',
    'outbound.read',
    'outbound.create',
    'production_plan.read',
    'report.read'
  ]::text[],
  permission_match = 'any',
  allowed_departments = ARRAY['WE', 'PC', 'PD']::text[],
  updated_at = now()
WHERE code = 'pc_root';

UPDATE auth.menus
SET
  permission_codes = ARRAY['production_plans.reserve']::text[],
  permission_match = 'all',
  updated_at = now()
WHERE code = 'pc_reservations';

UPDATE auth.menus
SET
  permission_codes = ARRAY['production_plans.manage']::text[],
  permission_match = 'all',
  updated_at = now()
WHERE code = 'pc_stock';
