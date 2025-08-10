import { Application } from './app';
import logger from './utils/logger';

async function startServer() {
  const app = new Application();
  
  try {
    await app.start();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

export { startServer };