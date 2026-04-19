-- ตาราง Production orders + lots + processes + tracking (ให้ตรง TypeORM entities)
-- รันหลังมีตาราง products (และ production_plans / production_plan_items ถ้าใช้ FK plan)
-- psql -U postgres -d cps_cci -f database/migrations/005-production-orders-schema.sql

CREATE TABLE IF NOT EXISTS production_processes (
  id SERIAL PRIMARY KEY,
  process_code varchar(50) NOT NULL,
  process_name varchar(255) NOT NULL,
  sequence_order integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

-- ถ้ามี production_orders รุ่นเก่า (ไม่มี plan columns) ให้เพิ่มก่อน FK — ไม่ต้องพึ่งลำดับรัน 004
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'production_orders'
  ) THEN
    ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS plan_id INTEGER;
    ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS plan_item_id INTEGER;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS production_orders (
  id SERIAL PRIMARY KEY,
  order_no varchar(255) NOT NULL UNIQUE,
  product_id integer NOT NULL,
  order_quantity numeric(15, 4) NOT NULL,
  lot_size numeric(15, 4) NOT NULL,
  total_lots integer NOT NULL,
  status varchar(255) NOT NULL DEFAULT 'DRAFT',
  remarks text,
  plan_id integer,
  plan_item_id integer,
  create_date TIMESTAMP NOT NULL DEFAULT now(),
  create_by varchar(255) NOT NULL,
  CONSTRAINT fk_production_orders_product
    FOREIGN KEY (product_id) REFERENCES products (id)
);

-- FK แผน (ชื่อ constraint เดียวกับ 004 — รัน 004 หลัง 005 ได้ หรือรันแค่ 005 ก็พอถ้ามี DO ด้านล่าง)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_production_orders_plan_id') THEN
    ALTER TABLE production_orders
      ADD CONSTRAINT fk_production_orders_plan_id
      FOREIGN KEY (plan_id) REFERENCES production_plans (id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_production_orders_plan_item_id') THEN
    ALTER TABLE production_orders
      ADD CONSTRAINT fk_production_orders_plan_item_id
      FOREIGN KEY (plan_item_id) REFERENCES production_plan_items (id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_production_orders_product_id ON production_orders (product_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_plan_id ON production_orders (plan_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_plan_item_id ON production_orders (plan_item_id);

CREATE TABLE IF NOT EXISTS production_lots (
  id SERIAL PRIMARY KEY,
  order_id integer NOT NULL,
  lot_no varchar(255) NOT NULL UNIQUE,
  qr_code varchar(255) NOT NULL UNIQUE,
  sequence_no integer NOT NULL,
  quantity numeric(15, 4) NOT NULL,
  current_process_id integer,
  status varchar(255) NOT NULL DEFAULT 'PENDING',
  create_date TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_production_lots_order
    FOREIGN KEY (order_id) REFERENCES production_orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_production_lots_current_process
    FOREIGN KEY (current_process_id) REFERENCES production_processes (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_production_lots_order_id ON production_lots (order_id);

CREATE TABLE IF NOT EXISTS production_lot_tracking (
  id SERIAL PRIMARY KEY,
  lot_id integer NOT NULL,
  process_id integer NOT NULL,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status varchar(255) NOT NULL,
  operator varchar(255),
  remarks text,
  create_date TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_lot_tracking_lot
    FOREIGN KEY (lot_id) REFERENCES production_lots (id) ON DELETE CASCADE,
  CONSTRAINT fk_lot_tracking_process
    FOREIGN KEY (process_id) REFERENCES production_processes (id)
);

CREATE INDEX IF NOT EXISTS idx_production_lot_tracking_lot_id ON production_lot_tracking (lot_id);
