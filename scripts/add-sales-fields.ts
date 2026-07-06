import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function addSalesFields() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'cci',
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    const queryRunner = dataSource.createQueryRunner();

    // Add sales fields to products
    await queryRunner.query(`
      ALTER TABLE master.products
      ADD COLUMN IF NOT EXISTS barcode VARCHAR(50),
      ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS category_id INTEGER
    `);
    console.log('Added sales fields to products');

    // Add sales fields to customers
    await queryRunner.query(`
      ALTER TABLE master.customers
      ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(15, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(15, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100),
      ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50)
    `);
    console.log('Added sales fields to customers');

    await queryRunner.release();
    await dataSource.destroy();
    console.log('Done');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addSalesFields();
