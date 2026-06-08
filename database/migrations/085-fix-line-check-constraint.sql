-- 085-fix-line-check-constraint.sql
-- Fix line check constraint to allow null values

-- Drop the old check constraint
ALTER TABLE sales.planning_rows 
  DROP CONSTRAINT IF EXISTS planning_rows_line_check;

-- Add new check constraint that allows null values
ALTER TABLE sales.planning_rows 
  ADD CONSTRAINT planning_rows_line_check 
  CHECK (line IS NULL OR line > 0);

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Line check constraint fixed to allow null values';
END $$;
