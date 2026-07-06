-- รูปภาพสินค้า — path สัมพันธ์กับ static /uploads/
ALTER TABLE master.products
  ADD COLUMN IF NOT EXISTS product_image_path VARCHAR(500) NULL;
