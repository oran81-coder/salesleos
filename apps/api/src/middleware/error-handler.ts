import type { Request, Response, NextFunction } from 'express';

// Basic centralized error handler (no business logic)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // TODO: integrate with proper logger
  // eslint-disable-next-line no-console
  console.error(err);

  const status = err.statusCode ?? 500;
  const message =
    status === 500 ? 'Internal server error' : err.message ?? 'Request failed';

  res.status(status).json({
    success: false,
    message,
  });
}

