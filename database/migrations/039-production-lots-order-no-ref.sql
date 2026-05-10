-- Keep production order number directly in production_lots for fast reference,
-- especially during split-lot investigations.
-- Safe to run multiple times.

DO $$
BEGIN
  -- public schema
  IF to_regclass('public.production_lots') IS NOT NULL THEN
    ALTER TABLE public.production_lots
      ADD COLUMN IF NOT EXISTS order_no_ref VARCHAR(50) NULL;

    IF to_regclass('public.production_orders') IS NOT NULL THEN
      UPDATE public.production_lots l
      SET order_no_ref = o.order_no
      FROM public.production_orders o
      WHERE l.order_id = o.id
        AND (l.order_no_ref IS NULL OR l.order_no_ref = '');
    END IF;

    CREATE INDEX IF NOT EXISTS idx_public_production_lots_order_no_ref
      ON public.production_lots(order_no_ref);
  END IF;

  -- master schema
  IF to_regclass('master.production_lots') IS NOT NULL THEN
    ALTER TABLE master.production_lots
      ADD COLUMN IF NOT EXISTS order_no_ref VARCHAR(50) NULL;

    IF to_regclass('master.production_orders') IS NOT NULL THEN
      UPDATE master.production_lots l
      SET order_no_ref = o.order_no
      FROM master.production_orders o
      WHERE l.order_id = o.id
        AND (l.order_no_ref IS NULL OR l.order_no_ref = '');
    END IF;

    CREATE INDEX IF NOT EXISTS idx_master_production_lots_order_no_ref
      ON master.production_lots(order_no_ref);
  END IF;
END $$;

