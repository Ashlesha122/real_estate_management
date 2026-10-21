import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ContactMode } from '@estateflow/shared';
import { userRepository } from '../repositories/user.repository';
import { NotFoundError } from '../utils/errors';

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  phone: z.string().min(10).max(20).optional(),
  contactPreference: z.nativeEnum(ContactMode).optional(),
});

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userRepository.findById(req.user!.id);
      if (!user) throw new NotFoundError('User');

      res.json({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        phoneVerified: user.phone_verified,
        contactPreference: user.contact_preference,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateProfileSchema.parse(req.body);
      const user = await userRepository.updateProfile(req.user!.id, data);
      if (!user) throw new NotFoundError('User');

      res.json({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        phoneVerified: user.phone_verified,
        contactPreference: user.contact_preference,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new Error('No file uploaded');
      }

      const avatarUrl = `/uploads/${req.file.filename}`;
      await userRepository.updateAvatar(req.user!.id, avatarUrl);

      res.json({ avatarUrl });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
