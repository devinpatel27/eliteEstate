import { Types } from 'mongoose';
import path from 'path';
import fs from 'fs/promises';
import { propertyRepository } from './property.repository';
import { AppError } from '../../middleware/error.middleware';
import { logActivity } from '../../utils/activityLogger';
import { generatePropertyCode, slugifyTitle, ensureUniqueSlug } from '../../utils/propertyCode.utils';
import { isValidObjectId, toObjectId } from '../../utils/objectId.utils';
import { optimizePropertyImage, toUploadRelativePath, deleteMediaFiles } from '../../utils/image.utils';
import { CreatePropertyInput, UpdatePropertyInput } from './property.validator';
import { IProperty, PropertyMediaItem } from '../../models/Property.model';
import {
  PropertyPurpose,
  PropertyStatus,
  FurnishedStatus,
} from '../../constants/property.constants';

const mapAmenities = (ids?: string[]) =>
  ids?.filter(isValidObjectId).map((id) => new Types.ObjectId(id)) ?? [];

export const propertyService = {
  list: async (options: Parameters<typeof propertyRepository.findAll>[0]) =>
    propertyRepository.findAll(options),

  getDashboard: async () => propertyRepository.getDashboardStats(),

  getById: async (id: string) => {
    const property = await propertyRepository.findById(id);
    if (!property) throw new AppError('Property not found', 404);
    return property;
  },

  create: async (data: CreatePropertyInput, userId: string, ipAddress?: string) => {
    const propertyCode = await generatePropertyCode();
    const baseSlug = data.slug ? slugifyTitle(data.slug) : slugifyTitle(data.title);
    const slug = await ensureUniqueSlug(baseSlug);

    const property = await propertyRepository.create({
      propertyCode,
      title: data.title,
      slug,
      description: data.description,
      purpose: data.purpose as PropertyPurpose,
      propertyType: new Types.ObjectId(data.propertyType),
      status: (data.status as PropertyStatus) || 'available',
      expectedPrice: data.expectedPrice,
      rentAmount: data.rentAmount,
      securityDeposit: data.securityDeposit,
      maintenanceCharges: data.maintenanceCharges,
      country: data.country,
      state: data.state,
      city: data.city,
      area: data.area,
      landmark: data.landmark,
      latitude: data.latitude,
      longitude: data.longitude,
      publicLocationLabel: data.publicLocationLabel,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      balconies: data.balconies,
      parking: data.parking,
      superBuiltUpArea: data.superBuiltUpArea,
      carpetArea: data.carpetArea,
      furnishedStatus: data.furnishedStatus as FurnishedStatus,
      amenities: mapAmenities(data.amenities),
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      publishOnWebsite: data.publishOnWebsite ?? false,
      isFeatured: data.isFeatured ?? false,
      showPrice: data.showPrice ?? true,
      hideExactLocation: data.hideExactLocation ?? true,
      createdBy: new Types.ObjectId(userId),
    });

    await logActivity({
      userId,
      action: 'CREATE_PROPERTY',
      module: 'PROPERTY',
      description: `Created property ${propertyCode}`,
      ipAddress,
    });

    return propertyRepository.findById(property._id.toString());
  },

  update: async (id: string, data: UpdatePropertyInput, userId: string, ipAddress?: string) => {
    const existing = await propertyRepository.findById(id);
    if (!existing) throw new AppError('Property not found', 404);

    const update: Partial<IProperty> = { updatedBy: new Types.ObjectId(userId) };

    if (data.title) update.title = data.title;
    if (data.description !== undefined) update.description = data.description;
    if (data.purpose) update.purpose = data.purpose as PropertyPurpose;
    if (data.propertyType) update.propertyType = new Types.ObjectId(data.propertyType);
    if (data.status) update.status = data.status as PropertyStatus;
    if (data.expectedPrice !== undefined) update.expectedPrice = data.expectedPrice;
    if (data.rentAmount !== undefined) update.rentAmount = data.rentAmount;
    if (data.securityDeposit !== undefined) update.securityDeposit = data.securityDeposit;
    if (data.maintenanceCharges !== undefined) update.maintenanceCharges = data.maintenanceCharges;
    if (data.country !== undefined) update.country = data.country;
    if (data.state !== undefined) update.state = data.state;
    if (data.city !== undefined) update.city = data.city;
    if (data.area !== undefined) update.area = data.area;
    if (data.landmark !== undefined) update.landmark = data.landmark;
    if (data.latitude !== undefined) update.latitude = data.latitude;
    if (data.longitude !== undefined) update.longitude = data.longitude;
    if (data.publicLocationLabel !== undefined) update.publicLocationLabel = data.publicLocationLabel;
    if (data.bedrooms !== undefined) update.bedrooms = data.bedrooms;
    if (data.bathrooms !== undefined) update.bathrooms = data.bathrooms;
    if (data.balconies !== undefined) update.balconies = data.balconies;
    if (data.parking !== undefined) update.parking = data.parking;
    if (data.superBuiltUpArea !== undefined) update.superBuiltUpArea = data.superBuiltUpArea;
    if (data.carpetArea !== undefined) update.carpetArea = data.carpetArea;
    if (data.furnishedStatus) update.furnishedStatus = data.furnishedStatus as FurnishedStatus;
    if (data.amenities) update.amenities = mapAmenities(data.amenities);
    if (data.metaTitle !== undefined) update.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) update.metaDescription = data.metaDescription;
    if (data.publishOnWebsite !== undefined) update.publishOnWebsite = data.publishOnWebsite;
    if (data.isFeatured !== undefined) update.isFeatured = data.isFeatured;
    if (data.showPrice !== undefined) update.showPrice = data.showPrice;
    if (data.hideExactLocation !== undefined) update.hideExactLocation = data.hideExactLocation;

    if (data.slug) {
      update.slug = await ensureUniqueSlug(slugifyTitle(data.slug), id);
    } else if (data.title && data.title !== existing.title) {
      update.slug = await ensureUniqueSlug(slugifyTitle(data.title), id);
    }

    const updated = await propertyRepository.update(id, update);
    if (!updated) throw new AppError('Property not found', 404);

    await logActivity({
      userId,
      action: 'UPDATE_PROPERTY',
      module: 'PROPERTY',
      description: `Updated property ${existing.propertyCode}`,
      ipAddress,
    });

    return updated;
  },

  delete: async (id: string, userId: string, ipAddress?: string) => {
    const existing = await propertyRepository.findById(id);
    if (!existing) throw new AppError('Property not found', 404);
    await propertyRepository.softDelete(id);
    await logActivity({
      userId,
      action: 'DELETE_PROPERTY',
      module: 'PROPERTY',
      description: `Deleted property ${existing.propertyCode}`,
      ipAddress,
    });
  },

  togglePublish: async (id: string, userId: string) => {
    const existing = await propertyRepository.findById(id);
    if (!existing) throw new AppError('Property not found', 404);
    return propertyRepository.update(id, {
      publishOnWebsite: !existing.publishOnWebsite,
      updatedBy: new Types.ObjectId(userId),
    });
  },

  toggleFeature: async (id: string, userId: string) => {
    const existing = await propertyRepository.findById(id);
    if (!existing) throw new AppError('Property not found', 404);
    return propertyRepository.update(id, {
      isFeatured: !existing.isFeatured,
      updatedBy: new Types.ObjectId(userId),
    });
  },

  uploadMedia: async (
    id: string,
    file: Express.Multer.File,
    mediaType: 'featured' | 'gallery' | 'video' | 'floorplan',
    title?: string,
    userId?: string
  ) => {
    const existing = await propertyRepository.findById(id);
    if (!existing) throw new AppError('Property not found', 404);

    const relPath = toUploadRelativePath(file.path);
    const update: Partial<IProperty> = { updatedBy: userId ? new Types.ObjectId(userId) : undefined };

    if (mediaType === 'video') {
      const videos = [...(existing.videos || []), { path: relPath, title }];
      update.videos = videos;
    } else {
      let mediaItem: PropertyMediaItem = {
        path: relPath,
        originalName: file.originalname,
      };

      if (file.mimetype.startsWith('image/')) {
        const optimized = await optimizePropertyImage(file.path);
        mediaItem = { ...mediaItem, ...optimized };
      }

      if (mediaType === 'featured') {
        if (existing.featuredImage) {
          await deleteMediaFiles([
            existing.featuredImage.path,
            existing.featuredImage.thumbPath,
            existing.featuredImage.mediumPath,
          ]);
        }
        update.featuredImage = mediaItem;
      } else if (mediaType === 'gallery') {
        update.gallery = [...(existing.gallery || []), mediaItem];
      } else {
        update.floorPlans = [...(existing.floorPlans || []), mediaItem];
      }
    }

    return propertyRepository.update(id, update);
  },

  deleteMedia: async (id: string, mediaId: string, userId: string) => {
    const existing = await propertyRepository.findById(id);
    if (!existing) throw new AppError('Property not found', 404);

    const update: Partial<IProperty> = { updatedBy: new Types.ObjectId(userId) };
    let deleted = false;

    if (existing.featuredImage && String((existing.featuredImage as PropertyMediaItem & { _id?: Types.ObjectId })._id) === mediaId) {
      await deleteMediaFiles([
        existing.featuredImage.path,
        existing.featuredImage.thumbPath,
        existing.featuredImage.mediumPath,
      ]);
      update.featuredImage = undefined;
      deleted = true;
    }

    const filterMedia = (items: PropertyMediaItem[]) =>
      items.filter((item) => {
        const itemId = String((item as PropertyMediaItem & { _id?: Types.ObjectId })._id);
        if (itemId === mediaId) {
          deleteMediaFiles([item.path, item.thumbPath, item.mediumPath]);
          deleted = true;
          return false;
        }
        return true;
      });

    update.gallery = filterMedia(existing.gallery || []);
    update.floorPlans = filterMedia(existing.floorPlans || []);

    const videoIdx = (existing.videos || []).findIndex(
      (v) => String((v as { _id?: Types.ObjectId })._id) === mediaId
    );
    if (videoIdx >= 0) {
      const video = existing.videos[videoIdx];
      await deleteMediaFiles([video.path]);
      update.videos = existing.videos.filter((_, i) => i !== videoIdx);
      deleted = true;
    }

    if (!deleted) throw new AppError('Media not found', 404);
    return propertyRepository.update(id, update);
  },

  getInquiries: async (id: string, skip: number, limit: number) => {
    const existing = await propertyRepository.findById(id);
    if (!existing) throw new AppError('Property not found', 404);
    return propertyRepository.findInquiries(id, skip, limit);
  },
};
