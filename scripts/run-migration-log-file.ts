import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

const logFile = join(__dirname, 'migration-log.txt');
const log = (msg: string) => {
  writeFileSync(logFile, msg + '\n', { flag: 'a' });
  console.log(msg);
};

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'cps_cci'
});

async function main() {
  try {
    log('=== Starting migration ===');
    log('Connecting to database...');
    await client.connect();
    log('Connected successfully');

    const filePath = join(__dirname, '..', 'database', 'migrations', '074-sales-phase5-sales-fields.sql');
    const sql = readFileSync(filePath, 'utf8');
    log('SQL file loaded, length: ' + sql.length);

    log('Executing SQL...');
    await client.query(sql);
    log('SQL executed successfully');

    log('Verifying columns...');
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'master' 
      AND table_name = 'customers'
      AND column_name IN ('credit_limit', 'credit_balance', 'payment_terms', 'tax_id')
    `);
    log('Customer sales columns: ' + result.rows.map((r: any) => r.column_name).join(', '));

    await client.end();
    log('=== Migration completed successfully ===');
  } catch (err) {
    log('Error: ' + (err as Error).message);
    log('Stack: ' + (err as Error).stack);
    await client.end();
    process.exit(1);
  }
}

main();
