import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { RecordType } from '@estateflow/shared';
import { leaseRecordRepository } from '../repositories/leaseRecord.repository';
import { propertyRepository } from '../repositories/property.repository';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination';

const createSchema = z.object({
  propertyId: z.string().uuid(),
  tenantId: z.string().uuid().optional().nullable(),
  counterpartyName: z.string().min(1).max(255),
  counterpartyPhone: z.string().max(20).optional().nullable(),
  recordType: z.nativeEnum(RecordType),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  amount: z.number().positive(),
  notes: z.string().max(2000).optional().nullable(),
});

const updateSchema = z.object({
  active: z.boolean().optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(2000).optional(),
});

export class LeaseRecordController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await leaseRecordRepository.findByOwnerId(req.user!.id, page, limit);
      res.json(buildPaginatedResponse(result.rows, result.total, { page, limit, offset: (page - 1) * limit }));
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createSchema.parse(req.body);
      const property = await propertyRepository.findById(data.propertyId);
      if (!property) throw new NotFoundError('Property');
      if (property.owner_id !== req.user!.id) throw new ForbiddenError('Only the owner can create records');

      const record = await leaseRecordRepository.create(data);
      res.status(201).json(record);
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await leaseRecordRepository.findById((req.params.id as string));
      if (!record) throw new NotFoundError('Lease record');
      res.json(record);
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateSchema.parse(req.body);
      const record = await leaseRecordRepository.update((req.params.id as string), data);
      if (!record) throw new NotFoundError('Lease record');
      res.json(record);
    } catch (error) { next(error); }
  }
}

export const leaseRecordController = new LeaseRecordController();
