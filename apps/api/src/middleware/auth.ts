import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../services/prisma.js';
import { UserRoleType, DEFAULT_ROLE_PERMISSIONS, PermissionKey } from '@school-erp/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRoleType;
  firstName?: string;
  lastName?: string;
  staffId?: string | null;
  studentId?: string | null;
  guardianId?: string | null;
  permissions: PermissionKey[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1]) ||
                req.cookies?.['session_token'];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication session token is missing.',
    });
  }

  try {
    const decoded = jwt.verify(token, config.sessionSecret) as {
      id: string;
      email: string;
      role: UserRoleType;
      staffId?: string | null;
      studentId?: string | null;
      guardianId?: string | null;
    };

    // Check DB session revocation (logout / session termination / password reset)
    if (config.env !== 'test') {
      const activeSession = await prisma.session.findUnique({
        where: { token },
      });

      if (!activeSession || activeSession.expiresAt < new Date()) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Session has been invalidated or expired. Please sign in again.',
        });
      }
    }

    const permissions = DEFAULT_ROLE_PERMISSIONS[decoded.role] || [];

    req.user = {
      ...decoded,
      permissions,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
}

export function requireRole(...allowedRoles: UserRoleType[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have access rights for this operation.',
      });
    }

    next();
  };
}

export function requirePermission(...requiredPermissions: PermissionKey[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
    }

    // Super admin always has all permissions
    if (req.user.role === UserRoleType.SUPER_ADMIN) {
      return next();
    }

    const hasAll = requiredPermissions.every(p => req.user!.permissions.includes(p));

    if (!hasAll) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Permission denied for this protected resource.',
        required: requiredPermissions,
      });
    }

    next();
  };
}
