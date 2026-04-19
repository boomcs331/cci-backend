-- สคีมาใหม่จาก 005 ไม่มี quantity — ถ้า entity map quantity ต้องมีคอลัมน์นี้
-- สคีมาเก่ามี quantity อยู่แล้ว → IF NOT EXISTS จะข้าม

DO $$
BEGIN
  IF to_regclass('public.production_orders') IS NULL THEN RETURN; END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'production_orders' AND column_name = 'quantity'
  ) THEN RETURN; END IF;

  ALTER TABLE production_orders ADD COLUMN quantity NUMERIC(15, 4);
  UPDATE production_orders SET quantity = order_quantity WHERE order_quantity IS NOT NULL;
  UPDATE production_orders SET quantity = 0 WHERE quantity IS NULL;
  ALTER TABLE production_orders ALTER COLUMN quantity SET NOT NULL;
END $$;
