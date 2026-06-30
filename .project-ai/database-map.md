# Database Map

## Database Overview
- **Database Type**: PostgreSQL
- **ORM**: TypeORM
- **Connection**: Configured in libs/common/src/database/database.module.ts
- **Migrations**: Located in database/migrations/ (files 004-087)

## Schema Organization

### auth Schema
Authentication and authorization data.

#### Tables
- **users** - User accounts
  - id (PK), username, password_hash, email, full_name, is_active, created_at, updated_at
  - Entity: `src/modules/auth/entities/user.entity.ts`

- **roles** - User roles
  - id (PK), name, description, created_at, updated_at
  - Entity: `src/modules/auth/entities/role.entity.ts`

- **permissions** - Permission definitions
  - id (PK), code, name, description, created_at, updated_at
  - Entity: `src/modules/auth/entities/permission.entity.ts`

- **menus** - Menu/navigation items
  - id (PK), name, path, icon, parent_id, order, created_at, updated_at
  - Entity: `src/modules/auth/entities/menu.entity.ts`

- **departments** - Organizational departments
  - id (PK), name, code, created_at, updated_at
  - Entity: `src/modules/auth/entities/department.entity.ts`

- **user_role_assignments** - User-role mappings
  - id (PK), user_id (FK), role_id (FK), department_id (FK), created_at
  - Entity: `src/modules/auth/entities/user-role-assignment.entity.ts`

- **user_departments** - User-department mappings
  - id (PK), user_id (FK), department_id (FK), created_at
  - Entity: `src/modules/auth/entities/user-department.entity.ts`

### master Schema
Master data for products, materials, and production processes.

#### Tables
- **products** - Product master data
  - id (PK), code, name, description, category, uom, is_active, created_at, updated_at
  - Entity: `src/modules/products/entities/product.entity.ts`

- **product_bom** - Bill of Materials
  - id (PK), product_id (FK), material_id (FK), quantity, created_at, updated_at
  - Entity: `src/modules/products/entities/product-bom.entity.ts`

- **product_locations** - Product storage locations
  - id (PK), product_id (FK), location_code, created_at, updated_at
  - Entity: `src/modules/products/entities/product-location.entity.ts`

- **materials** - Material master data
  - id (PK), code, name, description, category_id, uom, is_active, created_at, updated_at
  - Entity: `src/modules/materials/entities/material.entity.ts`

- **material_categories** - Material categories
  - id (PK), name, code, parent_id, created_at, updated_at
  - Entity: `src/modules/materials/entities/material-category.entity.ts`

- **production_processes** - Production process definitions
  - id (PK), code, name, description, department_id, created_at, updated_at
  - Entity: `src/modules/production-orders/entities/production-process.entity.ts`

- **production_steps** - Production step definitions
  - id (PK), process_id (FK), step_code, step_name, order, created_at, updated_at
  - Entity: `src/modules/products/entities/product-production-steps.entity.ts`

### sales Schema
Sales orders, customers, and planning data.

#### Tables
- **orders** - Sales orders
  - id (PK), order_no, customer_id, order_date, delivery_date, status, total_amount, created_at, updated_at
  - Entity: `src/modules/sales/entities/order.entity.ts`

- **order_items** - Sales order line items
  - id (PK), order_id (FK), product_id, quantity, unit_price, total_price, created_at, updated_at
  - Entity: `src/modules/sales/entities/order-item.entity.ts`

- **order_approvals** - Order approval records
  - id (PK), order_id (FK), approver_id, approval_status, approved_at, comments, created_at
  - Entity: `src/modules/sales/entities/order-approval.entity.ts`

- **order_status_history** - Order status change history
  - id (PK), order_id (FK), status, changed_by, changed_at, comments
  - Entity: `src/modules/sales/entities/order-status-history.entity.ts`

- **customers** - Customer master data
  - id (PK), code, name, address, contact_person, phone, email, created_at, updated_at
  - Entity: `src/modules/sales/entities/customer.entity.ts`

- **planning_batches** - Sales planning batches
  - id (PK), batch_name, status, created_by, created_at, updated_at
  - Entity: `src/modules/sales-planning/entities/planning-batch.entity.ts`

- **planning_rows** - Sales planning data rows
  - id (PK), batch_id (FK), product_id, quantity, planned_date, customer_id, line, created_at, updated_at
  - Entity: `src/modules/sales-planning/entities/planning-row.entity.ts`

- **planning_history** - Planning change history
  - id (PK), batch_id (FK), changed_by, change_type, change_details, changed_at
  - Entity: `src/modules/sales-planning/entities/planning-history.entity.ts`

- **planning_errors** - Planning import errors
  - id (PK), batch_id (FK), row_number, error_message, created_at
  - Entity: `src/modules/sales-planning/entities/planning-error.entity.ts`

- **import_batches** - Sales import batches
  - id (PK), file_name, status, total_rows, success_rows, error_rows, created_by, created_at
  - Entity: `src/modules/sales/entities/import-batch.entity.ts`

- **import_rows** - Sales import data rows
  - id (PK), batch_id (FK), row_data, status, error_message, created_at
  - Entity: `src/modules/sales/entities/import-row.entity.ts`

### logs Schema
Audit and logging data.

#### Tables
- **api_logs** - API request/response logs
  - id (PK), user_id, method, path, status_code, request_body, response_body, ip_address, user_agent, created_at
  - Entity: `src/core/audit/entities/api-log.entity.ts`

- **auth_logs** - Authentication event logs
  - id (PK), user_id, event_type, ip_address, user_agent, success, created_at
  - Entity: `src/core/audit/entities/auth-log.entity.ts`

