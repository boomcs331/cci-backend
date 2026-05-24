-- สิทธิ์ Production + Stock แบบ resource.action (module production / stock)
-- รองรับ API เดิมผ่าน permission-expand

INSERT INTO auth.permissions (code, name, description, module)
VALUES
  -- production_order (คำสั่งผลิต / QR)
  ('production_order.create', 'คำสั่งผลิต - สร้าง', 'สร้างคำสั่งผลิต', 'production'),
  ('production_order.read', 'คำสั่งผลิต - ดู', 'ดูคำสั่งผลิต / QR', 'production'),
  ('production_order.update', 'คำสั่งผลิต - ดำเนินการ', 'เริ่ม/ปิดขั้น / split / advance', 'production'),
  ('production_order.delete', 'คำสั่งผลิต - ลบ', 'ลบคำสั่งผลิต', 'production'),
  ('production_order.manage', 'คำสั่งผลิต - จัดการระบบ', 'ตั้งค่า / บำรุงรักษา', 'production'),

  ('production_step.create', 'ขั้นตอนผลิต - สร้าง', 'กำหนดลำดับขั้นตอน', 'production'),
  ('production_step.read', 'ขั้นตอนผลิต - ดู', 'ดูขั้นตอน / flow', 'production'),
  ('production_step.update', 'ขั้นตอนผลิต - ดำเนินการ', 'สแกน QR แผนก / ปิดขั้น', 'production'),
  ('production_step.delete', 'ขั้นตอนผลิต - ลบ', 'ลบขั้นตอน', 'production'),
  ('production_step.manage', 'ขั้นตอนผลิต - จัดการระบบ', 'จัดการ master ขั้นตอน', 'production'),

  ('production_lot.create', 'ล็อตผลิต - สร้าง', 'สร้างล็อต / QR', 'production'),
  ('production_lot.read', 'ล็อตผลิต - ดู', 'ดูล็อตและสถานะ', 'production'),
  ('production_lot.update', 'ล็อตผลิต - ดำเนินการ', 'split / ย้ายขั้น', 'production'),
  ('production_lot.delete', 'ล็อตผลิต - ลบ', 'ลบล็อต', 'production'),
  ('production_lot.manage', 'ล็อตผลิต - จัดการระบบ', 'งาน admin ล็อต', 'production'),

  ('production_product.create', 'สินค้า (Production) - สร้าง', 'เพิ่มสินค้าในโมดูล production', 'production'),
  ('production_product.read', 'สินค้า (Production) - ดู', 'ดูรายการสินค้า', 'production'),
  ('production_product.update', 'สินค้า (Production) - แก้ไข', 'แก้ไขสินค้า', 'production'),
  ('production_product.delete', 'สินค้า (Production) - ลบ', 'ลบสินค้า', 'production'),
  ('production_product.manage', 'สินค้า (Production) - จัดการระบบ', 'จัดการ master สินค้า', 'production'),

  -- stock
  ('product_stock.create', 'สต็อกสินค้า - สร้าง', 'เพิ่มยอดสต็อก FG', 'stock'),
  ('product_stock.read', 'สต็อกสินค้า - ดู', 'ดูยอดคงเหลือสินค้าขาย', 'stock'),
  ('product_stock.update', 'สต็อกสินค้า - แก้ไข', 'ปรับยอดสต็อก', 'stock'),
  ('product_stock.delete', 'สต็อกสินค้า - ลบ', 'ลบรายการสต็อก', 'stock'),
  ('product_stock.manage', 'สต็อกสินค้า - จัดการระบบ', 'บำรุงรักษาสต็อก', 'stock'),

  ('sales_reservation.create', 'จองขาย - สร้าง', 'สร้างการจองขาย', 'stock'),
  ('sales_reservation.read', 'จองขาย - ดู', 'ดูรายการจอง', 'stock'),
  ('sales_reservation.update', 'จองขาย - แก้ไข', 'แก้ไขการจอง', 'stock'),
  ('sales_reservation.delete', 'จองขาย - ลบ', 'ยกเลิกการจอง', 'stock'),
  ('sales_reservation.manage', 'จองขาย - จัดการระบบ', 'จัดการจองขาย', 'stock'),

  ('stock_overview.read', 'ภาพรวมสต็อก - ดู', 'ดูภาพรวมยอดคงเหลือ', 'stock'),
  ('stock_alert.read', 'แจ้งเตือนสต็อก - ดู', 'ดูแจ้งเตือนสต็อกต่ำ', 'stock')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, module = EXCLUDED.module, updated_at = now();

