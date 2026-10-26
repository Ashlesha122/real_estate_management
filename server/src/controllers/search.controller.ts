import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { searchRepository } from '../repositories/search.repository';
import { propertyRepository } from '../repositories/property.repository';
import { wishlistRepository } from '../repositories/wishlist.repository';
import { NotFoundError } from '../utils/errors';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination';

const searchQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(500).default(50),
  purpose: z.string().optional(),
  type: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  bedrooms: z.coerce.number().int().optional(),
  bathrooms: z.coerce.number().int().optional(),
  minArea: z.coerce.number().optional(),
  maxArea: z.coerce.number().optional(),
  furnishing: z.string().optional(),
  amenities: z.string().optional(), // comma-separated
  zeroBrokerage: z.coerce.boolean().optional(),
  city: z.string().optional(),
  locality: z.string().optional(),
  sort: z.enum(['distance', 'price_asc', 'price_desc', 'newest']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const bboxQuerySchema = z.object({
  north: z.coerce.number().min(-90).max(90),
  south: z.coerce.number().min(-90).max(90),
  east: z.coerce.number().min(-180).max(180),
  west: z.coerce.number().min(-180).max(180),
  purpose: z.string().optional(),
  type: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  bedrooms: z.coerce.number().int().optional(),
  bathrooms: z.coerce.number().int().optional(),
  zeroBrokerage: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  page: z.coerce.number().int().min(1).default(1),
});

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = searchQuerySchema.parse(req.query);

      const hasCoords = params.lat !== undefined && params.lng !== undefined;
      const lat = hasCoords ? params.lat : undefined;
      const lng = hasCoords ? params.lng : undefined;
      const radiusMeters = hasCoords ? params.radius * 1000 : undefined;

      const filters: Record<string, unknown> = {};
      if (params.purpose) filters.purpose = params.purpose;
      if (params.type) filters.type = params.type;
      if (params.minPrice !== undefined) filters.minPrice = params.minPrice;
      if (params.maxPrice !== undefined) filters.maxPrice = params.maxPrice;
      if (params.bedrooms !== undefined) filters.bedrooms = params.bedrooms;
      if (params.bathrooms !== undefined) filters.bathrooms = params.bathrooms;
      if (params.minArea !== undefined) filters.minArea = params.minArea;
      if (params.maxArea !== undefined) filters.maxArea = params.maxArea;
      if (params.furnishing) filters.furnishing = params.furnishing;
      if (params.zeroBrokerage) filters.zeroBrokerage = true;
      if (params.city) filters.city = params.city;
      if (params.locality) filters.locality = params.locality;
      if (params.amenities) filters.amenities = params.amenities.split(',');

      const offset = (params.page - 1) * params.limit;
      const result = await searchRepository.radiusSearch({
        lat, lng, radiusMeters, filters,
        limit: params.limit, offset, sort: params.sort,
      });

      res.json(buildPaginatedResponse(
        result.rows,
        result.total,
        { page: params.page, limit: params.limit, offset }
      ));
    } catch (error) {
      next(error);
    }
  }

  async searchBBox(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = bboxQuerySchema.parse(req.query);

      const filters: Record<string, unknown> = {};
      if (params.purpose) filters.purpose = params.purpose;
      if (params.type) filters.type = params.type;
      if (params.minPrice !== undefined) filters.minPrice = params.minPrice;
      if (params.maxPrice !== undefined) filters.maxPrice = params.maxPrice;
      if (params.bedrooms !== undefined) filters.bedrooms = params.bedrooms;
      if (params.bathrooms !== undefined) filters.bathrooms = params.bathrooms;
      if (params.zeroBrokerage) filters.zeroBrokerage = true;

      const offset = (params.page - 1) * params.limit;
      const result = await searchRepository.bboxSearch({
        north: params.north, south: params.south,
        east: params.east, west: params.west,
        filters, limit: params.limit, offset,
      });

      res.json(buildPaginatedResponse(
        result.rows,
        result.total,
        { page: params.page, limit: params.limit, offset }
      ));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const property = await propertyRepository.findByIdWithDetails((req.params.id as string));
      if (!property) throw new NotFoundError('Property');

      // Only show non-draft properties publicly
      if (property.status === 'DRAFT') {
        if (!req.user || (req.user.id !== property.owner_id && req.user.id !== property.broker_id)) {
          throw new NotFoundError('Property');
        }
      }

      // Increment view count
      await propertyRepository.incrementViewCount((req.params.id as string));

      // Get media
      const media = await propertyRepository.findMediaByPropertyId((req.params.id as string));

      // Check if wishlisted by current user
      let isWishlisted = false;
      if (req.user) {
        isWishlisted = await wishlistRepository.isWishlisted(req.user.id, (req.params.id as string));
      }

      res.json({
        ...property,
        media,
        isWishlisted,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const searchController = new SearchController();
