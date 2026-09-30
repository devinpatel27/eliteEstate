export const PROPERTY_PURPOSES = ['buy', 'sell', 'rent'] as const;
export type PropertyPurpose = (typeof PROPERTY_PURPOSES)[number];

export const PROPERTY_STATUSES = [
  'available',
  'sold',
  'rented',
  'reserved',
  'under_negotiation',
] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const FURNISHED_STATUSES = ['fully', 'semi', 'unfurnished'] as const;
export type FurnishedStatus = (typeof FURNISHED_STATUSES)[number];

export const PROPERTY_SORT_OPTIONS = ['newest', 'price_asc', 'price_desc'] as const;
export type PropertySortOption = (typeof PROPERTY_SORT_OPTIONS)[number];
