const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  env.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'cps_cci',
});

async function runMigration(filename) {
  const filePath = path.join(__dirname, '..', 'database', 'migrations', filename);

  if (!fs.existsSync(filePath)) {
    console.error(`Migration file not found: ${filePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(filePath, 'utf8');

  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected successfully');

  try {
    console.log(`Running ${filename}...`);
    await client.query(sql);
    console.log(`OK ${filename}`);
  } catch (error) {
    console.error(`Error running ${filename}:`, error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

const filename = process.argv[2];
if (!filename) {
  console.error('Usage: node scripts/run-migration.js <migration-file.sql>');
  process.exit(1);
}

runMigration(filename).catch(err => {
  console.error(err);
  process.exit(1);
});
