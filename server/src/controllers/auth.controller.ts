import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserRole } from '@estateflow/shared';
import { authService } from '../services/auth.service';
import { tokenService } from '../services/token.service';
import { userRepository } from '../repositories/user.repository';
import { otpRepository } from '../repositories/otp.repository';
import { notificationService } from '../services/notification.service';
import { UnauthorizedError, ValidationError, ConflictError } from '../utils/errors';
import { config } from '../config';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[!@#$%^&*]/, 'Password must contain a special character'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(255),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20),
  role: z.nativeEnum(UserRole),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const verifyOtpSchema = z.object({
  code: z.string().length(6, 'OTP must be exactly 6 digits'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[!@#$%^&*]/, 'Password must contain a special character'),
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = registerSchema.parse(req.body);

      const existing = await userRepository.findByEmail(data.email);
      if (existing) {
        throw new ConflictError('An account with this email already exists');
      }

      const passwordHash = await authService.hashPassword(data.password);
      const user = await userRepository.create({
        email: data.email,
        phone: data.phone,
        passwordHash,
        fullName: data.fullName,
        role: data.role,
      });

      // Generate OTP
      const otp = authService.generateOtp();
      const otpHash = await authService.hashOtp(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await otpRepository.create(user.id, otpHash, expiresAt);

      // Send OTP via notification service (mock)
      await notificationService.sendOtp(user.phone, otp);

      const { accessToken, refreshToken } = authService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        phoneVerified: false,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.status(201).json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role,
          phoneVerified: false,
          contactPreference: user.contact_preference,
          avatarUrl: null,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);

      // Generic error message to not reveal email existence
      const genericError = new UnauthorizedError('Invalid email or password');

      const user = await userRepository.findByEmail(data.email);
      if (!user) {
        // Time-constant: still hash to prevent timing attacks
        await authService.hashPassword(data.password);
        throw genericError;
      }

      const valid = await authService.comparePassword(data.password, user.password_hash);
      if (!valid) {
        throw genericError;
      }

      const { accessToken, refreshToken } = authService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        phoneVerified: user.phone_verified,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role,
          phoneVerified: user.phone_verified,
          contactPreference: user.contact_preference,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) {
        throw new UnauthorizedError('No refresh token provided');
      }

      const payload = tokenService.verifyRefreshToken(token);
      const user = await userRepository.findById(payload.id);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { accessToken, refreshToken } = authService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        phoneVerified: user.phone_verified,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.json({ accessToken });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('refreshToken', { path: '/' });
    res.json({ message: 'Logged out successfully' });
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = verifyOtpSchema.parse(req.body);
      const userId = req.user!.id;

      const otp = await otpRepository.findLatestByUserId(userId);
      if (!otp) {
        throw new ValidationError('No OTP found. Please request a new one.');
      }

      if (otp.consumed_at) {
        throw new ValidationError('OTP has already been used. Please request a new one.');
      }

      if (otp.attempts >= 5) {
        throw new ValidationError('Maximum attempts exceeded. Please request a new OTP.');
      }

      if (new Date() > new Date(otp.expires_at)) {
        throw new ValidationError('OTP has expired. Please request a new one.');
      }

      await otpRepository.incrementAttempts(otp.id);

      const valid = await authService.verifyOtp(code, otp.code_hash);
      if (!valid) {
        throw new ValidationError('Invalid OTP code');
      }

      await otpRepository.markConsumed(otp.id);
      await userRepository.setPhoneVerified(userId);

      // Issue new access token with phoneVerified = true
      const user = await userRepository.findById(userId);
      if (!user) throw new UnauthorizedError('User not found');

      const { accessToken, refreshToken } = authService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        phoneVerified: true,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.json({ message: 'Phone verified successfully', accessToken });
    } catch (error) {
      next(error);
    }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await userRepository.findById(userId);
      if (!user) throw new UnauthorizedError('User not found');

      if (user.phone_verified) {
        throw new ValidationError('Phone is already verified');
      }

      // Check throttle: 1 per 60 seconds
      const lastOtp = await otpRepository.findLatestByUserId(userId);
      if (lastOtp) {
        const elapsed = Date.now() - new Date(lastOtp.created_at).getTime();
        if (elapsed < 60000) {
          const waitSeconds = Math.ceil((60000 - elapsed) / 1000);
          throw new ValidationError(`Please wait ${waitSeconds} seconds before requesting a new OTP`);
        }
      }

      const otp = authService.generateOtp();
      const otpHash = await authService.hashOtp(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await otpRepository.create(userId, otpHash, expiresAt);

      await notificationService.sendOtp(user.phone, otp);

      res.json({ message: 'OTP sent successfully' });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      const userId = req.user!.id;

      const user = await userRepository.findById(userId);
      if (!user) throw new UnauthorizedError('User not found');

      const valid = await authService.comparePassword(currentPassword, user.password_hash);
      if (!valid) {
        throw new ValidationError('Current password is incorrect');
      }

      const newHash = await authService.hashPassword(newPassword);
      await userRepository.updatePassword(userId, newHash);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
