# Database Skill

## Purpose
Guide AI agents in database-related tasks including migrations, schema changes, and data operations following Loop Engineering principles.

## When to Use
- Creating new database tables
- Adding/modifying columns
- Creating indexes
- Writing database migrations
- Seeding data
- Optimizing database queries
- Fixing database issues

## Required Context Files (Read First)
1. `.project-ai/database-map.md` - Understand database schema
2. `.project-ai/architecture.md` - Understand database architecture
3. `.project-ai/coding-rules.md` - Follow database coding rules
4. `.project-ai/domain-rules.md` - Understand business rules affecting data

## Step-by-Step Workflow

### Step 1: Understand the Requirement
- Identify what database change is needed
- Determine which schema is affected (auth, master, sales, logs, public)
- Check if similar table/column exists
- Verify business rules for data integrity

### Step 2: Read Existing Schema
- Read database-map.md for schema overview
- Read existing migration files for patterns
- Read relevant entity files
- Check for foreign key relationships
- Identify indexes and constraints

### Step 3: Plan the Change
- Determine migration file number (next sequential)
- Design table/column structure
- Plan indexes for performance
- Identify foreign key relationships
- Plan data migration if needed
- Consider rollback strategy

### Step 4: Write Migration (One Loop)
- Create migration file in `database/migrations/`
- Use sequential numbering (e.g., 088-add-feature.sql)
- Write idempotent SQL
- Include BEGIN/COMMIT transactions
- Add comments for clarity
- Include rollback comments if possible

### Step 5: Update Entity (One Loop)
- Add/update entity in `src/modules/*/entities/`
- Map column names if different (snake_case to camelCase)
- Add decorators (@Column, @Index, etc.)
- Update relationships if needed
- Keep in separate loop from migration

### Step 6: Update DTOs (One Loop)
- Add new fields to DTOs
- Add validation decorators
- Update create/update DTOs
- Keep in separate loop from entity

### Step 7: Test Migration
- Run migration: `pnpm run db:migrate`
- Verify table/column created correctly
- Check indexes created
- Test foreign key constraints
- Test with sample data

### Step 8: Update Documentation
- Update database-map.md with new schema
- Update api-map.md if API affected
- Update domain-rules.md if business rules changed
- Add comments to migration file

### Step 9: Summarize
- Document the change
- Note any data migration
- List files modified
- Record any side effects

## Safety Rules

### Before Writing Migration
- ✅ Understand the requirement completely
- ✅ Check existing schema
- ✅ Verify business rules
- ✅ Plan rollback strategy
- ✅ Identify dependencies
- ❌ Never write migration without understanding
- ❌ Never skip checking existing patterns
- ❌ Never change schema without migration

### During Migration
- ✅ Use sequential numbering
- ✅ Write idempotent SQL
- ✅ Use transactions (BEGIN/COMMIT)
- ✅ Add descriptive comments
- ✅ Include rollback comments
- ✅ Use proper data types
- ✅ Add constraints appropriately
- ❌ Never use DROP without IF EXISTS
- ❌ Never hardcode IDs
- ❌ Never skip indexes for queried columns

### After Migration
- ✅ Test migration on development DB
- ✅ Verify schema changes
- ✅ Test with application
- ✅ Update documentation
- ✅ Commit migration file
- ❌ Never skip testing
- ❌ Never commit untested migrations
- ❌ Never leave migration without rollback

## Output Format

### Database Change Summary
```markdown
## Database Change Summary

**Migration Number**: [number]
**Migration File**: [filename]
**Schema**: [schema name]
**Change Type**: [add table/add column/add index/etc.]

### Migration Details
**Description**: [what the migration does]
**Tables Affected**: [list of tables]
**Columns Added**: [list of columns]
**Indexes Added**: [list of indexes]
**Foreign Keys**: [list of foreign keys]

### Files Modified
- database/migrations/[filename].sql
- src/modules/[module]/entities/[entity].ts
- src/modules/[module]/dto/[dto].ts

### Validation
- ✅ Migration runs successfully
- ✅ Schema verified
- ✅ Entity mapping correct
- ✅ Application works with new schema
- ✅ Rollback tested (if applicable)

### Documentation Updated
- ✅ database-map.md
- ✅ api-map.md (if API affected)
```

## Validation Checklist

### Migration Quality
- [ ] File uses sequential numbering
- [ ] SQL is idempotent
- [ ] Uses transactions (BEGIN/COMMIT)
- [ ] Has descriptive comments
- [ ] Includes rollback comments
- [ ] Proper data types used
- [ ] Constraints appropriate

