-- ย้าย path จองสินค้าเพื่อขายไปภายใต้ /production และจัดกลุ่มเมนูภายใต้ Production

UPDATE auth.menus
SET
  path = '/production/sales-reservations',
  parent_id = (SELECT id FROM auth.menus WHERE code = 'production_root'),
  sort_order = 25,
  updated_at = now()
WHERE code = 'pc_sales_reservations';
