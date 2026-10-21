import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@estateflow/shared';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to access this resource'));
    }

    next();
  };
}

export function requireVerified(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (!req.user.phoneVerified) {
    return next(new ForbiddenError('Phone verification required'));
  }

  next();
}