-- DEPT_ADMIN: production + stock ครบ
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.module IN ('production', 'stock')
WHERE r.code = 'DEPT_ADMIN'
ON CONFLICT DO NOTHING;

-- DEPT_STAFF: อ่าน + ดำเนินการล็อต/ขั้นตอน (floor)
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.code IN (
  'production_order.read',
  'production_step.read',
  'production_lot.read',
  'production_product.read',
  'production_order.update',
  'production_step.update',
  'production_lot.update',
  'product_stock.read',
  'stock_overview.read'
)
WHERE r.code = 'DEPT_STAFF'
ON CONFLICT DO NOTHING;

-- ADMIN_GLOBAL: สิทธิ์ใหม่ทั้งหมด
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.module IN ('production', 'stock')
WHERE r.code = 'ADMIN_GLOBAL'
ON CONFLICT DO NOTHING;

-- เมนู Production
UPDATE auth.menus
SET
  permission_codes = ARRAY[
    'production_order.read',
    'production_step.read',
    'production_product.read'
  ]::text[],
  permission_match = 'any',
  updated_at = now()
WHERE code = 'production_root';

UPDATE auth.menus
SET permission_codes = ARRAY['production_order.read']::text[], permission_match = 'all', updated_at = now()
WHERE code = 'production_orders';

UPDATE auth.menus
SET permission_codes = ARRAY['production_step.read']::text[], permission_match = 'all', updated_at = now()
WHERE code = 'production_steps';

UPDATE auth.menus
SET
  permission_codes = ARRAY[
    'production_step.read',
    'production_step.update',
    'production_order.update',
    'production_lot.update'
  ]::text[],
  permission_match = 'any',
  updated_at = now()
WHERE code = 'production_dept_step_scan';

UPDATE auth.menus
SET permission_codes = ARRAY['production_product.read']::text[], permission_match = 'all', updated_at = now()
WHERE code = 'production_products';

UPDATE auth.menus
SET permission_codes = ARRAY['production_order.read']::text[], permission_match = 'all', updated_at = now()
WHERE code IN ('production_tracking', 'pc_tracking_scan');

-- เมนู Stock
UPDATE auth.menus
SET
  permission_codes = ARRAY['product_stock.read', 'stock_overview.read']::text[],
  permission_match = 'any',
  updated_at = now()
WHERE code = 'stock_balance_root';

UPDATE auth.menus
SET permission_codes = ARRAY['product_stock.read']::text[], permission_match = 'all', updated_at = now()
WHERE code IN ('pc_stock', 'pc_product_stock');

UPDATE auth.menus
SET permission_codes = ARRAY['stock_overview.read']::text[], permission_match = 'all', updated_at = now()
WHERE code = 'stock_balance_overview';

UPDATE auth.menus
SET
  permission_codes = ARRAY['sales_reservation.read', 'sales_reservation.create']::text[],
  permission_match = 'any',
  updated_at = now()
WHERE code = 'pc_sales_reservations';

-- pc_stock เดิมใช้ production_plans.manage — ย้ายเป็น product_stock
UPDATE auth.menus
SET permission_codes = ARRAY['product_stock.read']::text[], permission_match = 'all', updated_at = now()
WHERE code = 'pc_stock' AND parent_id IS NOT NULL;
