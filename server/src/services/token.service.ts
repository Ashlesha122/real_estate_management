import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config';
import { UserRole } from '@estateflow/shared';

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  phoneVerified: boolean;
}

export interface RefreshTokenPayload {
  id: string;
  type: 'refresh';
}

class TokenService {
  signAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiry,
    });
  }

  signRefreshToken(userId: string): string {
    const payload: RefreshTokenPayload = { id: userId, type: 'refresh' };
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiry,
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload & TokenPayload;
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      phoneVerified: decoded.phoneVerified,
    };
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload & RefreshTokenPayload;
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return { id: decoded.id, type: 'refresh' };
  }
}

export const tokenService = new TokenService();
