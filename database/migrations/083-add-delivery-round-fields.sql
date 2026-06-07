-- 083-add-delivery-round-fields.sql
-- Migration to add Gate, Location, and Round fields for multiple delivery rounds per day

-- Add new columns to planning_rows table
ALTER TABLE sales.planning_rows 
  ADD COLUMN IF NOT EXISTS gate VARCHAR(50),
  ADD COLUMN IF NOT EXISTS location VARCHAR(100),
  ADD COLUMN IF NOT EXISTS round INTEGER CHECK (round > 0);

-- Drop old unique constraint
ALTER TABLE sales.planning_rows 
  DROP CONSTRAINT IF EXISTS uk_batch_customer_product_date;

-- Add new unique constraint including round
ALTER TABLE sales.planning_rows 
  ADD CONSTRAINT uk_batch_customer_product_date_round 
  UNIQUE (batch_id, customer_code, product_code, sale_date, round);

-- Add comments
COMMENT ON COLUMN sales.planning_rows.gate IS 'Gate or delivery point (e.g., Gate A, Gate B)';
COMMENT ON COLUMN sales.planning_rows.location IS 'Delivery location or warehouse (e.g., Warehouse 1, Warehouse 2)';
COMMENT ON COLUMN sales.planning_rows.round IS 'Delivery round number for the day (1, 2, 3, ...)';

-- Create index for round field
CREATE INDEX IF NOT EXISTS idx_planning_rows_round ON sales.planning_rows(round);
CREATE INDEX IF NOT EXISTS idx_planning_rows_gate ON sales.planning_rows(gate);
CREATE INDEX IF NOT EXISTS idx_planning_rows_location ON sales.planning_rows(location);

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'sales' 
    AND table_name = 'planning_rows' 
    AND column_name = 'gate'
  ) THEN
    RAISE NOTICE 'Column sales.planning_rows.gate added successfully';
  ELSE
    RAISE EXCEPTION 'Column sales.planning_rows.gate was not added';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'sales' 
    AND table_name = 'planning_rows' 
    AND column_name = 'location'
  ) THEN
    RAISE NOTICE 'Column sales.planning_rows.location added successfully';
  ELSE
    RAISE EXCEPTION 'Column sales.planning_rows.location was not added';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'sales' 
    AND table_name = 'planning_rows' 
    AND column_name = 'round'
  ) THEN
    RAISE NOTICE 'Column sales.planning_rows.round added successfully';
  ELSE
    RAISE EXCEPTION 'Column sales.planning_rows.round was not added';
  END IF;
END $$;
