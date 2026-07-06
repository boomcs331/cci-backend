-- แก้ตารางที่สร้างด้วยชื่อคอลัมน์แบบ camelCase (TypeORM ไม่ระบุ name) ให้ตรง entity ปัจจุบัน
-- รันเมื่อ error แบบ: column ProductionOrder.order_quantity does not exist

DO $$
BEGIN
  IF to_regclass('public.production_orders') IS NULL THEN RETURN; END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'orderNo' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'order_no' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN "orderNo" TO order_no;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'productId' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'product_id' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN "productId" TO product_id;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'orderQuantity' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'order_quantity' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN "orderQuantity" TO order_quantity;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'lotSize' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'lot_size' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN "lotSize" TO lot_size;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'totalLots' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'total_lots' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN "totalLots" TO total_lots;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'createDate' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'create_date' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN "createDate" TO create_date;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'createBy' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'create_by' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN "createBy" TO create_by;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'planId' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'plan_id' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN "planId" TO plan_id;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'planItemId' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_orders' AND a.attname = 'plan_item_id' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_orders RENAME COLUMN "planItemId" TO plan_item_id;
  END IF;
END $$;

-- production_lots
DO $$
BEGIN
  IF to_regclass('public.production_lots') IS NULL THEN RETURN; END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'orderId' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'order_id' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lots RENAME COLUMN "orderId" TO order_id;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'lotNo' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'lot_no' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lots RENAME COLUMN "lotNo" TO lot_no;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'qrCode' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'qr_code' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lots RENAME COLUMN "qrCode" TO qr_code;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'sequenceNo' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'sequence_no' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lots RENAME COLUMN "sequenceNo" TO sequence_no;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'currentProcessId' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'current_process_id' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lots RENAME COLUMN "currentProcessId" TO current_process_id;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'createDate' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lots' AND a.attname = 'create_date' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lots RENAME COLUMN "createDate" TO create_date;
  END IF;
END $$;

-- production_lot_tracking
DO $$
BEGIN
  IF to_regclass('public.production_lot_tracking') IS NULL THEN RETURN; END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'lotId' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'lot_id' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lot_tracking RENAME COLUMN "lotId" TO lot_id;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'processId' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'process_id' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lot_tracking RENAME COLUMN "processId" TO process_id;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'startTime' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'start_time' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lot_tracking RENAME COLUMN "startTime" TO start_time;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'endTime' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'end_time' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lot_tracking RENAME COLUMN "endTime" TO end_time;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'createDate' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_lot_tracking' AND a.attname = 'create_date' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_lot_tracking RENAME COLUMN "createDate" TO create_date;
  END IF;
END $$;

-- production_processes
DO $$
BEGIN
  IF to_regclass('public.production_processes') IS NULL THEN RETURN; END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_processes' AND a.attname = 'processCode' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_processes' AND a.attname = 'process_code' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_processes RENAME COLUMN "processCode" TO process_code;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_processes' AND a.attname = 'processName' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_processes' AND a.attname = 'process_name' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_processes RENAME COLUMN "processName" TO process_name;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_processes' AND a.attname = 'sequenceOrder' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_processes' AND a.attname = 'sequence_order' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_processes RENAME COLUMN "sequenceOrder" TO sequence_order;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_processes' AND a.attname = 'isActive' AND a.attnum > 0 AND NOT a.attisdropped)
     AND NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'production_processes' AND a.attname = 'is_active' AND a.attnum > 0 AND NOT a.attisdropped) THEN
    ALTER TABLE production_processes RENAME COLUMN "isActive" TO is_active;
  END IF;
END $$;
