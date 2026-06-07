-- 084-add-line-column.sql
-- Migration to add Line field for line number/delivery line

-- Add line column to planning_rows table
ALTER TABLE sales.planning_rows 
  ADD COLUMN IF NOT EXISTS line INTEGER CHECK (line > 0);

-- Drop old unique constraint
ALTER TABLE sales.planning_rows 
  DROP CONSTRAINT IF EXISTS uk_batch_customer_product_date_round;

-- Add new unique constraint including line
ALTER TABLE sales.planning_rows 
  ADD CONSTRAINT uk_batch_customer_product_date_round_line 
  UNIQUE (batch_id, customer_code, product_code, sale_date, round, line);

-- Add comment
COMMENT ON COLUMN sales.planning_rows.line IS 'Line number or delivery line (1, 2, 3, ...)';

-- Create index for line field
CREATE INDEX IF NOT EXISTS idx_planning_rows_line ON sales.planning_rows(line);

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'sales' 
    AND table_name = 'planning_rows' 
    AND column_name = 'line'
  ) THEN
    RAISE NOTICE 'Column sales.planning_rows.line added successfully';
  ELSE
    RAISE EXCEPTION 'Column sales.planning_rows.line was not added';
  END IF;
END $$;
