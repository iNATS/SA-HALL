import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Pool, PoolClient } from 'pg';
import { validateEnvironment } from '../../config/environment.js';

interface AppliedMigration {
  name: string;
  checksum: string;
}

const LOCK_ID = 2_042_100_007;

async function runMigration(
  client: PoolClient,
  name: string,
  checksum: string,
  sql: string,
) {
  await client.query('begin');
  try {
    await client.query(sql);
    await client.query(
      'insert into schema_migrations (name, checksum) values ($1, $2)',
      [name, checksum],
    );
    await client.query('commit');
    process.stdout.write(
      `${JSON.stringify({ event: 'migration_applied', name })}\n`,
    );
  } catch (error) {
    await client.query('rollback');
    throw error;
  }
}

async function migrate() {
  const environment = validateEnvironment(process.env);
  const pool = new Pool({
    host: environment.DATABASE_HOST,
    port: environment.DATABASE_PORT,
    database: environment.DATABASE_NAME,
    user: environment.DATABASE_USER,
    password: environment.DATABASE_PASSWORD,
    ssl:
      environment.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: true }
        : false,
  });
  const client = await pool.connect();

  try {
    await client.query('select pg_advisory_lock($1)', [LOCK_ID]);
    await client.query(`
      create table if not exists schema_migrations (
        name text primary key,
        checksum text not null,
        applied_at timestamptz not null default now()
      )
    `);

    const appliedResult = await client.query<AppliedMigration>(
      'select name, checksum from schema_migrations order by name',
    );
    const applied = new Map(
      appliedResult.rows.map((migration) => [
        migration.name,
        migration.checksum,
      ]),
    );
    const directory = join(import.meta.dirname, '../../migrations');
    const files = (await readdir(directory))
      .filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/.test(name))
      .sort();

    for (const name of files) {
      const sql = await readFile(join(directory, name), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const previousChecksum = applied.get(name);

      if (previousChecksum && previousChecksum !== checksum) {
        throw new Error(`Applied migration checksum changed: ${name}`);
      }
      if (!previousChecksum) {
        await runMigration(client, name, checksum, sql);
      }
    }
  } finally {
    await client.query('select pg_advisory_unlock($1)', [LOCK_ID]);
    client.release();
    await pool.end();
  }
}

await migrate();
