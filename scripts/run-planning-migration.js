const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      process.env[key] = value.replace(/^["']|["']$/g, '');
    }
  });
}

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'cps_cci',
});

async function main() {
  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected!');

  try {
    const sqlPath = path.join(__dirname, '..', 'database', 'migrations', '080-sales-planning-tables.sql');
    console.log('Reading SQL file:', sqlPath);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing migration...');
    await client.query(sql);
    console.log('✓ Migration completed successfully!');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
