const randomInquiryDisplayCount = (): number =>
  Math.floor(Math.random() * 6) + 5; // 5-10 inclusive

const getDisplayPrice = (property: Record<string, unknown>) => {
  if (!property.showPrice) return null;
  if (property.purpose === 'rent') return property.rentAmount ?? null;
  return property.expectedPrice ?? null;
};

const mapMediaUrl = (path?: string) => (path ? `/uploads/${path}` : undefined);

export const toPublicProperty = (property: Record<string, unknown>) => {
  const featured = property.featuredImage as Record<string, string> | undefined;
  const gallery = (property.gallery as Record<string, string>[]) || [];
  const floorPlans = (property.floorPlans as Record<string, string>[]) || [];

  return {
    id: String(property._id),
    slug: property.slug,
    title: property.title,
    description: property.description,
    purpose: property.purpose,
    propertyType: property.propertyType,
    status: property.status,
    price: getDisplayPrice(property),
    rentAmount: property.showPrice ? property.rentAmount : null,
    expectedPrice: property.showPrice ? property.expectedPrice : null,
    showPrice: property.showPrice,
    publicLocationLabel: property.publicLocationLabel,
    city: property.city,
    area: property.area,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    balconies: property.balconies,
    parking: property.parking,
    superBuiltUpArea: property.superBuiltUpArea,
    carpetArea: property.carpetArea,
    furnishedStatus: property.furnishedStatus,
    amenities: property.amenities,
    featuredImage: featured
      ? {
          url: mapMediaUrl(featured.mediumPath || featured.path),
          thumb: mapMediaUrl(featured.thumbPath || featured.path),
        }
      : null,
    gallery: gallery.map((g) => ({
      url: mapMediaUrl(g.mediumPath || g.path),
      thumb: mapMediaUrl(g.thumbPath || g.path),
    })),
    floorPlans: floorPlans.map((f) => ({
      url: mapMediaUrl(f.mediumPath || f.path),
      thumb: mapMediaUrl(f.thumbPath || f.path),
    })),
    videos: property.videos,
    metaTitle: property.metaTitle,
    metaDescription: property.metaDescription,
    isFeatured: property.isFeatured,
    inquiryCount: property.inquiryCount ?? 0,
    inquiryDisplayCount: randomInquiryDisplayCount(),
    createdAt: property.createdAt,
  };
};

export const toPublicPropertyList = (properties: Record<string, unknown>[]) =>
  properties.map(toPublicProperty);
