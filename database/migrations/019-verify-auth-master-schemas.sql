-- Safety checks after schema split.
-- This migration fails fast if critical tables are not in the expected schema.

DO $$
DECLARE
  missing_auth_tables text[];
  missing_master_tables text[];
BEGIN
  SELECT array_agg(required_table)
  INTO missing_auth_tables
  FROM (
    SELECT unnest(ARRAY[
      'users',
      'roles',
      'permissions',
      'user_roles',
      'role_permissions',
      'departments',
      'user_role_assignments'
    ]) AS required_table
  ) expected
  WHERE to_regclass('auth.' || expected.required_table) IS NULL;

  IF missing_auth_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Missing auth schema tables: %', array_to_string(missing_auth_tables, ', ');
  END IF;

  SELECT array_agg(required_table)
  INTO missing_master_tables
  FROM (
    SELECT unnest(ARRAY[
      'materials_type',
      'loading_points',
      'models',
      'issuing_types',
      'process_lines',
      'delivery_types',
      'materials_location',
      'units',
      'supplier',
      'materials',
      'customers',
      'product_types',
      'product_process_lines',
      'product_delivery_types',
      'product_units',
      'product_models',
      'product_loading_points',
      'product_locations',
      'products',
      'product_bom',
      'product_production_steps',
      'production_processes'
    ]) AS required_table
  ) expected
  WHERE to_regclass('master.' || expected.required_table) IS NULL;

  IF missing_master_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Missing master schema tables: %', array_to_string(missing_master_tables, ', ');
  END IF;
END $$;
