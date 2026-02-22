-- Rollback: Remove material_issue_documents table
-- Description: Drop table and related objects

DROP INDEX IF EXISTS idx_material_issue_documents_issue_id;
DROP TABLE IF EXISTS material_issue_documents;
