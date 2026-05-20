-- Enforce alphanumeric PO numbers on material_receiving.po_no (nullable).

UPDATE public.material_receiving
SET po_no = NULL
WHERE po_no IS NOT NULL
  AND po_no !~ '^[A-Za-z0-9]+$';

ALTER TABLE public.material_receiving
  DROP CONSTRAINT IF EXISTS material_receiving_po_no_format_chk;

ALTER TABLE public.material_receiving
  ADD CONSTRAINT material_receiving_po_no_format_chk
  CHECK (po_no IS NULL OR po_no ~ '^[A-Za-z0-9]+$');
