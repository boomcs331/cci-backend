-- Migration: Add income_supplire_date column to material_receiving_lots table
-- Description: เพิ่มฟิลด์วันที่ผลิตจากซัพพลายเออร์ (Manufacturing Date)
-- Date: 2025

-- Add income_supplire_date column
ALTER TABLE material_receiving_lots 
ADD COLUMN income_supplire_date DATE NULL;

-- Add comment to column
COMMENT ON COLUMN material_receiving_lots.income_supplire_date IS 'วันที่ผลิตจากซัพพลายเออร์ (Manufacturing Date from Supplier)';
