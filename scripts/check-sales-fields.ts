import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function checkSalesFields() {
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

    // Check customers table
    const customerColumns = await queryRunner.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'master' 
      AND table_name = 'customers'
      ORDER BY ordinal_position
    `);
    console.log('Customers columns:', customerColumns.map((c: any) => c.column_name));

    // Check products table
    const productColumns = await queryRunner.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'master' 
      AND table_name = 'products'
      ORDER BY ordinal_position
    `);
    console.log('Products columns:', productColumns.map((c: any) => c.column_name));

    await queryRunner.release();
    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSalesFields();
