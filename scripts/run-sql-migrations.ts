/**
 * รัน SQL ใน database/migrations ตามลำดับชื่อไฟล์ (004-…)
 * โหลดค่าจาก .env — รันจากเครื่อง host ที่เชื่อม Postgres ได้
 *
 * หมายเหตุ: ไม่มีตาราง track migration — ไฟล์ควร idempotent (ON CONFLICT)
 * สำหรับรันไฟล์เดียว: npx ts-node scripts/run-one-migration.ts <file.sql>
 */
import { readFileSync, existsSync, readdirSync } from 'fs';
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

const root = join(__dirname, '..');
const migrationsDir = join(root, 'database', 'migrations');

function listMigrationFiles(): string[] {
  return readdirSync(migrationsDir)
    .filter((name) => /^\d{3}-.+\.sql$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function main() {
  const onlyFile = process.argv[2];
  const migrationFiles = onlyFile ? [onlyFile] : listMigrationFiles();

  if (migrationFiles.length === 0) {
    console.error('No migration files found.');
    process.exit(1);
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'cps_cci',
  });
  await client.connect();
  try {
    for (const name of migrationFiles) {
      const filePath = join(migrationsDir, name);
      if (!existsSync(filePath)) {
        throw new Error(`Migration not found: ${filePath}`);
      }
      const sql = readFileSync(filePath, 'utf8');
      process.stdout.write(`Running ${name}...\n`);
      await client.query(sql);
      process.stdout.write(`OK ${name}\n`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
