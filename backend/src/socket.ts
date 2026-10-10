import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './config/env';
import { prisma } from './prisma';

export interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  if (io) return io;

  const corsOrigins = env.NODE_ENV === 'development'
    ? [...env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173']
    : env.CLIENT_URL;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  // Socket.IO middleware for JWT Authentication
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return next(new Error('Authentication required: Token missing.'));
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
      if (typeof decoded !== 'object' || typeof decoded.userId !== 'string') {
        return next(new Error('Authentication failed: Invalid or expired token.'));
      }
      userId = decoded.userId;
    } catch {
      return next(new Error('Authentication failed: Invalid or expired token.'));
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, isActive: true },
      });
      if (!user || !user.isActive) {
        return next(new Error('Authentication failed: Account is unavailable.'));
      }
      socket.user = { userId: user.id, email: user.email, role: user.role };
      next();
    } catch (err) {
      console.error('[Socket.IO] Authentication lookup failed:', err);
      next(new Error('Authentication service unavailable.'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user;
    if (user) {
      // Join user-specific room
      socket.join(`user:${user.userId}`);
      // Join role-specific room
      socket.join(`role:${user.role}`);
      console.log(`[Socket.IO] User ${user.email} (${user.role}) connected and joined rooms.`);
    }

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitOrderCreated(order: any) {
  if (!io) return;
  const payload = { success: true, data: order };
  if (order.studentId) {
    io.to(`user:${order.studentId}`).emit('order-created', payload);
    io.to(`user:${order.studentId}`).emit('order:created', payload);
  }
  io.to('role:STAFF').emit('order-created', payload);
  io.to('role:STAFF').emit('order:created', payload);
  io.to('role:ADMIN').emit('order-created', payload);
  io.to('role:ADMIN').emit('order:created', payload);
}

export function emitOrderStatusUpdated(order: any) {
  if (!io) return;
  const payload = { success: true, data: order };
  if (order.studentId) {
    io.to(`user:${order.studentId}`).emit('order-status-updated', payload);
    io.to(`user:${order.studentId}`).emit('order:status-updated', payload);
  }
  io.to('role:STAFF').emit('order-status-updated', payload);
  io.to('role:STAFF').emit('order:status-updated', payload);
  io.to('role:ADMIN').emit('order-status-updated', payload);
  io.to('role:ADMIN').emit('order:status-updated', payload);
}

export function emitAvailabilityUpdated(data: any) {
  if (!io) return;
  const payload = { success: true, data };
  io.emit('availability-updated', payload);
  io.emit('availability:updated', payload);
  io.emit('menu-updated', payload);
}