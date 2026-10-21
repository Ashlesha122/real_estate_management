import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { availabilityRepository } from '../repositories/availability.repository';
import { visitRepository } from '../repositories/visit.repository';
import { NotFoundError, ValidationError } from '../utils/errors';

const rulesSchema = z.object({
  rules: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })),
});

const blockSchema = z.object({
  blockedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(500).optional(),
});

export class AvailabilityController {
  async getRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rules = await availabilityRepository.getRules(req.user!.id);
      res.json(rules);
    } catch (error) { next(error); }
  }

  async replaceRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rules } = rulesSchema.parse(req.body);
      const result = await availabilityRepository.replaceRules(req.user!.id, rules);
      res.json(result);
    } catch (error) { next(error); }
  }

  async getBlocks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const blocks = await availabilityRepository.getBlocks(req.user!.id);
      res.json(blocks);
    } catch (error) { next(error); }
  }

  async addBlock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = blockSchema.parse(req.body);
      const block = await availabilityRepository.addBlock(req.user!.id, data.blockedDate, data.reason);
      res.status(201).json(block);
    } catch (error) { next(error); }
  }

  async deleteBlock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await availabilityRepository.deleteBlock((req.params.id as string), req.user!.id);
      if (!deleted) throw new NotFoundError('Block');
      res.json({ message: 'Block removed' });
    } catch (error) { next(error); }
  }

  async getSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const handlerId = (req.params.handlerId as string);
      const date = req.query.date as string;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new ValidationError('date query param required (YYYY-MM-DD)');
      }

      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();

      const rules = await availabilityRepository.getRules(handlerId);
      const dayRules = rules.filter(r => r.day_of_week === dayOfWeek);
      if (dayRules.length === 0) {
        res.json([]);
        return;
      }

      const blocks = await availabilityRepository.getBlocks(handlerId);
      const isBlocked = blocks.some(b => b.blocked_date === date);
      if (isBlocked) {
        res.json([]);
        return;
      }

      const existingVisits = await visitRepository.findConfirmedByHandlerAndDate(handlerId, date);
      const bookedTimes = new Set(existingVisits.map(v => new Date(v.scheduled_at).toISOString()));

      const slots: { start: string; end: string; available: boolean }[] = [];
      for (const rule of dayRules) {
        const [startH, startM] = rule.start_time.split(':').map(Number);
        const [endH, endM] = rule.end_time.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        for (let m = startMinutes; m + 30 <= endMinutes; m += 30) {
          const slotStart = new Date(date);
          slotStart.setHours(Math.floor(m / 60), m % 60, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + 30 * 60000);
          const available = !bookedTimes.has(slotStart.toISOString()) && slotStart > new Date();
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            available,
          });
        }
      }

      res.json(slots);
    } catch (error) { next(error); }
  }
}

export const availabilityController = new AvailabilityController();
