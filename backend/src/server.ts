import { createServer } from 'http';
import app from './app';
import { initSocket } from './socket';
import { env } from './config/env';

const httpServer = createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

const PORT = env.PORT;

// Process-level safety nets
function handleFatalError(label: string, err: Error) {
  console.error(`[${label}]`, err);
  if (env.NODE_ENV === 'production') {
    console.error('Unrecoverable error in production. Exiting...');
    process.exit(1);
  }
  // In development, just log and keep running
}

process.on('unhandledRejection', (reason: unknown) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  handleFatalError('unhandledRejection', err);
});

process.on('uncaughtException', (err: Error) => {
  handleFatalError('uncaughtException', err);
});

// Start server (skip in test environment)
if (env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Smart Canteen Server running on http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  });
}

export { httpServer };