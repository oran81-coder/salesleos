import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getAppConfig } from '../config/env.js';

const config = getAppConfig();

export interface AuthPayload {
  userId: number;
  role: 'manager' | 'rep';
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthPayload;
  }
}

export function authenticateJwt(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  // Local development bypass
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (config.nodeEnv === 'development') {
      console.log('Dev mode: Injecting mock manager user');
      req.user = { userId: 1, role: 'manager' };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = authHeader.substring('Bearer '.length);
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
    req.user = decoded;
    return next();
  } catch {
    if (config.nodeEnv === 'development') {
      console.log('Dev mode: Invalid token, falling back to mock manager');
      req.user = { userId: 1, role: 'manager' };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

