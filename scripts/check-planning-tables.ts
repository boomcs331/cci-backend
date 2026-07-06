import { Client } from 'pg';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function loadEnvFile() {
  const p = join(__dirname, '..', '.env');
  if (!existsSync(p)) return;
  const raw = readFileSync(p, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile();

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'cps_cci',
  });

  await client.connect();

  try {
    console.log('Checking sales_planning schema and tables...\n');

    // Check schema
    const schemaResult = await client.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'sales_planning'"
    );
    
    if (schemaResult.rows.length > 0) {
      console.log('✓ Schema sales_planning exists');
    } else {
      console.log('✗ Schema sales_planning does NOT exist');
    }

    // Check tables
    const tablesResult = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'sales_planning' ORDER BY table_name"
    );

    console.log('\nTables in sales_planning schema:');
    if (tablesResult.rows.length === 0) {
      console.log('  (no tables found)');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`  ✓ ${row.table_name}`);
      });
    }

    // Check indexes
    const indexesResult = await client.query(
      `SELECT indexname, tablename 
       FROM pg_indexes 
       WHERE schemaname = 'sales_planning' 
       ORDER BY tablename, indexname`
    );

    console.log('\nIndexes in sales_planning schema:');
    if (indexesResult.rows.length === 0) {
      console.log('  (no indexes found)');
    } else {
      indexesResult.rows.forEach(row => {
        console.log(`  ✓ ${row.indexname} on ${row.tablename}`);
      });
    }

    // Check triggers
    const triggersResult = await client.query(
      `SELECT trigger_name, event_object_table 
       FROM information_schema.triggers 
       WHERE trigger_schema = 'sales_planning' 
       ORDER BY event_object_table, trigger_name`
    );

    console.log('\nTriggers in sales_planning schema:');
    if (triggersResult.rows.length === 0) {
      console.log('  (no triggers found)');
    } else {
      triggersResult.rows.forEach(row => {
        console.log(`  ✓ ${row.trigger_name} on ${row.event_object_table}`);
      });
    }

  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
