-- Mockup Data for Material Issuing Types
-- Date: 2026-01-22

-- ========================================
-- 1. จ่ายออกแบบสั่งผลิตปกติ (NORMAL_PRODUCTION)
-- ========================================

INSERT INTO material_issuing (
  issuing_no, issuing_date, issuing_type, material_id, total_quantity, unit,
  department, work_order_no, remark, status, create_date, create_by
) VALUES
('ISS-PRD-2026-0001', '2026-01-15 08:30:00', 'NORMAL_PRODUCTION', 1, 500, 'KG', 
 'Production Line 1', 'WO-2026-001', 'ผลิตสินค้า Batch A', 'COMPLETED', NOW(), 'prod_user1'),

('ISS-PRD-2026-0002', '2026-01-16 09:15:00', 'NORMAL_PRODUCTION', 2, 300, 'PCS', 
 'Production Line 2', 'WO-2026-002', 'ผลิตสินค้า Batch B', 'COMPLETED', NOW(), 'prod_user2'),

('ISS-PRD-2026-0003', '2026-01-17 10:00:00', 'NORMAL_PRODUCTION', 3, 1000, 'M', 
 'Production Line 1', 'WO-2026-003', 'ผลิตสินค้า SKU-ABC-001', 'COMPLETED', NOW(), 'prod_user1'),

('ISS-PRD-2026-0004', '2026-01-18 11:30:00', 'NORMAL_PRODUCTION', 1, 750, 'KG', 
 'Production Line 3', 'WO-2026-004', 'ผลิตสินค้า Batch C - Rush Order', 'COMPLETED', NOW(), 'prod_user3'),

('ISS-PRD-2026-0005', '2026-01-19 14:00:00', 'NORMAL_PRODUCTION', 4, 200, 'L', 
 'Production Line 2', 'WO-2026-005', 'ผลิตสินค้า Special Order', 'COMPLETED', NOW(), 'prod_user2');

-- ========================================
-- 2. จ่ายออกแบบตัดสต็อก (STOCK_DEDUCTION)
-- ========================================

INSERT INTO material_issuing (
  issuing_no, issuing_date, issuing_type, material_id, total_quantity, unit,
  department, remark, status, create_date, create_by
) VALUES
('ISS-STK-2026-0001', '2026-01-15 13:00:00', 'STOCK_DEDUCTION', 5, 50, 'KG', 
 'Warehouse', 'ตัดสต็อกเนื่องจากวัสดุเสียหายจากการขนส่ง', 'COMPLETED', NOW(), 'warehouse_admin'),

('ISS-STK-2026-0002', '2026-01-16 14:30:00', 'STOCK_DEDUCTION', 2, 25, 'PCS', 
 'Quality Control', 'ตัดสต็อกวัสดุไม่ผ่านมาตรฐาน QC', 'COMPLETED', NOW(), 'qc_user'),

('ISS-STK-2026-0003', '2026-01-17 15:00:00', 'STOCK_DEDUCTION', 6, 100, 'M', 
 'Warehouse', 'ตัดสต็อกวัสดุหมดอายุ - Lot เก่า', 'COMPLETED', NOW(), 'warehouse_admin'),

('ISS-STK-2026-0004', '2026-01-18 16:00:00', 'STOCK_DEDUCTION', 3, 30, 'M', 
 'Warehouse', 'ปรับปรุงสต็อก - นับสต็อกพบส่วนต่าง', 'COMPLETED', NOW(), 'warehouse_supervisor'),

('ISS-STK-2026-0005', '2026-01-20 10:00:00', 'STOCK_DEDUCTION', 7, 15, 'KG', 
 'Warehouse', 'ตัดสต็อกวัสดุเสียหายจากน้ำท่วม', 'COMPLETED', NOW(), 'warehouse_admin');

-- ========================================
-- 3. จ่ายออกแบบเบิกอะไหล่ทดแทน (SPARE_PARTS_REPLACEMENT)
-- ========================================

