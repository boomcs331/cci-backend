-- ถ้ายังมีคอลัมน์ quantity คู่กับ order_quantity (legacy) และแอปส่งแค่ order_quantity
-- → เติม quantity ก่อนบันทึก แก้ error: null value in column "quantity" of relation "production_orders"
-- (รันหลัง 012 ได้ — ถ้าไม่มีคอลัมน์ quantity จะไม่สร้าง trigger)

DO $$
BEGIN
  IF to_regclass('public.production_orders') IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'production_orders' AND column_name = 'quantity'
  ) THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'production_orders' AND column_name = 'order_quantity'
  ) THEN RETURN; END IF;

  CREATE OR REPLACE FUNCTION public.production_orders_bi_sync_quantity()
  RETURNS TRIGGER AS $fn$
  BEGIN
    IF NEW.quantity IS NULL AND NEW.order_quantity IS NOT NULL THEN
      NEW.quantity := NEW.order_quantity;
    END IF;
    RETURN NEW;
  END;
  $fn$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS tr_production_orders_bi_sync_quantity ON public.production_orders;
  CREATE TRIGGER tr_production_orders_bi_sync_quantity
    BEFORE INSERT OR UPDATE ON public.production_orders
    FOR EACH ROW
    EXECUTE PROCEDURE public.production_orders_bi_sync_quantity();
END $$;
