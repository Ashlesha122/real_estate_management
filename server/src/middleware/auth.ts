import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services/token.service';
import { UnauthorizedError } from '../utils/errors';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const payload = tokenService.verifyAccessToken(token);

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      phoneVerified: payload.phoneVerified,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
}
