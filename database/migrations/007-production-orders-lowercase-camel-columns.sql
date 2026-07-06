-- TypeORM / DDL บางเส้นทางสร้างคอลัมน์แบบไม่ใส่ quote → PostgreSQL เก็บเป็นตัวพิมพ์เล็กทั้งคำ เช่น orderquantity
-- แก้ error: column ProductionOrder.order_quantity does not exist

DO $$
BEGIN
  IF to_regclass('public.production_orders') IS NULL THEN RETURN; END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'orderno' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'order_no' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN orderno TO order_no;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'productid' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'product_id' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN productid TO product_id;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'orderquantity' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'order_quantity' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN orderquantity TO order_quantity;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'lotsize' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'lot_size' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN lotsize TO lot_size;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'totallots' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'total_lots' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN totallots TO total_lots;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'createdate' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'create_date' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN createdate TO create_date;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'createby' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'create_by' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN createby TO create_by;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'planid' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'plan_id' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN planid TO plan_id;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'planitemid' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'plan_item_id' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN planitemid TO plan_item_id;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.production_lots') IS NULL THEN RETURN; END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'orderid' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'order_id' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lots RENAME COLUMN orderid TO order_id;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'lotno' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'lot_no' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lots RENAME COLUMN lotno TO lot_no;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'qrcode' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'qr_code' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lots RENAME COLUMN qrcode TO qr_code;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'sequenceno' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'sequence_no' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lots RENAME COLUMN sequenceno TO sequence_no;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'currentprocessid' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'current_process_id' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lots RENAME COLUMN currentprocessid TO current_process_id;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'createdate' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'create_date' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lots RENAME COLUMN createdate TO create_date;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.production_lot_tracking') IS NULL THEN RETURN; END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'lotid' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'lot_id' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lot_tracking RENAME COLUMN lotid TO lot_id;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'processid' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'process_id' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lot_tracking RENAME COLUMN processid TO process_id;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'starttime' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'start_time' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lot_tracking RENAME COLUMN starttime TO start_time;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'endtime' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'end_time' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lot_tracking RENAME COLUMN endtime TO end_time;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'createdate' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'create_date' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lot_tracking RENAME COLUMN createdate TO create_date;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.production_processes') IS NULL THEN RETURN; END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_processes' AND a.attname = 'processcode' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_processes' AND a.attname = 'process_code' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_processes RENAME COLUMN processcode TO process_code;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_processes' AND a.attname = 'processname' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_processes' AND a.attname = 'process_name' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_processes RENAME COLUMN processname TO process_name;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_processes' AND a.attname = 'sequenceorder' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_processes' AND a.attname = 'sequence_order' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_processes RENAME COLUMN sequenceorder TO sequence_order;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_processes' AND a.attname = 'isactive' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_processes' AND a.attname = 'is_active' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_processes RENAME COLUMN isactive TO is_active;
  END IF;
END $$;

-- ยังไม่มี snake_case หลัง rename: เพิ่มคอลัมน์ที่ entity ต้องการ (เติม 0 แถวเก่าแล้วบังคับ NOT NULL)
DO $$
BEGIN
  IF to_regclass('public.production_orders') IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
                 WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'order_quantity' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders ADD COLUMN order_quantity NUMERIC(15, 4);
    UPDATE production_orders SET order_quantity = 0 WHERE order_quantity IS NULL;
    ALTER TABLE production_orders ALTER COLUMN order_quantity SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
                 WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'lot_size' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders ADD COLUMN lot_size NUMERIC(15, 4);
    UPDATE production_orders SET lot_size = 1 WHERE lot_size IS NULL;
    ALTER TABLE production_orders ALTER COLUMN lot_size SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
                 WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'total_lots' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders ADD COLUMN total_lots INTEGER;
    UPDATE production_orders SET total_lots = 0 WHERE total_lots IS NULL;
    ALTER TABLE production_orders ALTER COLUMN total_lots SET NOT NULL;
  END IF;

  -- status / remarks: entity ไม่ใส่ name → TypeORM ใช้ชื่อ property ในฐานข้อมูล (status, remarks)
  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'Remarks' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'remarks' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN "Remarks" TO remarks;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
                 WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'remarks' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders ADD COLUMN remarks TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
                 WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'status' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders ADD COLUMN status VARCHAR(255) NOT NULL DEFAULT 'DRAFT';
  END IF;
END $$;
 