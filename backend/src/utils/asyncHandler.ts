import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper for async route handlers to forward rejected promises to Express error handler.
 * Usage: router.get('/path', asyncHandler(async (req, res, next) => { ... }))
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};