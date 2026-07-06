-- 080-sales-planning-tables.sql
-- Migration for Sales Planning Import System
-- Creates tables in sales schema for sales planning data management

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS sales.planning_history CASCADE;
DROP TABLE IF EXISTS sales.planning_errors CASCADE;
DROP TABLE IF EXISTS sales.planning_rows CASCADE;
DROP TABLE IF EXISTS sales.planning_batches CASCADE;

-- Drop function if exists
DROP FUNCTION IF EXISTS sales.update_planning_updated_at_column() CASCADE;

-- Ensure sales schema exists
CREATE SCHEMA IF NOT EXISTS sales;

-- Set search path for this session
SET search_path TO sales, public;

-- ============================================
-- 1. Planning Batches Table
-- ============================================
-- Stores import batch information (header level)
CREATE TABLE sales.planning_batches (
  id SERIAL PRIMARY KEY,
  batch_code VARCHAR(50) UNIQUE NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
    CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED')),
  total_rows INTEGER NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
  success_rows INTEGER NOT NULL DEFAULT 0 CHECK (success_rows >= 0),
  error_rows INTEGER NOT NULL DEFAULT 0 CHECK (error_rows >= 0),
  skipped_rows INTEGER NOT NULL DEFAULT 0 CHECK (skipped_rows >= 0),
  file_name VARCHAR(255),
  file_path TEXT,
  file_size BIGINT CHECK (file_size >= 0),
  file_hash VARCHAR(64),
  uploaded_by INTEGER NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  processing_duration_ms INTEGER,
  error_summary JSONB,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uk_year_month UNIQUE (year, month)
);

-- Indexes for planning_batches
CREATE INDEX idx_planning_batches_year_month ON sales.planning_batches(year, month);
CREATE INDEX idx_planning_batches_status ON sales.planning_batches(status);
CREATE INDEX idx_planning_batches_uploaded_by ON sales.planning_batches(uploaded_by);
CREATE INDEX idx_planning_batches_uploaded_at ON sales.planning_batches(uploaded_at DESC);
CREATE INDEX idx_planning_batches_batch_code ON sales.planning_batches(batch_code);

