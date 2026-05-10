-- Stock mirror table lives in public (with product_sales_reservations), not master data.

DO $$
BEGIN
  IF to_regclass('master.products_stock') IS NOT NULL
     AND to_regclass('public.products_stock') IS NULL THEN
    ALTER TABLE master.products_stock SET SCHEMA public;
  END IF;
END $$;
