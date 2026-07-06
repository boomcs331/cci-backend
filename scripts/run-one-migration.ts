/**
 * รันไฟล์ migration เดียว เช่น 047-we-production-orders-menu-access.sql
 * Usage: npx ts-node scripts/run-one-migration.ts 047-we-production-orders-menu-access.sql
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

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

const fileName = process.argv[2];
if (!fileName) {
  console.error('Usage: npx ts-node scripts/run-one-migration.ts <filename.sql>');
  process.exit(1);
}

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
    const filePath = join(__dirname, '..', 'database', 'migrations', fileName);
    const sql = readFileSync(filePath, 'utf8');
    process.stdout.write(`Running ${fileName}...\n`);
    await client.query(sql);
    process.stdout.write(`OK ${fileName}\n`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
