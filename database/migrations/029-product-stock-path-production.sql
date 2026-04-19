-- ย้าย path ยอดคงเหลือสินค้าขายไปภายใต้ /production

UPDATE auth.menus
SET
  path = '/production/product-stock',
  updated_at = now()
WHERE code = 'pc_product_stock';
