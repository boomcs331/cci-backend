import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

function loadEnvFile() {
  const p = join(__dirname, '..', '.env');
  const fs = require('fs');
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, 'utf8');
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
  
  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected');
  
  try {
    const filePath = join(__dirname, '..', 'database', 'migrations', '074-sales-phase5-sales-fields.sql');
    const sql = readFileSync(filePath, 'utf8');
    console.log('Running migration 074-sales-phase5-sales-fields.sql...');
    await client.query(sql);
    console.log('Migration completed successfully');
    
    // Verify columns
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'master' 
      AND table_name = 'customers'
      AND column_name IN ('credit_limit', 'credit_balance', 'payment_terms', 'tax_id')
    `);
    console.log('Customer sales columns:', result.rows.map((r: any) => r.column_name));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
