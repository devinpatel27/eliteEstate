import { Router } from 'express';
import { publicController } from './public.controller';
import { validate } from '../../middleware/validation.middleware';
import { rateLimitPublicPost } from '../../middleware/rateLimit.middleware';
import {
  publicListPropertiesSchema,
  publicSlugParamSchema,
  propertyInquirySchema,
  contactUsSchema,
} from '../properties/property.validator';

export const publicRoutes = Router();

publicRoutes.get(
  '/properties',
  validate(publicListPropertiesSchema),
  publicController.listProperties
);

publicRoutes.get(
  '/properties/:slug',
  validate(publicSlugParamSchema),
  publicController.getPropertyBySlug
);

publicRoutes.get('/featured-properties', publicController.getFeaturedProperties);

publicRoutes.post(
  '/property-inquiry',
  rateLimitPublicPost(),
  validate(propertyInquirySchema),
  publicController.submitPropertyInquiry
);

publicRoutes.post(
  '/contact-us',
  rateLimitPublicPost(),
  validate(contactUsSchema),
  publicController.submitContactUs
);
