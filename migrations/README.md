# Database Migration Instructions

## Product Master Data Tables Migration

### Prerequisites
- PostgreSQL installed
- Database credentials (username, password, database name)

### Run Migration

Replace the placeholders with your actual database credentials:

```bash
psql -U your_username -d your_database_name -f migrations/add-product-master-data-tables.sql
```

### Example:
```bash
psql -U postgres -d cci_db -f migrations/add-product-master-data-tables.sql
```

### Alternative: Using password prompt
```bash
psql -U postgres -d cci_db -W -f migrations/add-product-master-data-tables.sql
```

### Using environment variables
```bash
PGPASSWORD=your_password psql -U postgres -d cci_db -f migrations/add-product-master-data-tables.sql
```

### What this migration does:
1. Creates 6 new master data tables:
   - product_types
   - product_models
   - product_delivery_types
   - product_units
   - product_loading_points
   - product_process_lines

2. Adds new columns to products table:
   - product_type_id
   - lr
   - lot_size
   - min_stock
   - customer_id
   - model_id
   - delivery_type_id
   - unit_id
   - scale
   - loading_point_id
   - process_line_id

3. Creates foreign key constraints
4. Creates indexes for performance
5. Inserts sample data

### Rollback (if needed)
If you need to rollback, run:
```bash
psql -U your_username -d your_database_name -f migrations/rollback-product-master-data-tables.sql
```
