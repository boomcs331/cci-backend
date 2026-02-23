-- Rollback: Remove Production Planning System (PostgreSQL)

DROP TABLE IF EXISTS material_reservations;
DROP TABLE IF EXISTS production_plan_items;
DROP TABLE IF EXISTS production_plans;

-- ลบ enum type
DROP TYPE IF EXISTS plan_status;

-- ลบคอลัมน์ reserved_qty (ถ้าต้องการ)
-- ALTER TABLE materials_stock DROP COLUMN IF EXISTS reserved_qty;
