import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { savedSearchRepository } from '../repositories/savedSearch.repository';

const createSchema = z.object({
  name: z.string().min(1).max(255),
  filters: z.record(z.unknown()),
  centerLat: z.number().min(-90).max(90).optional(),
  centerLng: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().min(1).max(50).optional(),
  notify: z.boolean().optional(),
});

export class SavedSearchController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const searches = await savedSearchRepository.findByUserId(req.user!.id);
      res.json(searches);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createSchema.parse(req.body);
      const search = await savedSearchRepository.create({ userId: req.user!.id, ...data });
      res.status(201).json(search);
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await savedSearchRepository.delete((req.params.id as string), req.user!.id);
      res.json({ message: 'Saved search deleted' });
    } catch (error) { next(error); }
  }
}

export const savedSearchController = new SavedSearchController();
