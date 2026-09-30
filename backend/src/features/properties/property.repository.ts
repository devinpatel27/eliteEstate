import { FilterQuery } from 'mongoose';
import { PropertyModel, IProperty } from '../../models/Property.model';
import { PropertyInquiryModel } from '../../models/PropertyInquiry.model';
import { isValidObjectId, toObjectId } from '../../utils/objectId.utils';

export interface ListPropertyOptions {
  skip: number;
  limit: number;
  search?: string;
  purpose?: string;
  status?: string;
  propertyType?: string;
  publishOnWebsite?: boolean;
  isFeatured?: boolean;
  city?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  publishedOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  area?: string;
  beds?: number;
  amenities?: string[];
}

const populateFields = [
  { path: 'propertyType', select: 'name slug' },
  { path: 'amenities', select: 'name slug' },
  { path: 'createdBy', select: 'name employeeId' },
];

export const propertyRepository = {
  findAll: async (options: ListPropertyOptions) => {
    const query: FilterQuery<IProperty> = { deletedAt: null };

    if (options.publishedOnly) query.publishOnWebsite = true;
    if (options.purpose) query.purpose = options.purpose;
    if (options.status) query.status = options.status;
    if (options.propertyType && isValidObjectId(options.propertyType)) {
      query.propertyType = toObjectId(options.propertyType);
    }
    if (options.publishOnWebsite !== undefined) query.publishOnWebsite = options.publishOnWebsite;
    if (options.isFeatured !== undefined) query.isFeatured = options.isFeatured;
    if (options.city) query.city = { $regex: options.city, $options: 'i' };
    if (options.area) query.area = { $regex: options.area, $options: 'i' };
    if (options.beds) query.bedrooms = { $gte: options.beds };

    if (options.amenities?.length) {
      const amenityIds = options.amenities.filter(isValidObjectId).map((id) => toObjectId(id));
      if (amenityIds.length) query.amenities = { $all: amenityIds };
    }

    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      const priceOr: FilterQuery<IProperty>[] = [];
      const rentFilter: Record<string, number> = {};
      const saleFilter: Record<string, number> = {};
      if (options.minPrice !== undefined) {
        rentFilter.$gte = options.minPrice;
        saleFilter.$gte = options.minPrice;
      }
      if (options.maxPrice !== undefined) {
        rentFilter.$lte = options.maxPrice;
        saleFilter.$lte = options.maxPrice;
      }
      if (Object.keys(rentFilter).length) priceOr.push({ rentAmount: rentFilter });
      if (Object.keys(saleFilter).length) priceOr.push({ expectedPrice: saleFilter });
      if (priceOr.length) query.$or = priceOr;
    }

    if (options.search) {
      query.$or = [
        { title: { $regex: options.search, $options: 'i' } },
        { propertyCode: { $regex: options.search, $options: 'i' } },
        { city: { $regex: options.search, $options: 'i' } },
        { area: { $regex: options.search, $options: 'i' } },
      ];
    }

    const sortFieldMap: Record<string, string> = {
      title: 'title',
      purpose: 'purpose',
      status: 'status',
      expectedPrice: 'expectedPrice',
      rentAmount: 'rentAmount',
      createdAt: 'createdAt',
      price: 'expectedPrice',
    };
    const sortField = sortFieldMap[options.sortBy || ''] || 'createdAt';
    const sortDir = options.sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      PropertyModel.find(query)
        .populate(populateFields)
        .sort({ [sortField]: sortDir })
        .skip(options.skip)
        .limit(options.limit)
        .lean(),
      PropertyModel.countDocuments(query),
    ]);

    return { data, total };
  },

  findFeatured: async (limit = 6) =>
    PropertyModel.find({ deletedAt: null, publishOnWebsite: true, isFeatured: true })
      .populate(populateFields)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),

  findById: async (id: string) => {
    if (!isValidObjectId(id)) return null;
    return PropertyModel.findOne({ _id: id, deletedAt: null }).populate(populateFields).lean();
  },

  findBySlug: async (slug: string, publishedOnly = false) => {
    const query: FilterQuery<IProperty> = { slug, deletedAt: null };
    if (publishedOnly) query.publishOnWebsite = true;
    return PropertyModel.findOne(query).populate(populateFields).lean();
  },

  create: async (data: Partial<IProperty>) => PropertyModel.create(data),

  update: async (id: string, data: Partial<IProperty>) => {
    if (!isValidObjectId(id)) return null;
    return PropertyModel.findOneAndUpdate({ _id: id, deletedAt: null }, data, {
      new: true,
      runValidators: true,
    })
      .populate(populateFields)
      .lean();
  },

  softDelete: async (id: string) => {
    if (!isValidObjectId(id)) return null;
    return PropertyModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    ).lean();
  },

  getDashboardStats: async () => {
    const base = { deletedAt: null };
    const [
      total,
      buy,
      sell,
      rent,
      published,
      featured,
      sold,
      rented,
    ] = await Promise.all([
      PropertyModel.countDocuments(base),
      PropertyModel.countDocuments({ ...base, purpose: 'buy' }),
      PropertyModel.countDocuments({ ...base, purpose: 'sell' }),
      PropertyModel.countDocuments({ ...base, purpose: 'rent' }),
      PropertyModel.countDocuments({ ...base, publishOnWebsite: true }),
      PropertyModel.countDocuments({ ...base, isFeatured: true }),
      PropertyModel.countDocuments({ ...base, status: 'sold' }),
      PropertyModel.countDocuments({ ...base, status: 'rented' }),
    ]);
    return { total, buy, sell, rent, published, featured, sold, rented };
  },

  incrementInquiryCount: async (id: string) => {
    if (!isValidObjectId(id)) return null;
    return PropertyModel.findByIdAndUpdate(id, { $inc: { inquiryCount: 1 } }, { new: true }).lean();
  },

  incrementViewCount: async (id: string) => {
    if (!isValidObjectId(id)) return null;
    return PropertyModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).lean();
  },

  findInquiries: async (propertyId: string, skip: number, limit: number) => {
    if (!isValidObjectId(propertyId)) return { data: [], total: 0 };
    const query = { propertyId: toObjectId(propertyId) };
    const [data, total] = await Promise.all([
      PropertyInquiryModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PropertyInquiryModel.countDocuments(query),
    ]);
    return { data, total };
  },

  createInquiry: async (data: {
    propertyId: string;
    name: string;
    mobile: string;
    email?: string;
    message?: string;
    leadId?: string;
  }) =>
    PropertyInquiryModel.create({
      propertyId: toObjectId(data.propertyId),
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      message: data.message,
      leadId: data.leadId ? toObjectId(data.leadId) : undefined,
    }),
};
