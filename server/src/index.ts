import { config } from './config';
import { logger } from './config/logger';
import { pool } from './config/database';
import app from './app';
import fs from 'fs';
import path from 'path';

async function main() {
  // Ensure upload directory exists
  const uploadDir = path.resolve(config.upload.dir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Test database connection
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info({ time: result.rows[0].now }, 'Database connected');
  } catch (error) {
    logger.warn('Database not available yet — server will start anyway');
  }

  // Start server
  const server = app.listen(config.port, () => {
    logger.info(`EstateFlow server running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Client URL: ${config.clientUrl}`);
    logger.info(`API docs: http://localhost:${config.port}/api/docs`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    server.close();
    await pool.end();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error) => {
  logger.fatal({ error }, 'Failed to start server');
  process.exit(1);
});
