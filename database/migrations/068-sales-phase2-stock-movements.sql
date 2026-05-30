-- Phase 2: ประวัติการเคลื่อนไหวสต็อก + เมนูอนุมัติ

CREATE TABLE IF NOT EXISTS public.product_stock_movements (
  id            BIGSERIAL PRIMARY KEY,
  product_id    INT NOT NULL REFERENCES master.products(id),
  movement      VARCHAR(10) NOT NULL,
  quantity      NUMERIC(15,4) NOT NULL CHECK (quantity > 0),
  ref_type      VARCHAR(20),
  ref_id        BIGINT,
  balance_after NUMERIC(15,4),
  note          TEXT,
  create_by     VARCHAR(255),
  create_date   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_mv_product_date
  ON public.product_stock_movements(product_id, create_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_mv_ref
  ON public.product_stock_movements(ref_type, ref_id);

INSERT INTO auth.menus (
  code, label, path, icon_key, sort_order, admin_only,
  permission_codes, permission_match, allowed_departments, parent_id
)
VALUES
  ('sales_approvals', 'รออนุมัติออเดอร์', '/sales/approvals', NULL, 20, FALSE,
   ARRAY['sales_order.approve']::text[], 'all', NULL,
   (SELECT id FROM auth.menus WHERE code = 'sales_root'))
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label, path = EXCLUDED.path, sort_order = EXCLUDED.sort_order,
    permission_codes = EXCLUDED.permission_codes, permission_match = EXCLUDED.permission_match,
    parent_id = EXCLUDED.parent_id, is_active = TRUE, updated_at = now();
