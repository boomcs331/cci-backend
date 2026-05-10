-- Hotfix: ensure split-lineage columns exist where the app reads production_lots.
-- This is safe to run multiple times.

DO $$
BEGIN
  -- public schema
  IF to_regclass('public.production_lots') IS NOT NULL THEN
    ALTER TABLE public.production_lots
      ADD COLUMN IF NOT EXISTS parent_lot_id INTEGER NULL;

    ALTER TABLE public.production_lots
      ADD COLUMN IF NOT EXISTS split_reason TEXT NULL;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'fk_public_production_lots_parent_lot'
    ) THEN
      ALTER TABLE public.production_lots
        ADD CONSTRAINT fk_public_production_lots_parent_lot
        FOREIGN KEY (parent_lot_id) REFERENCES public.production_lots(id) ON DELETE SET NULL;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_public_production_lots_parent_lot_id
      ON public.production_lots(parent_lot_id);
  END IF;

  -- master schema
  IF to_regclass('master.production_lots') IS NOT NULL THEN
    ALTER TABLE master.production_lots
      ADD COLUMN IF NOT EXISTS parent_lot_id INTEGER NULL;

    ALTER TABLE master.production_lots
      ADD COLUMN IF NOT EXISTS split_reason TEXT NULL;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'fk_master_production_lots_parent_lot'
    ) THEN
      ALTER TABLE master.production_lots
        ADD CONSTRAINT fk_master_production_lots_parent_lot
        FOREIGN KEY (parent_lot_id) REFERENCES master.production_lots(id) ON DELETE SET NULL;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_master_production_lots_parent_lot_id
      ON master.production_lots(parent_lot_id);
  END IF;
END $$;

