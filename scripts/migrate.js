// Run: node scripts/migrate.js
// Requires DATABASE_URL in environment (or .env.local)

const { readFileSync } = require('fs');
const { join } = require('path');
const { Client } = require('pg');

// Load .env.local if present
try {
  const env = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
  env.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k?.trim() && !process.env[k.trim()]) {
      process.env[k.trim()] = v.join('=').trim();
    }
  });
} catch { /* no .env.local */ }

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set');
  process.exit(1);
}

const sql = readFileSync(join(__dirname, '..', 'migrations', '001_marketing_pilot.sql'), 'utf8');

const client = new Client({ connectionString: process.env.DATABASE_URL });

(async () => {
  await client.connect();
  console.log('Running migration...');
  await client.query(sql);
  console.log('Migration completed successfully.');
  await client.end();
})().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
