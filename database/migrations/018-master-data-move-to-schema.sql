-- Move master data tables from public to master schema.
-- Keep transactional tables in public.

CREATE SCHEMA IF NOT EXISTS master;

DO $$
BEGIN
  IF to_regclass('public.materials_type') IS NOT NULL AND to_regclass('master.materials_type') IS NULL THEN
    ALTER TABLE public.materials_type SET SCHEMA master;
  END IF;
  IF to_regclass('public.loading_points') IS NOT NULL AND to_regclass('master.loading_points') IS NULL THEN
    ALTER TABLE public.loading_points SET SCHEMA master;
  END IF;
  IF to_regclass('public.models') IS NOT NULL AND to_regclass('master.models') IS NULL THEN
    ALTER TABLE public.models SET SCHEMA master;
  END IF;
  IF to_regclass('public.issuing_types') IS NOT NULL AND to_regclass('master.issuing_types') IS NULL THEN
    ALTER TABLE public.issuing_types SET SCHEMA master;
  END IF;
  IF to_regclass('public.process_lines') IS NOT NULL AND to_regclass('master.process_lines') IS NULL THEN
    ALTER TABLE public.process_lines SET SCHEMA master;
  END IF;
  IF to_regclass('public.delivery_types') IS NOT NULL AND to_regclass('master.delivery_types') IS NULL THEN
    ALTER TABLE public.delivery_types SET SCHEMA master;
  END IF;
  IF to_regclass('public.materials_location') IS NOT NULL AND to_regclass('master.materials_location') IS NULL THEN
    ALTER TABLE public.materials_location SET SCHEMA master;
  END IF;
  IF to_regclass('public.units') IS NOT NULL AND to_regclass('master.units') IS NULL THEN
    ALTER TABLE public.units SET SCHEMA master;
  END IF;
  IF to_regclass('public.supplier') IS NOT NULL AND to_regclass('master.supplier') IS NULL THEN
    ALTER TABLE public.supplier SET SCHEMA master;
  END IF;
  IF to_regclass('public.materials') IS NOT NULL AND to_regclass('master.materials') IS NULL THEN
    ALTER TABLE public.materials SET SCHEMA master;
  END IF;

  IF to_regclass('public.customers') IS NOT NULL AND to_regclass('master.customers') IS NULL THEN
    ALTER TABLE public.customers SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_types') IS NOT NULL AND to_regclass('master.product_types') IS NULL THEN
    ALTER TABLE public.product_types SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_process_lines') IS NOT NULL
    AND to_regclass('master.product_process_lines') IS NULL THEN
    ALTER TABLE public.product_process_lines SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_delivery_types') IS NOT NULL
    AND to_regclass('master.product_delivery_types') IS NULL THEN
    ALTER TABLE public.product_delivery_types SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_units') IS NOT NULL AND to_regclass('master.product_units') IS NULL THEN
    ALTER TABLE public.product_units SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_models') IS NOT NULL AND to_regclass('master.product_models') IS NULL THEN
    ALTER TABLE public.product_models SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_loading_points') IS NOT NULL
    AND to_regclass('master.product_loading_points') IS NULL THEN
    ALTER TABLE public.product_loading_points SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_locations') IS NOT NULL AND to_regclass('master.product_locations') IS NULL THEN
    ALTER TABLE public.product_locations SET SCHEMA master;
  END IF;
  IF to_regclass('public.products') IS NOT NULL AND to_regclass('master.products') IS NULL THEN
    ALTER TABLE public.products SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_bom') IS NOT NULL AND to_regclass('master.product_bom') IS NULL THEN
    ALTER TABLE public.product_bom SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_production_steps') IS NOT NULL
    AND to_regclass('master.product_production_steps') IS NULL THEN
    ALTER TABLE public.product_production_steps SET SCHEMA master;
  END IF;

  IF to_regclass('public.production_processes') IS NOT NULL
    AND to_regclass('master.production_processes') IS NULL THEN
    ALTER TABLE public.production_processes SET SCHEMA master;
  END IF;
END $$;

