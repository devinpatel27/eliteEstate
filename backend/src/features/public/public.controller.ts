import { Request, Response, NextFunction } from 'express';
import { propertyRepository } from '../properties/property.repository';
import { leadAutoAssignService } from '../../services/leadAutoAssign.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.utils';
import { getPagination } from '../../utils/pagination.utils';
import { toPublicProperty, toPublicPropertyList } from './public.mapper';
import { AppError } from '../../middleware/error.middleware';

export const publicController = {
  listProperties: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, skip } = getPagination(req);
      const { purpose, propertyType, minPrice, maxPrice, area, beds, amenities, sort } = req.query;

      let sortBy = 'createdAt';
      let sortOrder: 'asc' | 'desc' = 'desc';
      if (sort === 'price_asc') {
        sortBy = 'price';
        sortOrder = 'asc';
      } else if (sort === 'price_desc') {
        sortBy = 'price';
        sortOrder = 'desc';
      }

      const amenityList = amenities
        ? String(amenities).split(',').filter(Boolean)
        : undefined;

      const { data, total } = await propertyRepository.findAll({
        skip,
        limit,
        publishedOnly: true,
        purpose: purpose as string,
        propertyType: propertyType as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        area: area as string,
        beds: beds ? Number(beds) : undefined,
        amenities: amenityList,
        sortBy,
        sortOrder,
      });

      sendPaginated(res, 'Properties retrieved successfully', toPublicPropertyList(data as never), {
        page,
        limit,
        total,
      });
    } catch (error) {
      next(error);
    }
  },

  getPropertyBySlug: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const property = await propertyRepository.findBySlug(req.params.slug, true);
      if (!property) throw new AppError('Property not found', 404);
      void propertyRepository.incrementViewCount(String(property._id));
      sendSuccess(res, 'Property retrieved successfully', toPublicProperty(property as never));
    } catch (error) {
      next(error);
    }
  },

  getFeaturedProperties: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await propertyRepository.findFeatured(12);
      sendSuccess(res, 'Featured properties retrieved', toPublicPropertyList(data as never));
    } catch (error) {
      next(error);
    }
  },

  submitPropertyInquiry: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await leadAutoAssignService.createFromPropertyInquiry(req.body);
      sendCreated(res, 'Inquiry submitted successfully', { success: true, inquiryId: result.inquiry._id });
    } catch (error) {
      next(error);
    }
  },

  submitContactUs: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await leadAutoAssignService.createFromContactForm(req.body);
      sendCreated(res, 'Message sent successfully', { success: true, leadId: result.leadId });
    } catch (error) {
      next(error);
    }
  },
};
