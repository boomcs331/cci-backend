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

const logFile = path.join(__dirname, 'migration-output.txt');

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

async function main() {
  log('Starting migration process...');
  
  try {
    await client.connect();
    log('Connected to database');

    const sqlPath = path.join(__dirname, '..', 'database', 'migrations', '080-sales-planning-tables.sql');
    log(`Reading SQL from: ${sqlPath}`);
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    log(`SQL file read, size: ${sql.length} bytes`);

    log('Executing migration...');
    await client.query(sql);
    log('✓ Migration executed successfully');

    // Verify
    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'sales_planning' ORDER BY table_name"
    );
    log(`Tables created: ${tables.rows.length}`);
    tables.rows.forEach(row => log(`  - ${row.table_name}`));

    await client.end();
    log('Connection closed');
    log('PHASE 1: COMPLETED');
    
  } catch (error) {
    log(`✗ Error: ${error.message}`);
    await client.end();
    process.exit(1);
  }
}

main();
