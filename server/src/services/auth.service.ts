import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config';
import { tokenService, TokenPayload } from './token.service';
import { UserRole } from '@estateflow/shared';

class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.bcrypt.rounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, 6);
  }

  async verifyOtp(otp: string, hash: string): Promise<boolean> {
    return bcrypt.compare(otp, hash);
  }

  generateTokens(user: { id: string; email: string; role: UserRole; phoneVerified: boolean }) {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      phoneVerified: user.phoneVerified,
    };

    const accessToken = tokenService.signAccessToken(payload);
    const refreshToken = tokenService.signRefreshToken(user.id);

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
