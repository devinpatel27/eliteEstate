import type { FollowUpType } from './lead.constants';

export const VISIT_TYPES = ['property_visit', 'site_visit', 'revisit'] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

export const VISIT_STATUSES = ['scheduled', 'completed', 'cancelled', 'rescheduled'] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const VISIT_SOURCES = ['follow_up', 'manual'] as const;
export type VisitSource = (typeof VISIT_SOURCES)[number];

export const VISIT_HISTORY_ACTIONS = [
  'scheduled',
  'completed',
  'cancelled',
  'rescheduled',
  'note',
  'status_changed',
] as const;
export type VisitHistoryAction = (typeof VISIT_HISTORY_ACTIONS)[number];

export const FOLLOW_UP_VISIT_TYPES: FollowUpType[] = ['property_visit', 'site_visit', 'revisit'];

export const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  property_visit: 'Property Visit',
  site_visit: 'Site Visit',
  revisit: 'Re-Visit',
};

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
};