### Schema Correctness
- [ ] Table follows naming convention
- [ ] Column names are snake_case
- [ ] Primary key defined
- [ ] Foreign keys have proper constraints
- [ ] Indexes added for queried columns
- [ ] Default values appropriate

### Entity Mapping
- [ ] Entity maps to correct table
- [ ] Column names mapped correctly
- [ ] Decorators appropriate
- [ ] Relationships defined correctly
- [ ] TypeScript types correct

### Data Integrity
- [ ] Foreign key constraints valid
- [ ] Check constraints appropriate
- [ ] Unique constraints correct
- [ ] Not null constraints correct
- [ ] Default values correct

### Testing
- [ ] Migration runs without errors
- [ ] Schema verified in database
- [ ] Application starts successfully
- [ ] CRUD operations work
- [ ] Rollback tested (if applicable)

## Common Migration Patterns

### Create Table
```sql
-- Migration: 088-add-new-table.sql
BEGIN;

CREATE TABLE IF NOT EXISTS schema_name.table_name (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_table_name_code ON schema_name.table_name(code);
CREATE INDEX IF NOT EXISTS idx_table_name_active ON schema_name.table_name(is_active);

COMMIT;

-- Rollback: DROP TABLE IF EXISTS schema_name.table_name CASCADE;
```

### Add Column
```sql
-- Migration: 089-add-column.sql
BEGIN;

ALTER TABLE schema_name.table_name
ADD COLUMN IF NOT EXISTS new_column VARCHAR(255);

-- Add index if needed
CREATE INDEX IF NOT EXISTS idx_table_name_new_column ON schema_name.table_name(new_column);

COMMIT;

-- Rollback: ALTER TABLE schema_name.table_name DROP COLUMN IF EXISTS new_column;
```

### Add Foreign Key
```sql
-- Migration: 090-add-foreign-key.sql
BEGIN;

ALTER TABLE schema_name.table_name
ADD CONSTRAINT fk_table_name_other_table
FOREIGN KEY (other_id)
REFERENCES other_schema.other_table(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

COMMIT;

-- Rollback: ALTER TABLE schema_name.table_name DROP CONSTRAINT IF EXISTS fk_table_name_other_table;
```

### Add Index
```sql
-- Migration: 091-add-index.sql
BEGIN;

CREATE INDEX IF NOT EXISTS idx_table_name_column1_column2
ON schema_name.table_name(column1, column2);

COMMIT;

-- Rollback: DROP INDEX IF EXISTS schema_name.idx_table_name_column1_column2;
```

### Data Migration
```sql
-- Migration: 092-migrate-data.sql
BEGIN;

-- Add new column
ALTER TABLE schema_name.table_name
ADD COLUMN IF NOT EXISTS new_status VARCHAR(50);

-- Migrate data
UPDATE schema_name.table_name
SET new_status = CASE
    WHEN old_status = 'A' THEN 'ACTIVE'
    WHEN old_status = 'I' THEN 'INACTIVE'
    ELSE 'UNKNOWN'
END;

-- Add constraint after data migration
ALTER TABLE schema_name.table_name
ADD CONSTRAINT chk_table_name_status
CHECK (new_status IN ('ACTIVE', 'INACTIVE', 'UNKNOWN'));

COMMIT;

-- Rollback: ALTER TABLE schema_name.table_name DROP COLUMN IF EXISTS new_status;
```

## Entity Mapping Template

```typescript
@Entity({ schema: 'schema_name', name: 'table_name' })
export class TableNameEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'column_name' })
  columnName: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => OtherEntity)
  @JoinColumn({ name: 'other_id' })
  other: OtherEntity;
}
```

## Running Migrations

### Run All Migrations
```bash
pnpm run db:migrate
```

### Run Single Migration
```bash
ts-node scripts/run-one-migration.ts migration-number
```

### Run Migration with Log
```bash
ts-node scripts/run-migration-with-log.ts migration-number
```

## When to Stop and Ask
- Schema change affects critical system → Get approval
- Data migration is complex → Get review
- Breaking change required → Get approval
- Performance impact uncertain → Get review
- Foreign key relationship unclear → Verify with domain expert

## Emergency Procedures
If migration fails:
1. Check error message
2. Verify SQL syntax
3. Check for existing data conflicts
4. Test rollback SQL
5. Fix migration
6. Test again

If migration causes issues:
1. Rollback immediately
2. Investigate the issue
3. Fix migration
4. Test rollback and re-apply
5. Get help if stuck

## Best Practices
- Always test migrations on development database first
- Use IF EXISTS to prevent errors
- Include rollback comments
- Write descriptive commit messages
- Keep migrations small and focused
- Never modify committed migrations
- Use proper data types
- Add indexes for frequently queried columns
- Consider foreign key cascading carefully
