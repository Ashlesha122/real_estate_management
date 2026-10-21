import { Pool, PoolClient } from 'pg';
import { config } from './index';
import { logger } from './logger';

export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.fatal({ err }, 'Unexpected database pool error');
  process.exit(1);
});

pool.on('connect', () => {
  logger.debug('New database connection established');
});

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 500) {
    logger.warn({ duration, query: text.substring(0, 200) }, 'Slow query detected');
  }
  return result;
}

export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}

export default pool;
