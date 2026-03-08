-- Rollback: Remove income_supplire_date column from material_receiving_lots table
-- Description: ลบฟิลด์วันที่ผลิตจากซัพพลายเออร์
-- Date: 2025

-- Remove income_supplire_date column
ALTER TABLE material_receiving_lots 
DROP COLUMN IF EXISTS income_supplire_date;
