-- Phase 3: Excel Import - import_batches และ import_rows

CREATE TABLE IF NOT EXISTS sales.import_batches (
  id              BIGSERIAL PRIMARY KEY,
  batch_code      VARCHAR(50) UNIQUE NOT NULL,
  file_name       VARCHAR(255) NOT NULL,
  uploaded_by     INT NOT NULL REFERENCES auth.users(id),
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, VALIDATED, COMMITTED, FAILED
  total_rows      INT NOT NULL DEFAULT 0,
  valid_rows      INT NOT NULL DEFAULT 0,
  error_rows      INT NOT NULL DEFAULT 0,
  committed_rows  INT NOT NULL DEFAULT 0,
  error_summary   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  committed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_import_batches_status ON sales.import_batches(status);
CREATE INDEX IF NOT EXISTS idx_import_batches_user ON sales.import_batches(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_import_batches_date ON sales.import_batches(created_at DESC);

CREATE TABLE IF NOT EXISTS sales.import_rows (
  id              BIGSERIAL PRIMARY KEY,
  batch_id        BIGINT NOT NULL REFERENCES sales.import_batches(id) ON DELETE CASCADE,
  row_number      INT NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, VALID, ERROR, COMMITTED
  
  -- ข้อมูลจาก Excel
  order_group     VARCHAR(50),
  customer_code   VARCHAR(50),
  product_code    VARCHAR(50),
  quantity        NUMERIC(15,4),
  unit_price      NUMERIC(15,4),
  discount        NUMERIC(15,4),
  required_date   DATE,
  delivery_date   DATE,
  sales_channel   VARCHAR(50),
  note            TEXT,
  
  -- Validation results
  error_code      VARCHAR(50),
  error_message   TEXT,
  
  -- Reference ไปยัง order ที่สร้าง (หลัง commit)
  order_id        BIGINT REFERENCES sales.orders(id),
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_rows_batch ON sales.import_rows(batch_id);
CREATE INDEX IF NOT EXISTS idx_import_rows_status ON sales.import_rows(status);
CREATE INDEX IF NOT EXISTS idx_import_rows_order ON sales.import_rows(order_id);

-- เมนู Import
INSERT INTO auth.menus (
  code, label, path, icon_key, sort_order, admin_only,
  permission_codes, permission_match, allowed_departments, parent_id
)
VALUES
  ('sales_import', 'นำเข้าออเดอร์ (Excel)', '/sales/import', NULL, 60, FALSE,
   ARRAY['sales_order.import']::text[], 'all', NULL,
   (SELECT id FROM auth.menus WHERE code = 'sales_root'))
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label, path = EXCLUDED.path, sort_order = EXCLUDED.sort_order,
    permission_codes = EXCLUDED.permission_codes, permission_match = EXCLUDED.permission_match,
    parent_id = EXCLUDED.parent_id, is_active = TRUE, updated_at = now();
