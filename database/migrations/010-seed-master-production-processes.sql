-- Master data ขั้นตอนผลิตมาตรฐาน (รหัสตรงระบบ normalize: WELDING, PRESS, …)
-- รันหลัง 009 (unique บน process_code)
INSERT INTO production_processes (process_code, process_name, sequence_order, is_active)
VALUES
  ('WELDING', 'Welding', 1, true),
  ('PRESS', 'Press', 2, true),
  ('CHECKING', 'Checking', 3, true),
  ('COMPLETE', 'Complete', 4, true)
ON CONFLICT (process_code) DO NOTHING;
