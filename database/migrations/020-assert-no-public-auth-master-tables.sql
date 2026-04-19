-- Ensure no duplicated auth/master tables remain in public schema.
-- Fail fast to prevent schema drift after split.

DO $$
DECLARE
  public_auth_tables text[];
  public_master_tables text[];
BEGIN
  SELECT array_agg(table_name)
  INTO public_auth_tables
  FROM (
    SELECT unnest(ARRAY[
      'users',
      'roles',
      'permissions',
      'user_roles',
      'role_permissions',
      'departments',
      'user_role_assignments'
    ]) AS table_name
  ) expected
  WHERE to_regclass('public.' || expected.table_name) IS NOT NULL;

  IF public_auth_tables IS NOT NULL THEN
    RAISE EXCEPTION
      'Auth tables still exist in public schema: %',
      array_to_string(public_auth_tables, ', ');
  END IF;

  SELECT array_agg(table_name)
  INTO public_master_tables
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
    ]) AS table_name
  ) expected
  WHERE to_regclass('public.' || expected.table_name) IS NOT NULL;

  IF public_master_tables IS NOT NULL THEN
    RAISE EXCEPTION
      'Master tables still exist in public schema: %',
      array_to_string(public_master_tables, ', ');
  END IF;
END $$;
