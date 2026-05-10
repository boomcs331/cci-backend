-- Support split-lot lineage and QR retirement policy.
-- Policy: when splitting a lot, source QR is retired and child lots receive new QR codes.
--
-- NOTE:
-- Some environments keep transactional production tables in public,
-- while others may already move them under master.
-- This migration auto-detects the schema and applies changes safely.

DO $$
DECLARE
  target_schema text;
BEGIN
  -- Prefer explicit known schemas first.
  IF to_regclass('public.production_lots') IS NOT NULL THEN
    target_schema := 'public';
  ELSIF to_regclass('master.production_lots') IS NOT NULL THEN
    target_schema := 'master';
  ELSE
    -- Fallback: discover from information_schema (more robust across permissions/relkinds).
    SELECT t.table_schema
    INTO target_schema
    FROM information_schema.tables t
    WHERE t.table_name = 'production_lots'
      AND t.table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY t.table_schema
    LIMIT 1;
  END IF;

  IF target_schema IS NULL THEN
    RAISE NOTICE 'Skip 037: production_lots table not found in any non-system schema.';
    RAISE NOTICE 'If you want split-lot feature, run base production-order migrations first (e.g. 005-production-orders-schema.sql).';
    RETURN;
  END IF;

  EXECUTE format(
    'ALTER TABLE %I.production_lots ADD COLUMN IF NOT EXISTS parent_lot_id INTEGER NULL',
    target_schema
  );

  EXECUTE format(
    'ALTER TABLE %I.production_lots ADD COLUMN IF NOT EXISTS split_reason TEXT NULL',
    target_schema
  );

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_production_lots_parent_lot'
  ) THEN
    EXECUTE format(
      'ALTER TABLE %I.production_lots
         ADD CONSTRAINT fk_production_lots_parent_lot
         FOREIGN KEY (parent_lot_id) REFERENCES %I.production_lots(id) ON DELETE SET NULL',
      target_schema,
      target_schema
    );
  END IF;

  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS idx_production_lots_parent_lot_id
       ON %I.production_lots(parent_lot_id)',
    target_schema
  );
END $$;

