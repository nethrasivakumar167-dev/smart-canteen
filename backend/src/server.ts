import { createServer } from 'http';
import app from './app';
import { initSocket } from './socket';
import { env } from './config/env';

const httpServer = createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

const PORT = env.PORT;

// Start server (skip in test environment)
if (env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Smart Canteen Server running on http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  });
}

export { httpServer };