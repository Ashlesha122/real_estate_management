import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PropertyStatus, PropertyType, PropertyPurpose, HandlingMode, FurnishingStatus, ALLOWED_STATUS_TRANSITIONS, UserRole } from '@estateflow/shared';
import { propertyRepository } from '../repositories/property.repository';
import { notificationService } from '../services/notification.service';
import { userRepository } from '../repositories/user.repository';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination';

const createPropertySchema = z.object({
  title: z.string().min(3).max(500),
  type: z.nativeEnum(PropertyType),
  purpose: z.nativeEnum(PropertyPurpose),
  askingPrice: z.number().positive().max(99999999999),
  securityDeposit: z.number().min(0).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  areaSqft: z.number().positive().max(1000000).optional().nullable(),
  carpetAreaSqft: z.number().positive().max(1000000).optional().nullable(),
  bedrooms: z.number().int().min(0).max(50).optional().nullable(),
  bathrooms: z.number().int().min(0).max(50).optional().nullable(),
  floorLevel: z.number().int().optional().nullable(),
  totalFloors: z.number().int().min(1).max(200).optional().nullable(),
  furnishing: z.nativeEnum(FurnishingStatus).optional().nullable(),
  parking: z.number().int().min(0).optional().nullable(),
  amenities: z.array(z.string()).optional(),
  streetAddress: z.string().max(500).optional().nullable(),
  city: z.string().max(255).optional().nullable(),
  locality: z.string().max(255).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  handlingMode: z.nativeEnum(HandlingMode).optional(),
  brokerId: z.string().uuid().optional().nullable(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(PropertyStatus),
});

const reorderMediaSchema = z.object({
  mediaIds: z.array(z.string().uuid()),
});

export class PropertyController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createPropertySchema.parse(req.body);
      const property = await propertyRepository.create({
        ownerId: req.user!.id,
        ...data,
        handlingMode: data.handlingMode || 'DIRECT',
      });

      await propertyRepository.addStatusHistory({
        propertyId: property.id,
        fromStatus: null,
        toStatus: 'DRAFT',
        changedBy: req.user!.id,
      });

      res.status(201).json(property);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const property = await propertyRepository.findById((req.params.id as string));
      if (!property) throw new NotFoundError('Property');

      // Ownership check: owners can see their own, brokers their assigned
      if (req.user) {
        const userId = req.user.id;
        const isOwner = property.owner_id === userId;
        const isBroker = property.broker_id === userId;
        if (!isOwner && !isBroker && property.status === 'DRAFT') {
          throw new NotFoundError('Property');
        }
      } else if (property.status === 'DRAFT') {
        throw new NotFoundError('Property');
      }

      res.json(property);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const property = await propertyRepository.findById((req.params.id as string));
      if (!property) throw new NotFoundError('Property');

      this.checkAccess(req.user!, property);

      const data = createPropertySchema.partial().parse(req.body);
      const updated = await propertyRepository.update((req.params.id as string), data as Record<string, unknown>);

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const property = await propertyRepository.findById((req.params.id as string));
      if (!property) throw new NotFoundError('Property');

      if (property.owner_id !== req.user!.id) {
        throw new ForbiddenError('Only the owner can delete a property');
      }

      if (!['DRAFT', 'INACTIVE'].includes(property.status)) {
        throw new ValidationError('Only DRAFT or INACTIVE properties can be deleted');
      }

      await propertyRepository.delete((req.params.id as string));
      res.json({ message: 'Property deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const property = await propertyRepository.findById((req.params.id as string));
      if (!property) throw new NotFoundError('Property');

      if (property.owner_id !== req.user!.id) {
        throw new ForbiddenError('Only the owner can publish a property');
      }

      if (property.status !== 'DRAFT') {
        throw new ValidationError('Only DRAFT properties can be published');
      }

      // Validate required fields for publishing
      const errors: Record<string, string[]> = {};
      if (!property.title) errors.title = ['Title is required'];
      if (!property.type) errors.type = ['Property type is required'];
      if (!property.purpose) errors.purpose = ['Purpose is required'];
      if (!property.asking_price || property.asking_price <= 0) errors.askingPrice = ['Valid asking price is required'];
      if (!property.latitude || !property.longitude) errors.location = ['Location coordinates are required'];

      const mediaCount = await propertyRepository.getMediaCount((req.params.id as string));
      if (mediaCount === 0) errors.media = ['At least one image is required'];

      if (property.handling_mode === 'BROKER_ASSISTED' && !property.broker_id) {
        errors.brokerId = ['A broker must be assigned for broker-assisted listings'];
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationError('Property does not meet publishing requirements', errors);
      }

      await propertyRepository.updateStatus((req.params.id as string), 'ACTIVE', true);
      await propertyRepository.addStatusHistory({
        propertyId: (req.params.id as string),
        fromStatus: 'DRAFT',
        toStatus: 'ACTIVE',
        changedBy: req.user!.id,
      });

      const owner = await userRepository.findById(req.user!.id);
      if (owner) {
        await notificationService.sendNotification({
          userId: owner.id,
          phone: owner.phone,
          type: 'LISTING_PUBLISHED',
          title: 'Listing Published',
          body: `Your property "${property.title}" is now live and searchable.`,
          contactPreference: owner.contact_preference,
          data: { propertyId: property.id },
        });
      }

      res.json({ message: 'Property published successfully', status: 'ACTIVE' });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status: newStatus } = updateStatusSchema.parse(req.body);
      const property = await propertyRepository.findById((req.params.id as string));
      if (!property) throw new NotFoundError('Property');

      this.checkAccess(req.user!, property);

      const currentStatus = property.status as PropertyStatus;
      const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
      if (!allowed || !allowed.includes(newStatus)) {
        throw new ValidationError(`Cannot transition from ${currentStatus} to ${newStatus}`);
      }

      const publishOnActivate = newStatus === PropertyStatus.ACTIVE && currentStatus === PropertyStatus.INACTIVE;
      await propertyRepository.updateStatus((req.params.id as string), newStatus, publishOnActivate);
      await propertyRepository.addStatusHistory({
        propertyId: (req.params.id as string),
        fromStatus: currentStatus,
        toStatus: newStatus,
        changedBy: req.user!.id,
      });

      res.json({ message: `Status updated to ${newStatus}`, status: newStatus });
    } catch (error) {
      next(error);
    }
  }

  async uploadMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const property = await propertyRepository.findById((req.params.id as string));
      if (!property) throw new NotFoundError('Property');
      this.checkAccess(req.user!, property);

      const files = req.files as Express.Multer.File[];
      const existingMedia = await propertyRepository.findMediaByPropertyId((req.params.id as string));
      const startOrder = existingMedia.length;

      if (files && files.length > 0) {
        const mediaRecords = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const mediaType = file.mimetype === 'application/pdf' ? 'BROCHURE' : 'IMAGE';
          const isCover = existingMedia.length === 0 && i === 0;

          const media = await propertyRepository.addMedia({
            propertyId: (req.params.id as string),
            url: `/uploads/${file.filename}`,
            mediaType,
            sortOrder: startOrder + i,
            isCover,
          });
          mediaRecords.push(media);
        }
        res.status(201).json(mediaRecords);
        return;
      } else if (req.body.url) {
        const isCover = req.body.isCover !== undefined ? Boolean(req.body.isCover) : (existingMedia.length === 0);
        const media = await propertyRepository.addMedia({
          propertyId: (req.params.id as string),
          url: req.body.url,
          mediaType: req.body.mediaType || 'IMAGE',
          sortOrder: req.body.sortOrder !== undefined ? Number(req.body.sortOrder) : startOrder,
          isCover,
        });
        res.status(201).json(media);
        return;
      } else {
        throw new ValidationError('No files or media URL provided');
      }
    } catch (error) {
      next(error);
    }
  }

  async deleteMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const property = await propertyRepository.findById((req.params.id as string));
      if (!property) throw new NotFoundError('Property');
      this.checkAccess(req.user!, property);

      const media = await propertyRepository.deleteMedia((req.params.mediaId as string));
      if (!media) throw new NotFoundError('Media');

      res.json({ message: 'Media deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async reorderMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const property = await propertyRepository.findById((req.params.id as string));
      if (!property) throw new NotFoundError('Property');
      this.checkAccess(req.user!, property);

      const { mediaIds } = reorderMediaSchema.parse(req.body);
      await propertyRepository.reorderMedia((req.params.id as string), mediaIds);

      res.json({ message: 'Media reordered successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getMyListings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const status = req.query.status as string | undefined;
      const result = await propertyRepository.findByOwnerId(req.user!.id, page, limit, status);

      res.json(buildPaginatedResponse(result.rows, result.total, { page, limit, offset: (page - 1) * limit }));
    } catch (error) {
      next(error);
    }
  }

  async getAssignedListings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await propertyRepository.findByBrokerId(req.user!.id, page, limit);

      res.json(buildPaginatedResponse(result.rows, result.total, { page, limit, offset: (page - 1) * limit }));
    } catch (error) {
      next(error);
    }
  }

  private checkAccess(user: { id: string; role: string }, property: { owner_id: string; broker_id: string | null }): void {
    const isOwner = property.owner_id === user.id;
    const isBroker = property.broker_id === user.id;

    if (user.role === UserRole.OWNER && !isOwner) {
      throw new ForbiddenError('You can only modify your own properties');
    }
    if (user.role === UserRole.BROKER && !isBroker) {
      throw new ForbiddenError('You can only modify properties assigned to you');
    }
    if (!isOwner && !isBroker) {
      throw new ForbiddenError('Access denied');
    }
  }
}

export const propertyController = new PropertyController();
