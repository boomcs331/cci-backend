-- Migration: Add material_issue_documents table
-- Description: Create table to support multiple document files for material issues

CREATE TABLE material_issue_documents (
  id SERIAL PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES material_issues(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  create_by VARCHAR(255)
);

CREATE INDEX idx_material_issue_documents_issue_id ON material_issue_documents(issue_id);

COMMENT ON TABLE material_issue_documents IS 'Stores multiple document files for material issues';
COMMENT ON COLUMN material_issue_documents.issue_id IS 'Foreign key to material_issues table';
COMMENT ON COLUMN material_issue_documents.file_name IS 'Original file name';
COMMENT ON COLUMN material_issue_documents.file_path IS 'File storage path';
COMMENT ON COLUMN material_issue_documents.file_type IS 'MIME type of the file';
COMMENT ON COLUMN material_issue_documents.file_size IS 'File size in bytes';
