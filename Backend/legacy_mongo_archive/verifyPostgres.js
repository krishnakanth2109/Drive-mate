import { pool, connectPostgres, closePostgres } from './postgres.js';

async function runVerification() {
  console.log('--- Verifying Neon PostgreSQL Integration ---');
  try {
    const info = await connectPostgres();
    if (!info) {
      console.error('❌ Connection verification failed');
      process.exit(1);
    }
    const res = await pool.query('SELECT 1 as connected, NOW() as server_time, version()');
    console.log('✅ Query SELECT 1 succeeded:', res.rows[0]);
    console.log('--- Verification Complete: Neon PostgreSQL is functional ---');
    await closePostgres();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during verification:', err.message);
    await closePostgres();
    process.exit(1);
  }
}

runVerification();
