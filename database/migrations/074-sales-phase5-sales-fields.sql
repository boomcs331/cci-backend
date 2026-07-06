-- Phase 5: Add sales-specific fields to products and customers

-- Add sales fields to products
ALTER TABLE master.products
ADD COLUMN IF NOT EXISTS barcode VARCHAR(50),
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS category_id INTEGER;

-- Add sales fields to customers
ALTER TABLE master.customers
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100),
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);

-- Add comments
COMMENT ON COLUMN master.products.barcode IS 'Barcode for product scanning';
COMMENT ON COLUMN master.products.sale_price IS 'Default selling price for sales orders';
COMMENT ON COLUMN master.products.category_id IS 'Product category reference';

COMMENT ON COLUMN master.customers.credit_limit IS 'Maximum credit amount for this customer';
COMMENT ON COLUMN master.customers.credit_balance IS 'Current credit balance (outstanding)';
COMMENT ON COLUMN master.customers.payment_terms IS 'Payment terms (e.g., NET 30, NET 60)';
COMMENT ON COLUMN master.customers.tax_id IS 'Tax ID / VAT number';
