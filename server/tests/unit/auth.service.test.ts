import { describe, it, expect } from 'vitest';
import { authService } from '../../src/services/auth.service';
import { tokenService } from '../../src/services/token.service';
import { UserRole } from '@estateflow/shared';

describe('Auth & Token Services', () => {
  it('should hash and compare passwords accurately', async () => {
    const password = 'SuperSecretPassword123!';
    const hash = await authService.hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2')).toBe(true);

    const isMatch = await authService.comparePassword(password, hash);
    expect(isMatch).toBe(true);

    const isBadMatch = await authService.comparePassword('WrongPassword', hash);
    expect(isBadMatch).toBe(false);
  });

  it('should generate a 6-digit OTP code', () => {
    const otp = authService.generateOtp();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('should hash and verify OTP code correctly', async () => {
    const otp = '849201';
    const hash = await authService.hashOtp(otp);

    const isValid = await authService.verifyOtp(otp, hash);
    expect(isValid).toBe(true);

    const isInvalid = await authService.verifyOtp('000000', hash);
    expect(isInvalid).toBe(false);
  });

  it('should sign and verify JWT access and refresh tokens', () => {
    const user = {
      id: 'd9b2d63d-a233-4f9e-bb91-037f4f6e3c0b',
      email: 'owner@estateflow.com',
      role: UserRole.OWNER,
      phoneVerified: true,
    };

    const { accessToken, refreshToken } = authService.generateTokens(user);

    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();

    const verifiedAccess = tokenService.verifyAccessToken(accessToken);
    expect(verifiedAccess.id).toBe(user.id);
    expect(verifiedAccess.email).toBe(user.email);
    expect(verifiedAccess.role).toBe(user.role);
    expect(verifiedAccess.phoneVerified).toBe(true);

    const verifiedRefresh = tokenService.verifyRefreshToken(refreshToken);
    expect(verifiedRefresh.id).toBe(user.id);
    expect(verifiedRefresh.type).toBe('refresh');
  });
});
