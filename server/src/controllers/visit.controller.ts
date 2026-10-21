import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { VisitMode, VisitStatus, UserRole } from '@estateflow/shared';
import { visitRepository } from '../repositories/visit.repository';
import { inquiryRepository } from '../repositories/inquiry.repository';
import { propertyRepository } from '../repositories/property.repository';
import { userRepository } from '../repositories/user.repository';
import { notificationService } from '../services/notification.service';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination';

const createVisitSchema = z.object({
  inquiryId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  mode: z.nativeEnum(VisitMode),
  notes: z.string().max(1000).optional(),
});

const updateVisitSchema = z.object({
  status: z.nativeEnum(VisitStatus).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export class VisitController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createVisitSchema.parse(req.body);
      const inquiry = await inquiryRepository.findById(data.inquiryId);
      if (!inquiry) throw new NotFoundError('Inquiry');
      if (inquiry.buyer_id !== req.user!.id) throw new ForbiddenError('Access denied');

      const scheduledDate = new Date(data.scheduledAt);
      if (scheduledDate <= new Date()) throw new ValidationError('Visit must be in the future');

      const property = await propertyRepository.findById(inquiry.property_id);
      if (!property) throw new NotFoundError('Property');

      const visit = await visitRepository.create({
        inquiryId: data.inquiryId,
        propertyId: inquiry.property_id,
        buyerId: req.user!.id,
        handlerId: inquiry.handler_id,
        scheduledAt: scheduledDate,
        mode: data.mode,
        notes: data.notes,
      });

      await inquiryRepository.addActivity({
        inquiryId: inquiry.id, actorId: req.user!.id,
        eventType: 'VISIT_REQUESTED', metadata: { visitId: visit.id, scheduledAt: data.scheduledAt },
      });

      const handler = await userRepository.findById(inquiry.handler_id);
      if (handler) {
        await notificationService.sendNotification({
          userId: handler.id, phone: handler.phone, type: 'VISIT_REQUESTED',
          title: 'Visit Requested', body: `Visit requested for "${property.title}" on ${scheduledDate.toLocaleDateString()}`,
          contactPreference: handler.contact_preference,
          data: { visitId: visit.id, propertyId: property.id },
        });
      }

      res.status(201).json(visit);
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateVisitSchema.parse(req.body);
      const visit = await visitRepository.findById((req.params.id as string));
      if (!visit) throw new NotFoundError('Visit');

      const isBuyer = visit.buyer_id === req.user!.id;
      const isHandler = visit.handler_id === req.user!.id;
      if (!isBuyer && !isHandler) throw new ForbiddenError('Access denied');

      if (data.status === 'CONFIRMED') {
        if (!isHandler) throw new ForbiddenError('Only the handler can confirm visits');
        if (visit.status !== 'PROPOSED') throw new ValidationError('Can only confirm proposed visits');

        await visitRepository.updateStatus(visit.id, 'CONFIRMED');
        await inquiryRepository.updateStage(visit.inquiry_id, 'SITE_VISIT_SCHEDULED');
        await inquiryRepository.addActivity({
          inquiryId: visit.inquiry_id, actorId: req.user!.id, eventType: 'VISIT_CONFIRMED',
        });

        const buyer = await userRepository.findById(visit.buyer_id);
        if (buyer) {
          await notificationService.sendNotification({
            userId: buyer.id, phone: buyer.phone, type: 'VISIT_CONFIRMED',
            title: 'Visit Confirmed', body: `Your visit has been confirmed for ${new Date(visit.scheduled_at).toLocaleDateString()}`,
            contactPreference: buyer.contact_preference,
          });
        }
      } else if (data.status === 'CANCELLED') {
        if (!['PROPOSED', 'CONFIRMED'].includes(visit.status))
          throw new ValidationError('Cannot cancel this visit');

        await visitRepository.updateStatus(visit.id, 'CANCELLED');
        await inquiryRepository.addActivity({
          inquiryId: visit.inquiry_id, actorId: req.user!.id, eventType: 'VISIT_CANCELLED',
        });

        const notifyUserId = isBuyer ? visit.handler_id : visit.buyer_id;
        const notifyUser = await userRepository.findById(notifyUserId);
        if (notifyUser) {
          await notificationService.sendNotification({
            userId: notifyUser.id, phone: notifyUser.phone, type: 'VISIT_CANCELLED',
            title: 'Visit Cancelled', body: 'A scheduled visit has been cancelled.',
            contactPreference: notifyUser.contact_preference,
          });
        }
      } else if (data.status === 'COMPLETED') {
        if (!isHandler) throw new ForbiddenError('Only the handler can complete visits');
        if (visit.status !== 'CONFIRMED') throw new ValidationError('Can only complete confirmed visits');
        await visitRepository.updateStatus(visit.id, 'COMPLETED');
        await inquiryRepository.addActivity({
          inquiryId: visit.inquiry_id, actorId: req.user!.id, eventType: 'VISIT_COMPLETED',
        });
      } else if (data.scheduledAt) {
        if (!isHandler) throw new ForbiddenError('Only the handler can reschedule');
        const newDate = new Date(data.scheduledAt);
        if (newDate <= new Date()) throw new ValidationError('New time must be in the future');
        await visitRepository.reschedule(visit.id, newDate);
        await inquiryRepository.addActivity({
          inquiryId: visit.inquiry_id, actorId: req.user!.id,
          eventType: 'VISIT_RESCHEDULED', metadata: { newTime: data.scheduledAt },
        });

        const buyer = await userRepository.findById(visit.buyer_id);
        if (buyer) {
          await notificationService.sendNotification({
            userId: buyer.id, phone: buyer.phone, type: 'VISIT_RESCHEDULED',
            title: 'Visit Rescheduled', body: `Your visit has been rescheduled to ${newDate.toLocaleDateString()}`,
            contactPreference: buyer.contact_preference,
          });
        }
      }

      const updated = await visitRepository.findByIdWithDetails((req.params.id as string));
      res.json(updated);
    } catch (error) { next(error); }
  }

  async getMyVisits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await visitRepository.findByBuyerId(req.user!.id, page, limit);
      res.json(buildPaginatedResponse(result.rows, result.total, { page, limit, offset: (page - 1) * limit }));
    } catch (error) { next(error); }
  }

  async getHandlerVisits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await visitRepository.findByHandlerId(req.user!.id, page, limit);
      res.json(buildPaginatedResponse(result.rows, result.total, { page, limit, offset: (page - 1) * limit }));
    } catch (error) { next(error); }
  }
}

export const visitController = new VisitController();
