-- สิทธิ์ Sales (module = 'sales') แบบ resource.action + roles + ผูกเมนู
-- resource: sales_order, sales_customer, sales_product, inventory
-- actions: create/read/update/delete/manage + extended approve/import/export

INSERT INTO auth.permissions (code, name, description, module)
VALUES
  ('sales_order.create', 'ออเดอร์ขาย - สร้าง', 'สร้างออเดอร์ขาย', 'sales'),
  ('sales_order.read', 'ออเดอร์ขาย - ดู', 'ดูรายการ/รายละเอียดออเดอร์', 'sales'),
  ('sales_order.update', 'ออเดอร์ขาย - แก้ไข', 'แก้ไข/เลื่อนสถานะออเดอร์', 'sales'),
  ('sales_order.delete', 'ออเดอร์ขาย - ลบ', 'ลบออเดอร์ (draft)', 'sales'),
  ('sales_order.manage', 'ออเดอร์ขาย - จัดการระบบ', 'งานดูแลระบบออเดอร์', 'sales'),
  ('sales_order.approve', 'ออเดอร์ขาย - อนุมัติ', 'อนุมัติ/ปฏิเสธออเดอร์', 'sales'),
  ('sales_order.import', 'ออเดอร์ขาย - นำเข้า', 'นำเข้าออเดอร์จาก Excel', 'sales'),
  ('sales_order.export', 'ออเดอร์ขาย - ส่งออก', 'ส่งออก Excel/PDF', 'sales'),

  ('sales_customer.create', 'ลูกค้า (ขาย) - สร้าง', 'เพิ่มลูกค้า', 'sales'),
  ('sales_customer.read', 'ลูกค้า (ขาย) - ดู', 'ดูข้อมูลลูกค้า', 'sales'),
  ('sales_customer.update', 'ลูกค้า (ขาย) - แก้ไข', 'แก้ไขลูกค้า', 'sales'),
  ('sales_customer.delete', 'ลูกค้า (ขาย) - ลบ', 'ลบลูกค้า', 'sales'),

  ('sales_product.create', 'สินค้า (ขาย) - สร้าง', 'เพิ่มสินค้าฝั่งขาย', 'sales'),
  ('sales_product.read', 'สินค้า (ขาย) - ดู', 'ดูสินค้าสำหรับขาย', 'sales'),
  ('sales_product.update', 'สินค้า (ขาย) - แก้ไข', 'แก้ไขสินค้าฝั่งขาย', 'sales'),
  ('sales_product.delete', 'สินค้า (ขาย) - ลบ', 'ลบสินค้าฝั่งขาย', 'sales'),

  ('inventory.read', 'คลังสินค้า - ดู', 'ดูสต็อก/การเคลื่อนไหว', 'sales'),
  ('inventory.update', 'คลังสินค้า - ปรับ', 'Stock In/Out / ปรับยอด', 'sales'),
  ('inventory.manage', 'คลังสินค้า - จัดการระบบ', 'งานดูแลคลัง', 'sales')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, module = EXCLUDED.module, updated_at = now();

-- Roles ฝั่งขาย
INSERT INTO auth.roles (code, name, description, is_system, scope_type)
VALUES
  ('SALES_STAFF', 'Sales', 'พนักงานขาย — สร้าง/แก้ไขออเดอร์ของตน + ดูสินค้า/ลูกค้า', TRUE, 'GLOBAL'),
  ('SALES_MANAGER', 'Sales Manager', 'หัวหน้าขาย — อนุมัติออเดอร์ + ส่งออก + รายงาน', TRUE, 'GLOBAL'),
  ('WAREHOUSE', 'Warehouse', 'คลังสินค้า — จัดการสต็อก + เลื่อนสถานะจัดส่ง', TRUE, 'GLOBAL')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, updated_at = now();

-- ล้างสิทธิ์เดิมของ sales roles แล้วใส่ชุดใหม่ (กันค้างจากการรันซ้ำ)
DELETE FROM auth.role_permissions rp
USING auth.roles r
WHERE rp.role_id = r.id
  AND r.code IN ('SALES_STAFF', 'SALES_MANAGER', 'WAREHOUSE')
  AND rp.permission_id IN (SELECT id FROM auth.permissions WHERE module = 'sales');

-- SALES_STAFF
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.code IN (
  'sales_order.create',
  'sales_order.read',
  'sales_order.update',
  'sales_customer.read',
  'sales_product.read'
)
WHERE r.code = 'SALES_STAFF'
ON CONFLICT DO NOTHING;

-- SALES_MANAGER — ของ Sales + อนุมัติ/ส่งออก/นำเข้า + จัดการลูกค้า
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.code IN (
  'sales_order.create',
  'sales_order.read',
  'sales_order.update',
  'sales_order.approve',
  'sales_order.import',
  'sales_order.export',
  'sales_customer.create',
  'sales_customer.read',
  'sales_customer.update',
  'sales_product.read',
  'inventory.read'
)
WHERE r.code = 'SALES_MANAGER'
ON CONFLICT DO NOTHING;

-- WAREHOUSE — ดู/เลื่อนสถานะออเดอร์ + จัดการคลัง
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.code IN (
  'sales_order.read',
  'sales_order.update',
  'sales_product.read',
  'inventory.read',
  'inventory.update',
  'inventory.manage'
)
WHERE r.code = 'WAREHOUSE'
ON CONFLICT DO NOTHING;

-- ADMIN_GLOBAL — สิทธิ์ sales ทั้งหมด
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.module = 'sales'
WHERE r.code = 'ADMIN_GLOBAL'
ON CONFLICT DO NOTHING;
