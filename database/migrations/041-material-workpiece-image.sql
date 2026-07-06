-- รูปภาพชิ้นงาน (workpiece) สำหรับวัตถุดิบ — path สัมพันธ์กับโฟลเดอร์ static /uploads/
ALTER TABLE master.materials
  ADD COLUMN IF NOT EXISTS workpiece_image_path VARCHAR(500) NULL;
