import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { wishlistRepository } from '../repositories/wishlist.repository';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination';

export class WishlistController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await wishlistRepository.findByUserId(req.user!.id, page, limit);
      res.json(buildPaginatedResponse(result.rows, result.total, { page, limit, offset: (page - 1) * limit }));
    } catch (error) { next(error); }
  }

  async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = z.object({ propertyId: z.string().uuid() }).parse(req.body);
      await wishlistRepository.add(req.user!.id, propertyId);
      res.status(201).json({ message: 'Added to wishlist' });
    } catch (error) { next(error); }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await wishlistRepository.remove(req.user!.id, (req.params.propertyId as string));
      res.json({ message: 'Removed from wishlist' });
    } catch (error) { next(error); }
  }

  async compare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ids = (req.query.ids as string || '').split(',').filter(Boolean);
      if (ids.length === 0 || ids.length > 3) {
        res.json([]);
        return;
      }
      const result = await wishlistRepository.compare(req.user!.id, ids);
      res.json(result);
    } catch (error) { next(error); }
  }
}

export const wishlistController = new WishlistController();
