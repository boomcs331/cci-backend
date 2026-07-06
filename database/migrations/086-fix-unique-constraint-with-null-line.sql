-- 086-fix-unique-constraint-with-null-line.sql
-- Fix unique constraint to handle null line values properly

-- Drop the old unique constraint with line
ALTER TABLE sales.planning_rows 
  DROP CONSTRAINT IF EXISTS uk_batch_customer_product_date_round_line;

-- Ensure the correct constraint exists (without line)
-- First check if it already exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uk_batch_customer_product_date_round'
    AND conrelid = 'sales.planning_rows'::regclass
  ) THEN
    ALTER TABLE sales.planning_rows 
      ADD CONSTRAINT uk_batch_customer_product_date_round 
      UNIQUE (batch_id, customer_code, product_code, sale_date, round);
    RAISE NOTICE 'Unique constraint added (without line)';
  ELSE
    RAISE NOTICE 'Unique constraint already exists (without line)';
  END IF;
END $$;
