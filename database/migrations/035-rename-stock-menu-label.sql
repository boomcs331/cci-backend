-- Rename main navigation group label ยอดคงเหลือ -> Stock (matches sidebar ordering label)

UPDATE auth.menus
SET
  label = 'Stock',
  updated_at = now()
WHERE code = 'stock_balance_root';
