-- Allow printable ASCII in po_no (English, digits, spaces, special characters).

ALTER TABLE public.material_receiving
  DROP CONSTRAINT IF EXISTS material_receiving_po_no_format_chk;

ALTER TABLE public.material_receiving
  ADD CONSTRAINT material_receiving_po_no_format_chk
  CHECK (po_no IS NULL OR po_no ~ '^[\x20-\x7E]+$');
