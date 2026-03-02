#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Seeding round if needed..."
node -e "
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query('SELECT id FROM \"Round\" WHERE active = true LIMIT 1');
if (res.rows.length === 0) {
  const now = new Date();
  const endsAt = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO \"Round\" (id, number, \"startedAt\", \"endsAt\", phase, active, \"createdAt\") VALUES (gen_random_uuid()::text, 1, \$1, \$2, \$3, true, \$1)',
    [now, endsAt, 'GROWTH']
  );
  console.log('Seeded round 1');
} else {
  console.log('Active round already exists');
}
await pool.end();
"

echo "Starting API server..."
exec npx tsx src/index.ts
