import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById, SafeUser, toSafeUser, Role } from '../services/userService';
import { env } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication token is required. Please sign in.',
      });
      return;
    }

    // Verify JWT
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
      role: Role;
    };

    const user = await findUserById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'The authenticated user session could not be found or has expired.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: 'This account has been deactivated. Please contact campus administration.',
      });
      return;
    }

    req.user = toSafeUser(user);
    next();
  } catch (err: any) {
    // JWT-specific errors -> 401
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Session expired. Please sign in again.',
      });
      return;
    }
    if (err.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        error: 'Invalid authentication token.',
      });
      return;
    }
    // Any other error (e.g., Prisma errors from findUserById) -> forward to errorHandler
    next(err);
  }
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized. Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Your role (${req.user.role}) is not authorized for this resource. Required: [${allowedRoles.join(', ')}].`,
      });
      return;
    }

    next();
  };
};