-- Move legacy sequences if they remain in public after table move.
DO $$
BEGIN
  IF to_regclass('public.materials_type_id_seq') IS NOT NULL
    AND to_regclass('master.materials_type_id_seq') IS NULL THEN
    ALTER SEQUENCE public.materials_type_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.loading_points_id_seq') IS NOT NULL
    AND to_regclass('master.loading_points_id_seq') IS NULL THEN
    ALTER SEQUENCE public.loading_points_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.models_id_seq') IS NOT NULL
    AND to_regclass('master.models_id_seq') IS NULL THEN
    ALTER SEQUENCE public.models_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.issuing_types_id_seq') IS NOT NULL
    AND to_regclass('master.issuing_types_id_seq') IS NULL THEN
    ALTER SEQUENCE public.issuing_types_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.process_lines_id_seq') IS NOT NULL
    AND to_regclass('master.process_lines_id_seq') IS NULL THEN
    ALTER SEQUENCE public.process_lines_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.delivery_types_id_seq') IS NOT NULL
    AND to_regclass('master.delivery_types_id_seq') IS NULL THEN
    ALTER SEQUENCE public.delivery_types_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.materials_location_id_seq') IS NOT NULL
    AND to_regclass('master.materials_location_id_seq') IS NULL THEN
    ALTER SEQUENCE public.materials_location_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.units_id_seq') IS NOT NULL
    AND to_regclass('master.units_id_seq') IS NULL THEN
    ALTER SEQUENCE public.units_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.supplier_id_seq') IS NOT NULL
    AND to_regclass('master.supplier_id_seq') IS NULL THEN
    ALTER SEQUENCE public.supplier_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.materials_id_seq') IS NOT NULL
    AND to_regclass('master.materials_id_seq') IS NULL THEN
    ALTER SEQUENCE public.materials_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.customers_id_seq') IS NOT NULL
    AND to_regclass('master.customers_id_seq') IS NULL THEN
    ALTER SEQUENCE public.customers_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_types_id_seq') IS NOT NULL
    AND to_regclass('master.product_types_id_seq') IS NULL THEN
    ALTER SEQUENCE public.product_types_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_process_lines_id_seq') IS NOT NULL
    AND to_regclass('master.product_process_lines_id_seq') IS NULL THEN
    ALTER SEQUENCE public.product_process_lines_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_delivery_types_id_seq') IS NOT NULL
    AND to_regclass('master.product_delivery_types_id_seq') IS NULL THEN
    ALTER SEQUENCE public.product_delivery_types_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_units_id_seq') IS NOT NULL
    AND to_regclass('master.product_units_id_seq') IS NULL THEN
    ALTER SEQUENCE public.product_units_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_models_id_seq') IS NOT NULL
    AND to_regclass('master.product_models_id_seq') IS NULL THEN
    ALTER SEQUENCE public.product_models_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_loading_points_id_seq') IS NOT NULL
    AND to_regclass('master.product_loading_points_id_seq') IS NULL THEN
    ALTER SEQUENCE public.product_loading_points_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_locations_id_seq') IS NOT NULL
    AND to_regclass('master.product_locations_id_seq') IS NULL THEN
    ALTER SEQUENCE public.product_locations_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.products_id_seq') IS NOT NULL
    AND to_regclass('master.products_id_seq') IS NULL THEN
    ALTER SEQUENCE public.products_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_bom_id_seq') IS NOT NULL
    AND to_regclass('master.product_bom_id_seq') IS NULL THEN
    ALTER SEQUENCE public.product_bom_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.product_production_steps_id_seq') IS NOT NULL
    AND to_regclass('master.product_production_steps_id_seq') IS NULL THEN
    ALTER SEQUENCE public.product_production_steps_id_seq SET SCHEMA master;
  END IF;
  IF to_regclass('public.production_processes_id_seq') IS NOT NULL
    AND to_regclass('master.production_processes_id_seq') IS NULL THEN
    ALTER SEQUENCE public.production_processes_id_seq SET SCHEMA master;
  END IF;
END $$;
