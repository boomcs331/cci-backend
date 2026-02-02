import { DataSource } from 'typeorm';
import * as path from 'path';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'cps_cci',
});

async function runMigration() {
  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = dataSource.createQueryRunner();

    console.log('🔄 Running migration: Add issuing types...');

    // Add new columns
    await queryRunner.query(`
      ALTER TABLE material_issuing 
      ADD COLUMN IF NOT EXISTS issuing_type VARCHAR(50) DEFAULT 'NORMAL_PRODUCTION',
      ADD COLUMN IF NOT EXISTS machine_no VARCHAR(50),
      ADD COLUMN IF NOT EXISTS part_no VARCHAR(50),
      ADD COLUMN IF NOT EXISTS requester VARCHAR(100);
    `);
    console.log('✅ Columns added');

    // Add comment
    await queryRunner.query(`
      COMMENT ON COLUMN material_issuing.issuing_type IS 'Type of issuing: NORMAL_PRODUCTION, STOCK_DEDUCTION, SPARE_PARTS_REPLACEMENT';
    `);
    console.log('✅ Comment added');

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_material_issuing_type ON material_issuing(issuing_type);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_material_issuing_machine_no ON material_issuing(machine_no);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_material_issuing_part_no ON material_issuing(part_no);
    `);
    console.log('✅ Indexes created');

    // Update existing records
    await queryRunner.query(`
      UPDATE material_issuing 
      SET issuing_type = 'NORMAL_PRODUCTION' 
      WHERE issuing_type IS NULL;
    `);
    console.log('✅ Existing records updated');

    await queryRunner.release();
    await dataSource.destroy();

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
