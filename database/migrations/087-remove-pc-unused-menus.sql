-- ลบเมนู PC ที่ไม่ได้ใช้งานแล้วออกจาก sidebar
DELETE FROM auth.menus WHERE code IN ('pc_reservations', 'pc_tracking_scan');
