/**
 * Seed sample users for department-scoped RBAC.
 *
 * Prerequisite:
 * - Run DB migrations first (departments, roles, permissions tables must exist)
 *
 * Usage:
 * - npm run seed:auth
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
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
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

type SeedUserConfig = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  departmentCode: 'WE' | 'PD';
  globalRoleCode?: 'ADMIN_GLOBAL';
  scopedAssignments?: Array<{
    roleCode: 'DEPT_ADMIN' | 'DEPT_STAFF';
    departmentCode: 'WE' | 'PD';
  }>;
};

async function ensureDepartmentIds(
  client: Client,
  codes: string[],
): Promise<Map<string, string>> {
  const result = await client.query<{ id: string; code: string }>(
    `SELECT id, code FROM auth.departments WHERE code = ANY($1::text[])`,
    [codes],
  );
  const map = new Map<string, string>(result.rows.map((row) => [row.code, row.id]));

  const missing = codes.filter((code) => !map.has(code));
  if (missing.length > 0) {
    throw new Error(
      `Missing departments: ${missing.join(', ')}. Please run DB migration + seed RBAC first.`,
    );
  }
  return map;
}

async function ensureRoleIds(
  client: Client,
  codes: string[],
): Promise<Map<string, string>> {
  const result = await client.query<{ id: string; code: string }>(
    `SELECT id, code FROM auth.roles WHERE code = ANY($1::text[])`,
    [codes],
  );
  const map = new Map<string, string>(result.rows.map((row) => [row.code, row.id]));

  const missing = codes.filter((code) => !map.has(code));
  if (missing.length > 0) {
    throw new Error(
      `Missing roles: ${missing.join(', ')}. Please run DB migration + seed RBAC first.`,
    );
  }
  return map;
}

async function upsertUser(
  client: Client,
  input: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    departmentId: string;
    passwordHash: string;
  },
) {
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO auth.users
        (username, email, password_hash, first_name, last_name, department_id, is_active)
      VALUES
        ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT (username)
      DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        department_id = EXCLUDED.department_id,
        is_active = true,
        updated_at = now()
      RETURNING id
    `,
    [
      input.username,
      input.email,
      input.passwordHash,
      input.firstName,
      input.lastName,
      input.departmentId,
    ],
  );
  return result.rows[0].id;
}

async function clearRoleLinks(client: Client, userId: string) {
  await client.query(`DELETE FROM auth.user_roles WHERE user_id = $1`, [userId]);
  await client.query(`DELETE FROM auth.user_role_assignments WHERE user_id = $1`, [userId]);
}

async function main() {
  loadEnvFile();

  const passwordPlain = process.env.SEED_AUTH_PASSWORD || 'Passw0rd!';
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'cps_cci',
  });

  const users: SeedUserConfig[] = [
    {
      username: 'admin.global',
      email: 'admin.global@example.com',
      firstName: 'Global',
      lastName: 'Admin',
      departmentCode: 'WE',
      globalRoleCode: 'ADMIN_GLOBAL',
    },
    {
      username: 'we.admin',
      email: 'we.admin@example.com',
      firstName: 'WE',
      lastName: 'Admin',
      departmentCode: 'WE',
      scopedAssignments: [{ roleCode: 'DEPT_ADMIN', departmentCode: 'WE' }],
    },
    {
      username: 'we.staff',
      email: 'we.staff@example.com',
      firstName: 'WE',
      lastName: 'Staff',
      departmentCode: 'WE',
      scopedAssignments: [{ roleCode: 'DEPT_STAFF', departmentCode: 'WE' }],
    },
    {
      username: 'pd.staff',
      email: 'pd.staff@example.com',
      firstName: 'PD',
      lastName: 'Staff',
      departmentCode: 'PD',
      scopedAssignments: [{ roleCode: 'DEPT_STAFF', departmentCode: 'PD' }],
    },
  ];

  await client.connect();
  try {
    await client.query('BEGIN');

    const departmentIds = await ensureDepartmentIds(client, ['WE', 'PD']);
    const roleIds = await ensureRoleIds(client, ['ADMIN_GLOBAL', 'DEPT_ADMIN', 'DEPT_STAFF']);
    const passwordHash = await bcrypt.hash(passwordPlain, 10);

    for (const user of users) {
      const departmentId = departmentIds.get(user.departmentCode);
      if (!departmentId) {
        throw new Error(`Department not found for ${user.departmentCode}`);
      }

      const userId = await upsertUser(client, {
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        departmentId,
        passwordHash,
      });

      await clearRoleLinks(client, userId);

      if (user.globalRoleCode) {
        const roleId = roleIds.get(user.globalRoleCode);
        if (!roleId) {
          throw new Error(`Role not found: ${user.globalRoleCode}`);
        }
        await client.query(
          `
            INSERT INTO auth.user_roles (user_id, role_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `,
          [userId, roleId],
        );
      }

      for (const assignment of user.scopedAssignments ?? []) {
        const roleId = roleIds.get(assignment.roleCode);
        const scopedDepartmentId = departmentIds.get(assignment.departmentCode);
        if (!roleId || !scopedDepartmentId) {
          throw new Error(
            `Invalid scoped assignment for ${assignment.roleCode}/${assignment.departmentCode}`,
          );
        }
        await client.query(
          `
            INSERT INTO auth.user_role_assignments (user_id, role_id, department_id)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
          `,
          [userId, roleId, scopedDepartmentId],
        );
      }
    }

    await client.query('COMMIT');

    process.stdout.write('\nSample auth users seeded successfully.\n');
    process.stdout.write(`Default password: ${passwordPlain}\n`);
    process.stdout.write('Users:\n');
    process.stdout.write('- admin.global (ADMIN_GLOBAL)\n');
    process.stdout.write('- we.admin (DEPT_ADMIN @ WE)\n');
    process.stdout.write('- we.staff (DEPT_STAFF @ WE)\n');
    process.stdout.write('- pd.staff (DEPT_STAFF @ PD)\n\n');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`seed-auth-data failed: ${message}\n`);
  process.exit(1);
});
