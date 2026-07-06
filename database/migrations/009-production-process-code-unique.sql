-- ให้ process_code ไม่ซ้ำ เวลาสร้าง master จากขั้นตอนของสินค้า
CREATE UNIQUE INDEX IF NOT EXISTS uq_production_processes_process_code ON production_processes (process_code);
