export interface MasterItem {
  _id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  sortOrder: number;
}

export interface FollowUpActivity extends MasterItem {
  parent?: string | MasterItem;
  children?: FollowUpActivity[];
}

export interface LeadUser {
  _id: string;
  name: string;
  employeeId?: string;
  email?: string;
}

export interface Lead {
  _id: string;
  leadId: string;
  customerName: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  city?: string;
  address?: string;
  category: string;
  propertyType: MasterItem | string;
  propertyConfiguration?: string;
  leadSource: MasterItem | string;
  budgetMin?: number;
  budgetMax?: number;
  preferredArea?: string;
  priority: 'hot' | 'warm' | 'cold';
  status: string;
  initialRemark?: string;
  notes?: LeadNote[];
  assignedTo?: LeadUser;
  assignedAt?: string;
  nextFollowUpDate?: string;
  lastFollowUpRemark?: string;
  lastFollowUpDate?: string;
  createdBy?: LeadUser;
  createdAt: string;
  updatedAt: string;
}

export interface LeadNote {
  _id?: string;
  text: string;
  createdBy: LeadUser;
  createdAt: string;
}

export interface LeadFollowUp {
  _id: string;
  leadId: string;
  followUpDate: string;
  followUpTime?: string;
  type: string;
  priority?: 'hot' | 'warm' | 'cold';
  parentActivity?: FollowUpActivity | string;
  childActivity?: FollowUpActivity | string;
  remark?: string;
  nextFollowUpDate?: string;
  createdBy: LeadUser;
  createdAt: string;
}

export interface LeadActivity {
  _id: string;
  type: string;
  title: string;
  remark?: string;
  performedBy: LeadUser;
  createdAt: string;
}

export interface LeadAssignment {
  _id: string;
  assignedTo: LeadUser;
  assignedBy: LeadUser;
  assignedAt: string;
  transferredAt?: string;
  transferRemark?: string;
  isCurrent: boolean;
  sequence: number;
}

export interface LeadListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
  propertyType?: string;
  propertyConfiguration?: string;
  leadSource?: string;
  assignedTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
  nfdFrom?: string;
  nfdTo?: string;
  followUpDue?: 'today' | 'tomorrow' | 'overdue';
}

export interface CreateLeadData {
  customerName: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  city?: string;
  address?: string;
  category: string;
  propertyType: string;
  propertyConfiguration?: string;
  leadSource: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredArea?: string;
  assignedTo?: string;
  priority: string;
  nextFollowUpDate?: string;
  initialRemark?: string;
}

export interface LeadStats {
  totalLeads: number;
  newLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  todayFollowUps: number;
  tomorrowFollowUps: number;
  overdueFollowUps: number;
  todayVisits: number;
  tomorrowVisits: number;
  overdueVisits: number;
  closedWon: number;
  closedLost: number;
  isAdminView: boolean;
}

export interface MobileCheckResult {
  exists: boolean;
  activeLead: Lead | null;
  closedLeads: Lead[];
  normalizedMobile: string;
}
