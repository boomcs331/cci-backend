-- Ensure log tables are not duplicated in public schema

DO $$
DECLARE
  public_logs_tables text[];
BEGIN
  SELECT array_agg(table_name)
  INTO public_logs_tables
  FROM (
    SELECT unnest(ARRAY[
      'api_logs',
      'auth_logs'
    ]) AS table_name
  ) expected
  WHERE to_regclass('public.' || expected.table_name) IS NOT NULL;

  IF public_logs_tables IS NOT NULL THEN
    RAISE EXCEPTION
      'Log tables still exist in public schema: %',
      array_to_string(public_logs_tables, ', ');
  END IF;
END $$;
