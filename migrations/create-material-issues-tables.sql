-- Material Issues Migration
-- Create tables for material issue management

-- Material Issues Table
CREATE TABLE IF NOT EXISTS material_issues (
    id SERIAL PRIMARY KEY,
    issue_no VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    issue_type VARCHAR(20) NOT NULL, -- MANUAL, PRODUCTION
    production_order_no VARCHAR(50),
    product_id INTEGER REFERENCES products(id),
    production_quantity INTEGER,
    document_no VARCHAR(50),
    document_file TEXT,
    remarks TEXT,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    is_active BOOLEAN DEFAULT true,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    create_by VARCHAR(255),
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(255)
);

-- Material Issue Items Table
CREATE TABLE IF NOT EXISTS material_issue_items (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER REFERENCES material_issues(id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES materials(id),
    quantity_per_unit DECIMAL(15,4),
    issued_quantity DECIMAL(15,4) NOT NULL,
    unit VARCHAR(50),
    from_location_id INTEGER,
    remarks TEXT,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    create_by VARCHAR(255)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_material_issues_issue_no ON material_issues(issue_no);
CREATE INDEX IF NOT EXISTS idx_material_issues_issue_date ON material_issues(issue_date);
CREATE INDEX IF NOT EXISTS idx_material_issues_issue_type ON material_issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_material_issues_product_id ON material_issues(product_id);
CREATE INDEX IF NOT EXISTS idx_material_issue_items_issue_id ON material_issue_items(issue_id);
CREATE INDEX IF NOT EXISTS idx_material_issue_items_material_id ON material_issue_items(material_id);

-- Comments
COMMENT ON TABLE material_issues IS 'Material issue transactions';
COMMENT ON TABLE material_issue_items IS 'Material issue item details';
