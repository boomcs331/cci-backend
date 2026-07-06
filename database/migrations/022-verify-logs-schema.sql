-- Verify log tables exist in logs schema

DO $$
DECLARE
  missing_logs_tables text[];
BEGIN
  SELECT array_agg(required_table)
  INTO missing_logs_tables
  FROM (
    SELECT unnest(ARRAY[
      'api_logs',
      'auth_logs'
    ]) AS required_table
  ) expected
  WHERE to_regclass('logs.' || expected.required_table) IS NULL;

  IF missing_logs_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Missing logs schema tables: %', array_to_string(missing_logs_tables, ', ');
  END IF;
END $$;