- **qr_scan_logs** - QR code scan logs
  - id (PK), user_id, scan_type, scan_data, context, created_at
  - Entity: `src/core/audit/entities/qr-scan-log.entity.ts`

### public Schema
Transaction and movement data (cross-schema references).

#### Tables
- **product_stock_movements** - Product stock movement records
  - id (PK), product_id, movement_type, quantity, reference_type, reference_id, created_at
  - Entity: `src/modules/sales/entities/product-stock-movement.entity.ts`

- **product_fg_lot_movements** - Finished goods lot movement records
  - id (PK), lot_id, movement_type, quantity, reference_type, reference_id, created_at
  - Entity: `src/modules/products/entities/product-fg-lot-movement.entity.ts`

- **material_transactions** - Material transaction records
  - id (PK), material_id, transaction_type, quantity, po_number, reference_type, reference_id, created_at
  - Entity: `src/modules/materials/entities/material-transaction.entity.ts`

- **production_plans** - Production plan headers
  - id (PK), plan_no, status, planned_start_date, planned_end_date, created_by, created_at, updated_at
  - Entity: `src/modules/production-plans/entities/production-plan.entity.ts`

- **production_plan_items** - Production plan line items
  - id (PK), plan_id (FK), product_id, quantity, created_at, updated_at
  - Entity: `src/modules/production-plans/entities/production-plan-item.entity.ts`

- **material_reservations** - Material reservations for production
  - id (PK), plan_id (FK), material_id, quantity, status, created_at, updated_at
  - Entity: `src/modules/production-plans/entities/material-reservation.entity.ts`

- **production_orders** - Production order headers
  - id (PK), order_no, plan_id, status, start_date, end_date, created_by, created_at, updated_at
  - Entity: `src/modules/production-orders/entities/production-order.entity.ts`

- **production_lots** - Production lot tracking
  - id (PK), order_id (FK), lot_no, status, created_at, updated_at
  - Entity: `src/modules/production-orders/entities/production-lot.entity.ts`

- **production_lot_steps** - Production lot step tracking
  - id (PK), lot_id (FK), step_id, quantity, status, completed_at, created_at
  - Entity: `src/modules/production-orders/entities/production-lot-step.entity.ts`

## Key Relationships

### User Relationships
- users → user_role_assignments ← roles
- users → user_departments ← departments
- user_role_assignments → departments

### Product Relationships
- products → product_bom ← materials
- products → product_locations
- products → production_plan_items
- products → order_items

### Material Relationships
- materials → material_categories
- materials → product_bom ← products
- materials → material_transactions
- materials → material_reservations

### Production Relationships
- production_plans → production_plan_items
- production_plans → material_reservations ← materials
- production_plans → production_orders
- production_orders → production_lots
- production_lots → production_lot_steps

### Sales Relationships
- orders → order_items
- orders → order_approvals
- orders → order_status_history
- orders ← customers
- planning_batches → planning_rows
- planning_batches → planning_history
- planning_batches → planning_errors

## Migration Files

### Key Migrations
- **004-014**: Production orders schema and setup
- **015-020**: Auth department-scoped RBAC implementation
- **021-023**: Logs schema migration
- **024-026**: Auth menu navigation and admin management
- **027-032**: Product stock and menu setup
- **033-036**: Production process department stations
- **037-040**: Production lot splitting and lineage
- **041-043**: Material receiving PO number format
- **044-045**: Master data production menus
- **046-050**: Product images and press department
- **051-059**: User roles, permissions, and multi-department setup
- **060-064**: Lot tracking and FG lots
- **065-075**: Sales schema, permissions, and menus
- **080-087**: Sales planning tables and delivery rounds

## Database Connection

### Configuration
- **Module**: `libs/common/src/database/database.module.ts`
- **Environment Variables**:
  - `DB_HOST`: Database host
  - `DB_PORT`: Database port
  - `DB_USERNAME`: Database username
  - `DB_PASSWORD`: Database password
  - `DB_DATABASE`: Database name

### Connection Options
- Type: postgres
- Synchronize: false (use migrations)
- Logging: true (development)
- Entities: Auto-loaded from modules

## Indexes

### Common Indexes
- Foreign key columns (user_id, role_id, department_id, etc.)
- Status columns for filtering
- Date columns for range queries
- Code/name columns for searching

### Performance Considerations
- Indexes added via migration files
- Composite indexes for frequently queried column combinations
- Unique constraints on code fields (product_code, material_code, etc.)

## Data Seeding

### Seed Scripts
- `scripts/seed-auth-data.ts` - Seed auth users and roles
- `scripts/insert-materials-mockup.ts` - Insert material mockup data
- `scripts/setup-logging-database.ts` - Setup logging database

### Seed Migrations
- Migration 026: Seed auth sample users
- Migration 051: Seed welding and press users
- Migration 054: Seed PC users and roles
- Migration 069: Seed sales users

## Database Backup & Restore

### Backup Strategy
- **Needs Confirmation**: Backup schedule and retention policy
- **Needs Confirmation**: Backup tool (pg_dump, custom script)

### Restore Process
- **Needs Confirmation**: Restore procedure
- **Needs Confirmation**: Rollback strategy for failed migrations

## Database Maintenance

### Regular Tasks
- **Vacuum**: Reclaim storage and maintain performance
- **Analyze**: Update statistics for query optimizer
- **Reindex**: Rebuild indexes for performance

### Monitoring
- Connection pool usage
- Query performance
- Table size growth
- Index usage statistics
