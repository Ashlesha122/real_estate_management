import { config } from './config';
import { logger } from './config/logger';
import { pool, checkDatabaseConnection } from './config/database';
import app from './app';
import fs from 'fs';
import path from 'path';

async function main() {
  // Ensure upload directory exists
  const uploadDir = path.resolve(config.upload.dir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Check database connection (activates fallback if PostgreSQL is offline)
  await checkDatabaseConnection();

  // Start server
  const server = app.listen(config.port, '0.0.0.0', () => {
    logger.info(`EstateFlow server running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Client URL: ${config.clientUrl}`);
    logger.info(`API docs: http://localhost:${config.port}/api/docs`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    server.close();
    try { await pool.end(); } catch {}
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error) => {
  logger.fatal({ error }, 'Failed to start server');
  process.exit(1);
});
