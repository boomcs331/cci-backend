-- ลบคอลัมน์ quantity ที่ซ้ำกับ order_quantity (TypeORM ไม่ map quantity → insert แล้ว error NOT NULL)
-- Error เดิม: null value in column "quantity" of relation "production_orders"

DO $$
BEGIN
  IF to_regclass('public.production_orders') IS NULL THEN RETURN; END IF;

  -- มีทั้งสองคอลัมน์: คัดลอกค่าที่ขาดแล้วลบ quantity
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'production_orders' AND column_name = 'quantity'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'production_orders' AND column_name = 'order_quantity'
  ) THEN
    UPDATE production_orders
    SET order_quantity = quantity
    WHERE order_quantity IS NULL AND quantity IS NOT NULL;
    DROP TRIGGER IF EXISTS tr_production_orders_bi_sync_quantity ON public.production_orders;
    ALTER TABLE production_orders DROP COLUMN quantity;
    RETURN;
  END IF;

  -- มีแค่ quantity ไม่มี order_quantity: เปลี่ยนชื่อให้ตรง entity
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'production_orders' AND column_name = 'quantity'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'production_orders' AND column_name = 'order_quantity'
  ) THEN
    ALTER TABLE production_orders RENAME COLUMN quantity TO order_quantity;
  END IF;
END $$;