-- ============================================
-- 2. Planning Rows Table
-- ============================================
-- Stores transformed daily planning data (detail level)
CREATE TABLE sales.planning_rows (
  id BIGSERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL,
  customer_code VARCHAR(50) NOT NULL,
  customer_id INTEGER,
  product_code VARCHAR(50) NOT NULL,
  product_id INTEGER,
  model VARCHAR(100),
  sale_date DATE NOT NULL,
  quantity DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  original_row_number INTEGER NOT NULL CHECK (original_row_number > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'VALID'
    CHECK (status IN ('VALID', 'INVALID', 'SKIPPED')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_planning_rows_batch 
    FOREIGN KEY (batch_id) 
    REFERENCES sales.planning_batches(id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_planning_rows_customer 
    FOREIGN KEY (customer_id) 
    REFERENCES master.customers(id) 
    ON DELETE SET NULL,
  CONSTRAINT fk_planning_rows_product 
    FOREIGN KEY (product_id) 
    REFERENCES master.products(id) 
    ON DELETE SET NULL,
  CONSTRAINT uk_batch_customer_product_date 
    UNIQUE (batch_id, customer_code, product_code, sale_date)
);

-- Indexes for planning_rows
CREATE INDEX idx_planning_rows_batch_id ON sales.planning_rows(batch_id);
CREATE INDEX idx_planning_rows_sale_date ON sales.planning_rows(sale_date);
CREATE INDEX idx_planning_rows_customer_code ON sales.planning_rows(customer_code);
CREATE INDEX idx_planning_rows_product_code ON sales.planning_rows(product_code);
CREATE INDEX idx_planning_rows_customer_id ON sales.planning_rows(customer_id);
CREATE INDEX idx_planning_rows_product_id ON sales.planning_rows(product_id);
CREATE INDEX idx_planning_rows_status ON sales.planning_rows(status);
CREATE INDEX idx_planning_rows_composite ON sales.planning_rows(sale_date, customer_code, product_code);

-- ============================================
-- 3. Planning Errors Table
-- ============================================
-- Stores detailed validation errors
CREATE TABLE sales.planning_errors (
  id BIGSERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL,
  row_number INTEGER NOT NULL CHECK (row_number > 0),
  error_type VARCHAR(50) NOT NULL,
  error_code VARCHAR(50) NOT NULL,
  error_message TEXT NOT NULL,
  field_name VARCHAR(50),
  field_value TEXT,
  severity VARCHAR(20) NOT NULL DEFAULT 'ERROR'
    CHECK (severity IN ('ERROR', 'WARNING', 'INFO')),
  error_details JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_planning_errors_batch 
    FOREIGN KEY (batch_id) 
    REFERENCES sales.planning_batches(id) 
    ON DELETE CASCADE
);

-- Indexes for planning_errors
CREATE INDEX idx_planning_errors_batch_id ON sales.planning_errors(batch_id);
CREATE INDEX idx_planning_errors_row_number ON sales.planning_errors(row_number);
CREATE INDEX idx_planning_errors_error_type ON sales.planning_errors(error_type);
CREATE INDEX idx_planning_errors_error_code ON sales.planning_errors(error_code);
CREATE INDEX idx_planning_errors_severity ON sales.planning_errors(severity);

-- ============================================
-- 4. Planning History Table
-- ============================================
-- Audit trail for planning data changes
CREATE TABLE sales.planning_history (
  id BIGSERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL,
  planning_row_id BIGINT,
  action VARCHAR(20) NOT NULL
    CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'IMPORT', 'OVERWRITE')),
  old_quantity DECIMAL(15, 2),
  new_quantity DECIMAL(15, 2),
  changed_by INTEGER NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  change_reason TEXT,
  metadata JSONB,
  
  CONSTRAINT fk_planning_history_batch 
    FOREIGN KEY (batch_id) 
    REFERENCES sales.planning_batches(id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_planning_history_row 
    FOREIGN KEY (planning_row_id) 
    REFERENCES sales.planning_rows(id) 
    ON DELETE SET NULL
);

-- Indexes for planning_history
CREATE INDEX idx_planning_history_batch_id ON sales.planning_history(batch_id);
CREATE INDEX idx_planning_history_planning_row_id ON sales.planning_history(planning_row_id);
CREATE INDEX idx_planning_history_changed_by ON sales.planning_history(changed_by);
CREATE INDEX idx_planning_history_changed_at ON sales.planning_history(changed_at DESC);
CREATE INDEX idx_planning_history_action ON sales.planning_history(action);

-- ============================================
-- 5. Create trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION sales.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_planning_batches_updated_at 
  BEFORE UPDATE ON sales.planning_batches 
  FOR EACH ROW EXECUTE FUNCTION sales.update_updated_at_column();

CREATE TRIGGER update_planning_rows_updated_at 
  BEFORE UPDATE ON sales.planning_rows 
  FOR EACH ROW EXECUTE FUNCTION sales.update_updated_at_column();

-- ============================================
-- 6. Comments
-- ============================================
COMMENT ON SCHEMA sales IS 'Schema for sales data including planning and actual sales';

COMMENT ON TABLE sales.planning_batches IS 'Stores import batch information for sales planning';
COMMENT ON TABLE sales.planning_rows IS 'Stores transformed daily planning data';
COMMENT ON TABLE sales.planning_errors IS 'Stores detailed validation errors';
COMMENT ON TABLE sales.planning_history IS 'Audit trail for planning data changes';

COMMENT ON COLUMN sales.planning_batches.batch_code IS 'Unique identifier for the import batch';
COMMENT ON COLUMN sales.planning_batches.error_summary IS 'JSON summary of errors (counts by type)';
COMMENT ON COLUMN sales.planning_batches.file_hash IS 'MD5 hash of uploaded file for deduplication';
COMMENT ON COLUMN sales.planning_batches.processing_duration_ms IS 'Processing time in milliseconds';

COMMENT ON COLUMN sales.planning_rows.quantity IS 'Planned quantity for the sale date';
COMMENT ON COLUMN sales.planning_rows.original_row_number IS 'Row number in original Excel file';
COMMENT ON COLUMN sales.planning_rows.metadata IS 'Additional metadata in JSON format';

COMMENT ON COLUMN sales.planning_errors.error_details IS 'Detailed error information in JSON format';
COMMENT ON COLUMN sales.planning_errors.severity IS 'Error severity: ERROR, WARNING, or INFO';

COMMENT ON COLUMN sales.planning_history.action IS 'Action type: CREATE, UPDATE, DELETE, IMPORT, or OVERWRITE';
COMMENT ON COLUMN sales.planning_history.change_reason IS 'Reason for the change';

-- ============================================
-- 7. Grant Permissions
-- ============================================
-- Grant usage on schema
GRANT USAGE ON SCHEMA sales TO PUBLIC;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA sales TO PUBLIC;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA sales TO PUBLIC;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION sales.update_updated_at_column() TO PUBLIC;

-- ============================================
-- 8. Verification
-- ============================================
-- Verify tables were created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'sales' AND table_name = 'planning_batches') THEN
    RAISE NOTICE 'Table sales.planning_batches created successfully';
  ELSE
    RAISE EXCEPTION 'Table sales.planning_batches was not created';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'sales' AND table_name = 'planning_rows') THEN
    RAISE NOTICE 'Table sales.planning_rows created successfully';
  ELSE
    RAISE EXCEPTION 'Table sales.planning_rows was not created';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'sales' AND table_name = 'planning_errors') THEN
    RAISE NOTICE 'Table sales.planning_errors created successfully';
  ELSE
    RAISE EXCEPTION 'Table sales.planning_errors was not created';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'sales' AND table_name = 'planning_history') THEN
    RAISE NOTICE 'Table sales.planning_history created successfully';
  ELSE
    RAISE EXCEPTION 'Table sales.planning_history was not created';
  END IF;
END $$;
