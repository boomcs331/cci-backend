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
  console.log('='.repeat(60));
  console.log('SALES PLANNING MIGRATION VERIFICATION');
  console.log('='.repeat(60));
  
  await client.connect();
  console.log('✓ Connected to database\n');

  try {
    // Run migration
    const sqlPath = path.join(__dirname, '..', 'database', 'migrations', '080-sales-planning-tables.sql');
    console.log('Running migration from:', sqlPath);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    console.log('✓ Migration executed successfully\n');

    // Verify schema
    console.log('--- Verification ---');
    const schemaCheck = await client.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'sales_planning'"
    );
    console.log(schemaCheck.rows.length > 0 ? '✓ Schema sales_planning exists' : '✗ Schema sales_planning NOT found');

    // Verify tables
    const tablesCheck = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'sales_planning' ORDER BY table_name"
    );
    console.log(`\nTables found: ${tablesCheck.rows.length}`);
    tablesCheck.rows.forEach(row => console.log(`  ✓ ${row.table_name}`));

    // Verify indexes
    const indexesCheck = await client.query(
      "SELECT indexname FROM pg_indexes WHERE schemaname = 'sales_planning'"
    );
    console.log(`\nIndexes found: ${indexesCheck.rows.length}`);
    indexesCheck.rows.forEach(row => console.log(`  ✓ ${row.indexname}`));

    // Verify triggers
    const triggersCheck = await client.query(
      "SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = 'sales_planning'"
    );
    console.log(`\nTriggers found: ${triggersCheck.rows.length}`);
    triggersCheck.rows.forEach(row => console.log(`  ✓ ${row.trigger_name}`));

    console.log('\n' + '='.repeat(60));
    console.log('PHASE 1: DATABASE SETUP - COMPLETED');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
