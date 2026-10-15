import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUserPayload {
  id: string;
  role: 'brand' | 'creator';
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

/**
 * Middleware to authenticate requests via JWT Bearer token
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authorization token required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'Authentication token missing' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ message: 'Authentication server misconfigured: JWT_SECRET missing' });
      return;
    }
    const decoded = jwt.verify(token, secret) as AuthUserPayload;

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error: any) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Middleware guard to require brand role
 */
export const requireBrand = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'brand') {
    res.status(403).json({ message: 'Forbidden: Brand role required' });
    return;
  }

  next();
};

/**
 * Middleware guard to require creator role
 */
export const requireCreator = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'creator') {
    res.status(403).json({ message: 'Forbidden: Creator role required' });
    return;
  }

  next();
};