INSERT INTO material_issuing (
  issuing_no, issuing_date, issuing_type, material_id, total_quantity, unit,
  department, machine_no, part_no, requester, remark, status, create_date, create_by
) VALUES
('ISS-SPR-2026-0001', '2026-01-15 07:00:00', 'SPARE_PARTS_REPLACEMENT', 8, 2, 'PCS', 
 'Maintenance', 'CNC-MACHINE-01', 'BEARING-6205', 'นายสมชาย ช่างเทคนิค', 
 'เปลี่ยนแบริ่งเครื่อง CNC เนื่องจากชำรุด', 'COMPLETED', NOW(), 'maintenance_user1'),

('ISS-SPR-2026-0002', '2026-01-16 08:30:00', 'SPARE_PARTS_REPLACEMENT', 9, 1, 'PCS', 
 'Maintenance', 'INJECTION-MOLD-05', 'MOTOR-3HP', 'นายวิชัย ช่างไฟฟ้า', 
 'เปลี่ยนมอเตอร์เครื่อง Injection Mold', 'COMPLETED', NOW(), 'maintenance_user2'),

('ISS-SPR-2026-0003', '2026-01-17 09:00:00', 'SPARE_PARTS_REPLACEMENT', 10, 4, 'PCS', 
 'Maintenance', 'CONVEYOR-BELT-02', 'ROLLER-100MM', 'นายประสิทธิ์ ช่างกล', 
 'เปลี่ยนลูกกลิ้ง Conveyor Belt', 'COMPLETED', NOW(), 'maintenance_user3'),

('ISS-SPR-2026-0004', '2026-01-18 10:30:00', 'SPARE_PARTS_REPLACEMENT', 11, 1, 'SET', 
 'Maintenance', 'HYDRAULIC-PRESS-03', 'SEAL-KIT-HP300', 'นายสมศักดิ์ ช่างไฮดรอลิก', 
 'เปลี่ยนชุด Seal เครื่องไฮดรอลิก - ซึม', 'COMPLETED', NOW(), 'maintenance_user1'),

('ISS-SPR-2026-0005', '2026-01-19 11:00:00', 'SPARE_PARTS_REPLACEMENT', 12, 3, 'PCS', 
 'Maintenance', 'COMPRESSOR-AIR-01', 'FILTER-AIR-50', 'นายชัยวัฒน์ ช่างซ่อม', 
 'เปลี่ยนไส้กรองอากาศคอมเพรสเซอร์', 'COMPLETED', NOW(), 'maintenance_user2'),

('ISS-SPR-2026-0006', '2026-01-20 13:00:00', 'SPARE_PARTS_REPLACEMENT', 8, 1, 'PCS', 
 'Maintenance', 'CNC-MACHINE-03', 'BEARING-6205', 'นายสมชาย ช่างเทคนิค', 
 'เปลี่ยนแบริ่งเครื่อง CNC-03 ตามแผนบำรุงรักษา', 'COMPLETED', NOW(), 'maintenance_user1'),

('ISS-SPR-2026-0007', '2026-01-21 14:30:00', 'SPARE_PARTS_REPLACEMENT', 13, 2, 'PCS', 
 'Maintenance', 'ROBOT-ARM-02', 'SERVO-MOTOR-2KW', 'นายธนา ช่างหุ่นยนต์', 
 'เปลี่ยน Servo Motor แขนหุ่นยนต์', 'COMPLETED', NOW(), 'maintenance_user3'),

('ISS-SPR-2026-0008', '2026-01-22 08:00:00', 'SPARE_PARTS_REPLACEMENT', 14, 5, 'M', 
 'Maintenance', 'CONVEYOR-BELT-01', 'BELT-RUBBER-500MM', 'นายประสิทธิ์ ช่างกล', 
 'เปลี่ยนสายพาน Conveyor - ขาด', 'COMPLETED', NOW(), 'maintenance_user3');

-- ========================================
-- สรุปข้อมูล Mockup
-- ========================================
-- NORMAL_PRODUCTION: 5 รายการ (ISS-PRD-2026-0001 ถึง 0005)
-- STOCK_DEDUCTION: 5 รายการ (ISS-STK-2026-0001 ถึง 0005)
-- SPARE_PARTS_REPLACEMENT: 8 รายการ (ISS-SPR-2026-0001 ถึง 0008)
-- รวมทั้งหมด: 18 รายการ
