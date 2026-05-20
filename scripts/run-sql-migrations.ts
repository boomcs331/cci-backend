/**
 * รัน SQL ใน database/migrations ตามลำดับ (004 → … → 023 max ณ เวอร์ชันนี้)
 * โหลดค่าจาก .env ที่ root โปรเจกต์ — รันจากเครื่อง host ที่มี Postgres
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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile();

const root = join(__dirname, '..');
const migrationFiles = [
  '004-production-orders-plan-link.sql',
  '005-production-orders-schema.sql',
  '006-production-orders-snake-case-columns.sql',
  '007-production-orders-lowercase-camel-columns.sql',
  '008-product-production-steps.sql',
  '009-production-process-code-unique.sql',
  '010-seed-master-production-processes.sql',
  '011-production-lots-material-style-cols.sql',
  '012-production-orders-drop-legacy-quantity.sql',
  '013-production-orders-quantity-sync-trigger.sql',
  '014-production-orders-quantity-column-mirror.sql',
  '015-auth-department-scoped-rbac.sql',
  '016-seed-auth-department-rbac.sql',
  '017-auth-move-to-schema.sql',
  '018-master-data-move-to-schema.sql',
  '019-verify-auth-master-schemas.sql',
  '020-assert-no-public-auth-master-tables.sql',
  '021-logs-move-to-schema.sql',
  '022-verify-logs-schema.sql',
  '023-assert-no-public-logs-tables.sql',
  '024-auth-menu-navigation.sql',
  '025-auth-menu-admin-management.sql',
  '026-seed-auth-sample-users.sql',
  '027-product-stock-sales-reservations.sql',
  '028-menu-stock-balance-group.sql',
  '029-product-stock-path-production.sql',
  '030-sales-reservations-path-production.sql',
  '031-menu-materials-products-overview.sql',
  '032-menu-overview-hubs-users-balances.sql',
  '042-material-receiving-po-no-format.sql',
  '043-material-receiving-po-no-allow-special.sql',
];

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
    for (const name of migrationFiles) {
      const filePath = join(root, 'database', 'migrations', name);
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
