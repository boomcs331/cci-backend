-- ผูก production_orders กับแผนผลิต (plan_id, plan_item_id)
-- รันกับฐานข้อมูลที่แอปใช้ (เช่น cps_cci)

ALTER TABLE production_orders
  ADD COLUMN IF NOT EXISTS plan_id INTEGER;

ALTER TABLE production_orders
  ADD COLUMN IF NOT EXISTS plan_item_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_production_orders_plan_id'
  ) THEN
    ALTER TABLE production_orders
      ADD CONSTRAINT fk_production_orders_plan_id
      FOREIGN KEY (plan_id) REFERENCES production_plans (id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_production_orders_plan_item_id'
  ) THEN
    ALTER TABLE production_orders
      ADD CONSTRAINT fk_production_orders_plan_item_id
      FOREIGN KEY (plan_item_id) REFERENCES production_plan_items (id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_production_orders_plan_id ON production_orders (plan_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_plan_item_id ON production_orders (plan_item_id);
