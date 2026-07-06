const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'cps_cci',
});

const logFile = path.join(__dirname, 'migration-verification.log');

function log(message) {
  console.log(message);
  fs.appendFileSync(logFile, message + '\n');
}

async function main() {
  log('='.repeat(60));
  log('SALES PLANNING MIGRATION VERIFICATION');
  log('='.repeat(60));
  
  await client.connect();
  log('✓ Connected to database\n');

  try {
    // Verify schema
    const schemaCheck = await client.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'sales_planning'"
    );
    log(schemaCheck.rows.length > 0 ? '✓ Schema sales_planning exists' : '✗ Schema sales_planning NOT found');

    // Verify tables
    const tablesCheck = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'sales_planning' ORDER BY table_name"
    );
    log(`\nTables found: ${tablesCheck.rows.length}`);
    tablesCheck.rows.forEach(row => log(`  ✓ ${row.table_name}`));

    // Verify indexes
    const indexesCheck = await client.query(
      "SELECT indexname FROM pg_indexes WHERE schemaname = 'sales_planning'"
    );
    log(`\nIndexes found: ${indexesCheck.rows.length}`);
    indexesCheck.rows.forEach(row => log(`  ✓ ${row.indexname}`));

    // Verify triggers
    const triggersCheck = await client.query(
      "SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = 'sales_planning'"
    );
    log(`\nTriggers found: ${triggersCheck.rows.length}`);
    triggersCheck.rows.forEach(row => log(`  ✓ ${row.trigger_name}`));

    log('\n' + '='.repeat(60));
    if (tablesCheck.rows.length >= 4) {
      log('PHASE 1: DATABASE SETUP - COMPLETED');
    } else {
      log('PHASE 1: DATABASE SETUP - INCOMPLETE');
    }
    log('='.repeat(60));

  } catch (error) {
    log('\n✗ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(err => {
  log('Fatal error:', err);
  process.exit(1);
});
