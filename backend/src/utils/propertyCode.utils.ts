import { PropertyModel } from '../models/Property.model';

const PR_ID_PATTERN = /^PR(\d+)$/;

export const generatePropertyCode = async (): Promise<string> => {
  const lastProperty = await PropertyModel.findOne(
    { propertyCode: { $regex: /^PR\d+$/ } },
    { propertyCode: 1 },
    { sort: { createdAt: -1 } }
  );

  if (!lastProperty?.propertyCode) {
    return 'PR0001';
  }

  const match = lastProperty.propertyCode.match(PR_ID_PATTERN);
  const lastNumber = match ? parseInt(match[1], 10) : 0;
  return `PR${String(lastNumber + 1).padStart(4, '0')}`;
};

export const slugifyTitle = (title: string): string =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const ensureUniqueSlug = async (baseSlug: string, excludeId?: string): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query: Record<string, unknown> = { slug, deletedAt: null };
    if (excludeId) query._id = { $ne: excludeId };

    const existing = await PropertyModel.findOne(query).select('_id').lean();
    if (!existing) return slug;

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};
