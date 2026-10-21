import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { notificationRepository } from '../repositories/notification.repository';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination';

const markReadSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  all: z.boolean().optional(),
});

export class NotificationController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await notificationRepository.findByUserId(req.user!.id, page, limit);
      res.json(buildPaginatedResponse(result.rows, result.total, { page, limit, offset: (page - 1) * limit }));
    } catch (error) { next(error); }
  }

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = markReadSchema.parse(req.body);
      if (data.all) {
        await notificationRepository.markAllRead(req.user!.id);
      } else if (data.ids && data.ids.length > 0) {
        await notificationRepository.markRead(req.user!.id, data.ids);
      }
      res.json({ message: 'Notifications marked as read' });
    } catch (error) { next(error); }
  }

  async unreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await notificationRepository.getUnreadCount(req.user!.id);
      res.json({ count });
    } catch (error) { next(error); }
  }
}

export const notificationController = new NotificationController();
