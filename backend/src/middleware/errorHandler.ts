import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode?: number;
  type?: string;
  code?: string;
}

const PRISMA_CONNECTION_CODES = ['P1000', 'P1001', 'P1002', 'P1008', 'P1017'];

function isPrismaConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return PRISMA_CONNECTION_CODES.includes(error.code);
  }
  return false;
}

function isPrismaError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError ||
         error instanceof Prisma.PrismaClientInitializationError ||
         error instanceof Prisma.PrismaClientValidationError ||
         error instanceof Prisma.PrismaClientUnknownRequestError ||
         error instanceof Prisma.PrismaClientRustPanicError;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // Log full error server-side (never exposed to client)
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Request body contains invalid JSON.',
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Request body exceeds the allowed size.',
    });
  }

  // Handle Prisma connection errors -> 503
  if (isPrismaConnectionError(err)) {
    return res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable.',
    });
  }

  // Handle other Prisma errors -> 500 with generic message
  if (isPrismaError(err)) {
    return res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again.',
    });
  }

  // Handle other known errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};