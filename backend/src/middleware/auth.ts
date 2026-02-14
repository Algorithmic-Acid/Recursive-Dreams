import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { ApiResponse } from '../types';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Prefer HttpOnly cookie; fall back to Authorization header for backward compat
    let token: string | undefined = req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      const response: ApiResponse = {
        success: false,
        error: 'Not authorized - No token provided',
      };
      res.status(401).json(response);
      return;
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      const response: ApiResponse = {
        success: false,
        error: 'Not authorized - Invalid token',
      };
      res.status(401).json(response);
      return;
    }

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Not authorized - Token verification failed',
    };
    res.status(401).json(response);
  }
};

// Admin middleware
export const admin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    const response: ApiResponse = {
      success: false,
      error: 'Not authorized - Admin access required',
    };
    res.status(403).json(response);
  }
};
