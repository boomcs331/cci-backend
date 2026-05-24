-- ล็อตสินค้าพร้อมขาย (FG) + การเคลื่อนไหวรับเข้า / จ่ายออก

CREATE TABLE IF NOT EXISTS public.product_fg_lots (
  id BIGSERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES master.products (id) ON DELETE RESTRICT,
  lot_no VARCHAR(80) NOT NULL UNIQUE,
  qr_code VARCHAR(120) NOT NULL UNIQUE,
  production_lot_id INTEGER NULL REFERENCES public.production_lots (id) ON DELETE SET NULL,
  production_order_no VARCHAR(50) NULL,
  quantity NUMERIC(15, 4) NOT NULL,
  remaining_quantity NUMERIC(15, 4) NOT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'PCS',
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
  source_type VARCHAR(30) NOT NULL DEFAULT 'PRODUCTION',
  create_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  create_by VARCHAR(255) NULL,
  CONSTRAINT product_fg_lots_status_chk CHECK (
    status IN ('AVAILABLE', 'PARTIAL_USED', 'USED_UP')
  )
);

CREATE INDEX IF NOT EXISTS idx_product_fg_lots_product_id
  ON public.product_fg_lots (product_id);
CREATE INDEX IF NOT EXISTS idx_product_fg_lots_production_lot_id
  ON public.product_fg_lots (production_lot_id);
CREATE INDEX IF NOT EXISTS idx_product_fg_lots_create_date
  ON public.product_fg_lots (create_date);

CREATE TABLE IF NOT EXISTS public.product_fg_lot_movements (
  id BIGSERIAL PRIMARY KEY,
  fg_lot_id BIGINT NOT NULL REFERENCES public.product_fg_lots (id) ON DELETE CASCADE,
  step_code VARCHAR(40) NOT NULL,
  step_name VARCHAR(120) NOT NULL,
  movement_type VARCHAR(30) NOT NULL,
  quantity_in NUMERIC(15, 4) NULL,
  quantity_out NUMERIC(15, 4) NULL,
  reference_no VARCHAR(100) NULL,
  sales_reservation_id BIGINT NULL REFERENCES public.product_sales_reservations (id) ON DELETE SET NULL,
  remarks TEXT NULL,
  movement_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  create_by VARCHAR(255) NULL
);

CREATE INDEX IF NOT EXISTS idx_product_fg_lot_movements_lot_id
  ON public.product_fg_lot_movements (fg_lot_id);
CREATE INDEX IF NOT EXISTS idx_product_fg_lot_movements_date
  ON public.product_fg_lot_movements (movement_date);

-- ย้อนหลัง: ล็อตผลิตที่ปิดงานแล้ว → ล็อต FG + รับเข้า
INSERT INTO public.product_fg_lots (
  product_id,
  lot_no,
  qr_code,
  production_lot_id,
  production_order_no,
  quantity,
  remaining_quantity,
  unit,
  status,
  source_type,
  create_date,
  create_by
)
SELECT
  o.product_id,
  'FG-' || l.lot_no,
  'FG-' || l.qr_code,
  l.id,
  o.order_no,
  l.quantity::numeric,
  l.quantity::numeric,
  'PCS',
  'AVAILABLE',
  'PRODUCTION',
  COALESCE(l.create_date, now()),
  'migration-062'
FROM public.production_lots l
INNER JOIN public.production_orders o ON o.id = l.order_id
WHERE UPPER(TRIM(BOTH FROM l.status)) = 'COMPLETED'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_fg_lots fg2
    WHERE fg2.production_lot_id = l.id
  );

INSERT INTO public.product_fg_lot_movements (
  fg_lot_id,
  step_code,
  step_name,
  movement_type,
  quantity_in,
  quantity_out,
  reference_no,
  movement_date,
  create_by
)
SELECT
  fg.id,
  'PRODUCTION_RECEIVE',
  'รับเข้าจากผลิต (ปิดงานล็อต)',
  'RECEIVE',
  fg.quantity,
  NULL,
  fg.production_order_no,
  fg.create_date,
  'migration-062'
FROM public.product_fg_lots fg
WHERE fg.source_type = 'PRODUCTION'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_fg_lot_movements m
    WHERE m.fg_lot_id = fg.id AND m.step_code = 'PRODUCTION_RECEIVE'
  );
