-- ============================================
-- Rollback Material Receiving & Issuing System Migration
-- Version: 1.0
-- Date: 2024
-- ============================================

-- ============================================
-- 1. Drop Triggers
-- ============================================
DROP TRIGGER IF EXISTS trg_after_insert_issuing ON material_issuing;
DROP TRIGGER IF EXISTS trg_after_insert_receiving ON material_receiving;

-- ============================================
-- 2. Drop Functions
-- ============================================
DROP FUNCTION IF EXISTS update_lot_quantity_after_issuing();
DROP FUNCTION IF EXISTS update_lot_quantity_after_receiving();

-- ============================================
-- 3. Drop Views
-- ============================================
DROP VIEW IF EXISTS v_issuing_transactions;
DROP VIEW IF EXISTS v_receiving_transactions;
DROP VIEW IF EXISTS v_material_lot_summary;

-- ============================================
-- 4. Drop Tables (in reverse order of dependencies)
-- ============================================
DROP TABLE IF EXISTS material_issuing_documents CASCADE;
DROP TABLE IF EXISTS material_issuing CASCADE;
DROP TABLE IF EXISTS material_receiving CASCADE;
DROP TABLE IF EXISTS issuing_types CASCADE;
DROP TABLE IF EXISTS material_lots CASCADE;

-- ============================================
-- Rollback Complete
-- ============================================
