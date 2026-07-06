-- Sales / Order Management — Phase 1 schema
-- ออเดอร์ขายสินค้า + รายการสินค้า + ประวัติสถานะ + การอนุมัติ
-- idempotent: ใช้ IF NOT EXISTS / ON CONFLICT ได้ตามแนวทาง run-sql-migrations

CREATE SCHEMA IF NOT EXISTS sales;

-- ออเดอร์ขาย (header)
CREATE TABLE IF NOT EXISTS sales.orders (
  id              BIGSERIAL PRIMARY KEY,
  order_no        VARCHAR(30) NOT NULL UNIQUE,
  customer_id     INT NOT NULL REFERENCES master.customers(id),
  sales_user_id   VARCHAR(64),
  status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  sales_channel   VARCHAR(50),
  order_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  required_date   DATE,
  delivery_date   DATE,
  subtotal        NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_total  NUMERIC(15,2) NOT NULL DEFAULT 0,
  grand_total     NUMERIC(15,2) NOT NULL DEFAULT 0,
  note            TEXT,
  source          VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
  create_date     TIMESTAMPTZ NOT NULL DEFAULT now(),
  create_by       VARCHAR(255),
  update_date     TIMESTAMPTZ NOT NULL DEFAULT now(),
  update_by       VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_status   ON sales.orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_dates    ON sales.orders(order_date, delivery_date);
CREATE INDEX IF NOT EXISTS idx_sales_orders_sales_user ON sales.orders(sales_user_id);

-- รายการสินค้าในออเดอร์
CREATE TABLE IF NOT EXISTS sales.order_items (
  id          BIGSERIAL PRIMARY KEY,
  order_id    BIGINT NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
  product_id  INT NOT NULL REFERENCES master.products(id),
  quantity    NUMERIC(15,4) NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  discount    NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  line_total  NUMERIC(15,2) NOT NULL DEFAULT 0,
  create_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_order_items_order   ON sales.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product ON sales.order_items(product_id);

-- ประวัติการเปลี่ยนสถานะ (timeline)
CREATE TABLE IF NOT EXISTS sales.order_status_history (
  id          BIGSERIAL PRIMARY KEY,
  order_id    BIGINT NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
  from_status VARCHAR(20),
  to_status   VARCHAR(20) NOT NULL,
  reason      TEXT,
  changed_by  VARCHAR(255),
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_status_history_order ON sales.order_status_history(order_id);

-- การอนุมัติออเดอร์ (Phase 2 จะใช้งานเต็ม แต่สร้างตารางไว้ล่วงหน้า)
CREATE TABLE IF NOT EXISTS sales.order_approvals (
  id          BIGSERIAL PRIMARY KEY,
  order_id    BIGINT NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
  decision    VARCHAR(10) NOT NULL,
  reason      TEXT,
  approver_id VARCHAR(64) NOT NULL,
  decided_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_approvals_order ON sales.order_approvals(order_id);
