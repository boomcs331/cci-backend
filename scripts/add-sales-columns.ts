import { Client } from 'pg';

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'cps_cci'
});

async function main() {
  try {
    console.log('=== Starting migration ===');
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully');

    console.log('Adding credit_limit to customers...');
    await client.query('ALTER TABLE master.customers ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(15, 2) DEFAULT 0.00');
    console.log('✓ credit_limit added');

    console.log('Adding credit_balance to customers...');
    await client.query('ALTER TABLE master.customers ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(15, 2) DEFAULT 0.00');
    console.log('✓ credit_balance added');

    console.log('Adding payment_terms to customers...');
    await client.query('ALTER TABLE master.customers ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100)');
    console.log('✓ payment_terms added');

    console.log('Adding tax_id to customers...');
    await client.query('ALTER TABLE master.customers ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50)');
    console.log('✓ tax_id added');

    console.log('Adding barcode to products...');
    await client.query('ALTER TABLE master.products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50)');
    console.log('✓ barcode added');

    console.log('Adding sale_price to products...');
    await client.query('ALTER TABLE master.products ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2) DEFAULT 0.00');
    console.log('✓ sale_price added');

    console.log('Adding category_id to products...');
    await client.query('ALTER TABLE master.products ADD COLUMN IF NOT EXISTS category_id INTEGER');
    console.log('✓ category_id added');

    console.log('=== Verifying columns ===');
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'master' 
      AND table_name = 'customers'
      AND column_name IN ('credit_limit', 'credit_balance', 'payment_terms', 'tax_id')
    `);
    console.log('Customer sales columns:', result.rows.map((r: any) => r.column_name));

    await client.end();
    console.log('=== Migration completed successfully ===');
  } catch (err) {
    console.error('Error:', err);
    await client.end();
    process.exit(1);
  }
}

main();
