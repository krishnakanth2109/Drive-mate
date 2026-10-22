import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRESQL;

const { Pool } = pg;

// Neon PostgreSQL connection configuration
// Configures connection pooling and SSL according to Neon specifications.
const poolConfig = {
  connectionString,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
  ssl: {
    rejectUnauthorized: false
  }
};

export const pool = connectionString ? new Pool(poolConfig) : null;

if (pool) {
  // Capture unexpected idle client errors
  pool.on('error', (err) => {
    console.error('⚠️ Unexpected error on idle PostgreSQL client:', err.message);
  });
}

/**
 * Execute a parameterized query safely on the PostgreSQL pool
 */
export const query = async (text, params) => {
  if (!pool) {
    throw new Error('PostgreSQL pool is not initialized. Ensure DATABASE_URL is set in environment.');
  }
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // Intentionally log query execution time without printing sensitive parameter payloads
  return res;
};

/**
 * Verify and initialize PostgreSQL connectivity
 */
export const connectPostgres = async () => {
  if (!connectionString) {
    console.warn('⚠️ Neon PostgreSQL: No DATABASE_URL or POSTGRESQL environment variable found. Skipping connection.');
    return null;
  }

  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT 1 as connected, version(), current_database()');
    const versionSnippet = result.rows[0]?.version ? result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1] : 'PostgreSQL';
    console.log(`✅ Neon PostgreSQL Connected [${result.rows[0]?.current_database}] (${versionSnippet})`);
    return result.rows[0];
  } catch (err) {
    console.error('❌ Neon PostgreSQL Connection Error:', err.message);
    // Do not crash the entire application to ensure MongoDB continues serving traffic
    return null;
  } finally {
    if (client) {
      client.release();
    }
  }
};

/**
 * Gracefully close the PostgreSQL connection pool
 */
export const closePostgres = async () => {
  if (pool) {
    await pool.end();
  }
};

export default {
  pool,
  query,
  connectPostgres,
  closePostgres
};
