export type DashboardViewMode = 'admin' | 'employee' | 'preview';

export interface EmployeeScheduleCounts {
  visitsToday: number;
  visitsTomorrow: number;
  visitsDue: number;
  followUpsToday: number;
  followUpsTomorrow: number;
  followUpsDue: number;
}

export interface DashboardOverview {
  employee: {
    _id: string;
    name: string;
    employeeId: string;
    role: string;
    profileImage?: string;
  };
  isAdminView: boolean;
  isPreview: boolean;
  viewMode: DashboardViewMode;
  freshLeads: number;
  timeline: {
    visits: { today: number; tomorrow: number; due: number };
    followUps: { today: number; tomorrow: number; due: number };
    unique: { today: number; tomorrow: number; due: number };
  };
  thermal: { hot: number; warm: number; cold: number };
  visitTasks: {
    today: VisitTaskItem[];
    tomorrow: VisitTaskItem[];
    due: VisitTaskItem[];
  };
  leadTasks: {
    today: LeadTaskItem[];
    tomorrow: LeadTaskItem[];
    due: LeadTaskItem[];
  };
}

export interface VisitTaskItem {
  _id: string;
  type: string;
  status: string;
  scheduledDate: string;
  scheduledTime?: string;
  remark?: string;
  lead?: {
    _id: string;
    leadId: string;
    customerName: string;
    mobile: string;
    priority: string;
  };
}

export interface LeadTaskItem {
  _id: string;
  leadId: string;
  customerName: string;
  mobile: string;
  priority: string;
  status: string;
  nextFollowUpDate?: string;
  source: string;
  assignedToName?: string;
}

export interface EmployeePerformanceRow {
  _id: string;
  name: string;
  employeeId: string;
  role: string;
  profileImage?: string;
  metrics: {
    newEnquiry: number;
    phoneCall: number;
    siteVisit: number;
    multipleVisit: number;
    discussion: number;
    dealSucceed: number;
    dealLost: number;
  };
  schedule: EmployeeScheduleCounts;
}

export interface EmployeePerformanceData {
  summary: EmployeePerformanceRow['metrics'];
  scheduleSummary: EmployeeScheduleCounts;
  employees: EmployeePerformanceRow[];
}

export interface EmployeeLeadStreamItem extends LeadTaskItem {
  email?: string;
  createdAt?: string;
}

export interface FollowUpJourneyItem {
  _id: string;
  type: string;
  remark?: string;
  followUpDate: string;
  followUpTime?: string;
  nextFollowUpDate?: string;
  createdBy?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  todayLogins: number;
}

export interface ActivityLog {
  _id: string;
  user: {
    _id: string;
    name: string;
    employeeId: string;
    profileImage?: string;
  };
  action: string;
  module: string;
  description?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface LatestEmployee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  role: { roleName: string };
  status: 'active' | 'inactive';
  profileImage?: string;
  createdAt: string;
}

export interface LeadDashboardStats {
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
