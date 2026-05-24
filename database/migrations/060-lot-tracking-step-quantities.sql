-- รับเข้า / จ่ายออก ต่อขั้นตอน (production_lot_tracking)

ALTER TABLE production_lot_tracking
  ADD COLUMN IF NOT EXISTS quantity_in NUMERIC(15, 4) NULL,
  ADD COLUMN IF NOT EXISTS quantity_out NUMERIC(15, 4) NULL;

COMMENT ON COLUMN production_lot_tracking.quantity_in IS
  'จำนวนรับเข้าขั้นตอนนี้ (ตอนเริ่มขั้น)';
COMMENT ON COLUMN production_lot_tracking.quantity_out IS
  'จำนวนจ่ายออกจากขั้นตอนนี้ (ตอนปิดขั้น / split)';

-- ประมาณการย้อนหลัง: ล็อตที่ยังไม่ split ใช้ quantity ปัจจุบัน
UPDATE production_lot_tracking t
SET
  quantity_in = l.quantity,
  quantity_out = CASE WHEN t.status = 'COMPLETED' THEN l.quantity ELSE NULL END
FROM production_lots l
WHERE t.lot_id = l.id
  AND l.status <> 'SPLIT'
  AND t.quantity_in IS NULL;

UPDATE production_lot_tracking t
SET quantity_in = l.quantity
FROM production_lots l
WHERE t.lot_id = l.id
  AND t.status = 'IN_PROGRESS'
  AND t.quantity_in IS NULL;
