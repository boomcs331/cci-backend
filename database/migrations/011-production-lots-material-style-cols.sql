-- ล็อตผลิตให้มีคู่เลขแบบ material: lot_no = PG{yyyyMMdd}-{run}, lot_pd_no = PD{yyyyMMdd}-{run}
-- order_lot_label = เลขอ้างอิงตามใบสั่ง (PO...-LOT...)
ALTER TABLE production_lots ADD COLUMN IF NOT EXISTS lot_pd_no VARCHAR(50);
ALTER TABLE production_lots ADD COLUMN IF NOT EXISTS order_lot_label VARCHAR(100);
