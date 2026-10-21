import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ContactMode, LeadStage, UserRole } from '@estateflow/shared';
import { inquiryRepository } from '../repositories/inquiry.repository';
import { propertyRepository } from '../repositories/property.repository';
import { userRepository } from '../repositories/user.repository';
import { notificationService } from '../services/notification.service';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination';

const createInquirySchema = z.object({
  propertyId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  contactMode: z.nativeEnum(ContactMode),
  preferredVisitTime: z.string().datetime().optional().nullable(),
});

const updateStageSchema = z.object({
  stage: z.nativeEnum(LeadStage),
});

const addNoteSchema = z.object({
  body: z.string().min(1).max(5000),
});

const ALLOWED_STAGE_TRANSITIONS: Record<string, string[]> = {
  NEW: ['SITE_VISIT_SCHEDULED', 'NEGOTIATION', 'DROPPED'],
  SITE_VISIT_SCHEDULED: ['NEGOTIATION', 'DROPPED'],
  NEGOTIATION: ['CLOSED', 'DROPPED'],
  CLOSED: [],
  DROPPED: [],
};

export class InquiryController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createInquirySchema.parse(req.body);
      const property = await propertyRepository.findById(data.propertyId);
      if (!property) throw new NotFoundError('Property');
      if (property.status !== 'ACTIVE') throw new ValidationError('Can only inquire about active listings');

      const handlerId = property.handling_mode === 'BROKER_ASSISTED' && property.broker_id
        ? property.broker_id : property.owner_id;

      const inquiry = await inquiryRepository.create({
        propertyId: data.propertyId,
        buyerId: req.user!.id,
        handlerId,
        message: data.message,
        contactMode: data.contactMode,
        preferredVisitTime: data.preferredVisitTime ? new Date(data.preferredVisitTime) : null,
      });

      await inquiryRepository.addActivity({
        inquiryId: inquiry.id, actorId: req.user!.id,
        eventType: 'INQUIRY_CREATED', metadata: { contactMode: data.contactMode },
      });

      // Notify handler
      const handler = await userRepository.findById(handlerId);
      if (handler) {
        await notificationService.sendNotification({
          userId: handler.id, phone: handler.phone, type: 'NEW_INQUIRY',
          title: 'New Inquiry', body: `New inquiry on "${property.title}"`,
          contactPreference: handler.contact_preference,
          data: { propertyId: property.id, inquiryId: inquiry.id },
        });
      }

      res.status(201).json(inquiry);
    } catch (error) { next(error); }
  }

  async getMyInquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await inquiryRepository.findByBuyerId(req.user!.id, page, limit);
      res.json(buildPaginatedResponse(result.rows, result.total, { page, limit, offset: (page - 1) * limit }));
    } catch (error) { next(error); }
  }

  async getLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const filters = {
        propertyId: req.query.propertyId as string | undefined,
        stage: req.query.stage as string | undefined,
        fromDate: req.query.fromDate as string | undefined,
        toDate: req.query.toDate as string | undefined,
        page, limit,
      };

      let result;
      if (req.user!.role === UserRole.BROKER) {
        result = await inquiryRepository.findLeads(req.user!.id, filters);
      } else {
        result = await inquiryRepository.findLeadsByOwnerId(req.user!.id, filters);
      }
      res.json(buildPaginatedResponse(result.rows, result.total, { page, limit, offset: (page - 1) * limit }));
    } catch (error) { next(error); }
  }

  async getLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const inquiry = await inquiryRepository.findById((req.params.id as string));
      if (!inquiry) throw new NotFoundError('Inquiry');
      this.checkLeadAccess(req.user!, inquiry);

      if (!inquiry.read) await inquiryRepository.markRead(inquiry.id);

      const notes = await inquiryRepository.findNotes(inquiry.id);
      const activities = await inquiryRepository.findActivities(inquiry.id);
      const buyer = await userRepository.findById(inquiry.buyer_id);

      res.json({ ...inquiry, notes, activities, buyer: buyer ? {
        id: buyer.id, fullName: buyer.full_name, email: buyer.email,
        phone: buyer.phone, avatarUrl: buyer.avatar_url,
      } : null });
    } catch (error) { next(error); }
  }

  async updateStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { stage: newStage } = updateStageSchema.parse(req.body);
      const inquiry = await inquiryRepository.findById((req.params.id as string));
      if (!inquiry) throw new NotFoundError('Inquiry');
      this.checkLeadAccess(req.user!, inquiry);

      const allowed = ALLOWED_STAGE_TRANSITIONS[inquiry.stage] || [];
      if (!allowed.includes(newStage)) {
        throw new ValidationError(`Cannot move lead from ${inquiry.stage} to ${newStage}`);
      }

      await inquiryRepository.updateStage(inquiry.id, newStage);
      await inquiryRepository.addActivity({
        inquiryId: inquiry.id, actorId: req.user!.id,
        eventType: 'STAGE_CHANGED', metadata: { from: inquiry.stage, to: newStage },
      });

      res.json({ message: `Lead moved to ${newStage}`, stage: newStage });
    } catch (error) { next(error); }
  }

  async addNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { body } = addNoteSchema.parse(req.body);
      const inquiry = await inquiryRepository.findById((req.params.id as string));
      if (!inquiry) throw new NotFoundError('Inquiry');
      this.checkLeadAccess(req.user!, inquiry);

      const note = await inquiryRepository.addNote({ inquiryId: inquiry.id, authorId: req.user!.id, body });
      await inquiryRepository.addActivity({
        inquiryId: inquiry.id, actorId: req.user!.id, eventType: 'NOTE_ADDED',
      });

      res.status(201).json(note);
    } catch (error) { next(error); }
  }

  async getNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const inquiry = await inquiryRepository.findById((req.params.id as string));
      if (!inquiry) throw new NotFoundError('Inquiry');
      this.checkLeadAccess(req.user!, inquiry);
      const notes = await inquiryRepository.findNotes(inquiry.id);
      res.json(notes);
    } catch (error) { next(error); }
  }

  async getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const inquiry = await inquiryRepository.findById((req.params.id as string));
      if (!inquiry) throw new NotFoundError('Inquiry');
      this.checkLeadAccess(req.user!, inquiry);
      const activities = await inquiryRepository.findActivities(inquiry.id);
      res.json(activities);
    } catch (error) { next(error); }
  }

  private checkLeadAccess(user: { id: string; role: string }, inquiry: { handler_id: string; buyer_id: string; property_id: string }): void {
    if (user.role === UserRole.BUYER && inquiry.buyer_id !== user.id) {
      throw new ForbiddenError('Access denied');
    }
    if (user.role === UserRole.BROKER && inquiry.handler_id !== user.id) {
      throw new ForbiddenError('Access denied');
    }
    // OWNER access is checked via the property owner relation in the query
  }
}

export const inquiryController = new InquiryController();
