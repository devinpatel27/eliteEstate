export interface VisitLead {
  _id: string;
  leadId: string;
  customerName: string;
  mobile: string;
  assignedTo?: { _id: string; name: string; employeeId?: string };
  assignedAt?: string;
}

export interface Visit {
  _id: string;
  leadId: string;
  assignmentId?: string;
  followUpId?: string;
  type: 'property_visit' | 'site_visit' | 'revisit';
  scheduledDate: string;
  scheduledTime?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  remark?: string;
  isFavorite: boolean;
  source: 'follow_up' | 'manual';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lead?: VisitLead | null;
}

export interface VisitHistory {
  _id: string;
  visitId: string;
  action: string;
  remark?: string;
  performedBy?: { _id: string; name: string; employeeId?: string };
  performedAt: string;
  metadata?: Record<string, unknown>;
}

export interface VisitDetail extends Visit {
  history?: VisitHistory[];
}

export interface VisitListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  favorite?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateVisitData {
  leadId: string;
  type: string;
  scheduledDate: string;
  scheduledTime?: string;
  remark?: string;
  status?: string;
}
