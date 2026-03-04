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
  const isDev = process.env.NODE_ENV === 'development';
  // GaxiosError (Google API) nests the real message inside errors[]/response.data
  const devMsg =
    err?.message ||
    err?.errors?.[0]?.message ||
    err?.response?.data?.error?.message ||
    err?.response?.data?.error ||
    (typeof err === 'string' ? err : JSON.stringify(err));
  const message =
    status === 500
      ? (isDev ? `[dev] ${devMsg}` : 'Internal server error')
      : err.message ?? 'Request failed';

  res.status(status).json({
    success: false,
    message,
  });
}

