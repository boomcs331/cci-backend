-- Finished goods stock (mirror materials_stock) + sales reservations (mirror material_reservations pattern)

CREATE TABLE IF NOT EXISTS master.products_stock (
  product_id INTEGER PRIMARY KEY REFERENCES master.products (id) ON DELETE CASCADE,
  total_qty NUMERIC(15, 4) NOT NULL DEFAULT 0,
  available_qty NUMERIC(15, 4) NOT NULL DEFAULT 0,
  reserved_qty NUMERIC(15, 4) NOT NULL DEFAULT 0,
  update_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_sales_reservations (
  id BIGSERIAL PRIMARY KEY,
  reference_no VARCHAR(100) NOT NULL,
  product_id INTEGER NOT NULL REFERENCES master.products (id) ON DELETE RESTRICT,
  reserved_quantity NUMERIC(15, 4) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  create_by VARCHAR(255),
  create_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT product_sales_reservations_status_chk CHECK (
    status IN ('ACTIVE', 'RELEASED', 'FULFILLED')
  )
);

CREATE INDEX IF NOT EXISTS idx_product_sales_reservations_product_id
  ON public.product_sales_reservations (product_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_reservations_status
  ON public.product_sales_reservations (status);

INSERT INTO master.products_stock (product_id, total_qty, available_qty, reserved_qty)
SELECT id, 0, 0, 0 FROM master.products
ON CONFLICT (product_id) DO NOTHING;

UPDATE master.products_stock ps
SET
  total_qty = COALESCE(sub.sum_q, 0),
  available_qty = GREATEST(
    COALESCE(sub.sum_q, 0) - ps.reserved_qty,
    0
  ),
  update_date = now()
FROM (
  SELECT o.product_id, SUM(l.quantity::numeric) AS sum_q
  FROM production_lots l
  INNER JOIN production_orders o ON o.id = l.order_id
  WHERE UPPER(TRIM(BOTH FROM l.status)) = 'COMPLETED'
  GROUP BY o.product_id
) sub
WHERE ps.product_id = sub.product_id;

INSERT INTO auth.permissions (code, name, description, module)
VALUES
  (
    'products.stock.read',
    'Read product (FG) stock',
    'View finished goods stock levels',
    'products'
  ),
  (
    'products.sales.reserve',
    'Reserve products for sale',
    'Create, release, or fulfill sales reservations',
    'products'
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  module = EXCLUDED.module,
  updated_at = now();

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.code IN ('products.stock.read', 'products.sales.reserve')
WHERE r.code = 'ADMIN_GLOBAL'
ON CONFLICT DO NOTHING;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.code IN ('products.stock.read', 'products.sales.reserve')
WHERE r.code = 'DEPT_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.code IN ('products.stock.read')
WHERE r.code = 'DEPT_STAFF'
ON CONFLICT DO NOTHING;

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
SELECT
  'pc_product_stock',
  'Stock สินค้าผลิต',
  '/pc/product-stock',
  NULL,
  65,
  FALSE,
  ARRAY['products.stock.read']::text[],
  'all',
  NULL,
  id
FROM auth.menus
WHERE code = 'pc_root'
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  sort_order = EXCLUDED.sort_order,
  permission_codes = EXCLUDED.permission_codes,
  permission_match = EXCLUDED.permission_match,
  parent_id = EXCLUDED.parent_id,
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
SELECT
  'pc_sales_reservations',
  'จองสินค้าเพื่อขาย',
  '/pc/sales-reservations',
  NULL,
  66,
  FALSE,
  ARRAY['products.sales.reserve']::text[],
  'all',
  NULL,
  id
FROM auth.menus
WHERE code = 'pc_root'
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  sort_order = EXCLUDED.sort_order,
  permission_codes = EXCLUDED.permission_codes,
  permission_match = EXCLUDED.permission_match,
  parent_id = EXCLUDED.parent_id,
  updated_at = now();
