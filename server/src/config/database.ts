import { Pool, PoolClient } from 'pg';
import { config } from './index';
import { logger } from './logger';
import { executeMemoryQuery } from './memoryDbQuery';

export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
});

let postgresAvailable: boolean | null = null;

// Graceful error logging without crashing Node process
pool.on('error', (err) => {
  logger.warn({ err: err.message }, 'Database pool warning');
  postgresAvailable = false;
});

pool.on('connect', () => {
  logger.debug('New database connection established');
  postgresAvailable = true;
});

export async function checkDatabaseConnection(): Promise<boolean> {
  if (postgresAvailable !== null) return postgresAvailable;
  try {
    const res = await Promise.race([
      pool.query('SELECT 1 as connected'),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
    ]);
    postgresAvailable = true;
    logger.info('Connected to PostgreSQL database');
    return true;
  } catch {
    postgresAvailable = false;
    logger.info('PostgreSQL offline: Using seamless in-memory database with preloaded demo data');
    return false;
  }
}

export async function query(text: string, params?: unknown[]): Promise<{ rows: any[]; rowCount: number }> {
  const start = Date.now();

  const isPg = postgresAvailable ?? (await checkDatabaseConnection());

  if (isPg) {
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      if (duration > 500) {
        logger.warn({ duration, query: text.substring(0, 200) }, 'Slow query detected');
      }
      return { rows: result.rows, rowCount: result.rowCount || result.rows.length };
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        postgresAvailable = false;
        logger.warn('PostgreSQL disconnected; falling back to in-memory database');
        return executeMemoryQuery(text, params);
      }
      throw err;
    }
  }

  // Fallback in-memory database
  return executeMemoryQuery(text, params);
}

export async function getClient(): Promise<PoolClient> {
  const isPg = postgresAvailable ?? (await checkDatabaseConnection());

  if (isPg) {
    try {
      const client = await pool.connect();
      return client;
    } catch {
      postgresAvailable = false;
    }
  }

  // Return a mock PoolClient that executes queries via executeMemoryQuery
  const mockClient = {
    query: async (queryText: string, queryParams?: unknown[]) => {
      const trimmed = queryText.trim().toUpperCase();
      if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(trimmed)) {
        return { rows: [], rowCount: 0 };
      }
      return executeMemoryQuery(queryText, queryParams);
    },
    release: () => {},
  } as unknown as PoolClient;

  return mockClient;
}

export default pool;
