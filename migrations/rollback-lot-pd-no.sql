-- Rollback: Remove lot_pd_no column from material_receiving_lots table
DROP INDEX IF EXISTS idx_material_receiving_lots_lot_pd_no;
ALTER TABLE material_receiving_lots DROP COLUMN IF EXISTS lot_pd_no;
