export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
  leadSourceId?: string;
  propertyTypeId?: string;
  category?: string;
}

export type ReportType = 'overview' | 'leads' | 'employees' | 'properties' | 'visits';

export interface ChartPoint {
  name: string;
  value: number;
  label?: string;
  count?: number;
}

export interface MonthlyTrendPoint {
  label: string;
  year: number;
  month: number;
  count: number;
}

export interface OverviewReportData {
  totalLeads: number;
  activeLeads: number;
  closedLeads: number;
  totalProperties: number;
  activeProperties: number;
  totalVisits: number;
  completedVisits: number;
  totalEmployees: number;
  isScoped?: boolean;
}

export interface LeadsReportData {
  kpis: {
    newLeads: number;
    contactedLeads: number;
    followUpLeads: number;
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
    closedWon: number;
    closedLost: number;
    totalLeads: number;
  };
  conversionRate: number;
  leadSourcePerformance: { name: string; count: number }[];
  statusDistribution: { status: string; label: string; count: number }[];
  monthlyTrend: MonthlyTrendPoint[];
}

export interface EmployeePerformanceRow {
  _id: string;
  name: string;
  employeeId?: string;
  assignedLeads: number;
  callsDone: number;
  followUpsAdded: number;
  visitsScheduled: number;
  visitsCompleted: number;
  closedLeads: number;
  conversionRate: number;
}

export interface EmployeesReportData {
  employees: EmployeePerformanceRow[];
  topPerformers: {
    byClosedLeads: EmployeePerformanceRow[];
    byConversion: EmployeePerformanceRow[];
    byVisitsCompleted: EmployeePerformanceRow[];
  };
}

export interface PropertiesReportData {
  kpis: {
    totalProperties: number;
    buyProperties: number;
    sellProperties: number;
    rentProperties: number;
    publishedProperties: number;
    featuredProperties: number;
    soldProperties: number;
    rentedProperties: number;
  };
  purposeDistribution: { name: string; count: number }[];
  propertyTypeReport: { name: string; count: number }[];
  websiteAnalytics: {
    totalPropertyViews: number;
    totalPropertyInquiries: number;
    featuredPropertyViews: number;
  };
  topViewedProperties: {
    propertyName: string;
    propertyCode: string;
    views: number;
    inquiries: number;
    lastInquiryDate: string | null;
  }[];
}

export interface VisitsReportData {
  kpis: {
    totalVisits: number;
    scheduledVisits: number;
    completedVisits: number;
    cancelledVisits: number;
    reVisits: number;
  };
  statusDistribution: { status: string; label: string; count: number }[];
  monthlyTrend: MonthlyTrendPoint[];
}
