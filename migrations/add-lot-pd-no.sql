-- Add lot_pd_no column to material_receiving_lots table
ALTER TABLE material_receiving_lots 
ADD COLUMN lot_pd_no VARCHAR(50);

-- Add index for lot_pd_no
CREATE INDEX idx_material_receiving_lots_lot_pd_no ON material_receiving_lots(lot_pd_no);
