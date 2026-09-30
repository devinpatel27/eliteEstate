export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
  leadSourceId?: string;
  propertyTypeId?: string;
  category?: string;
}

export interface ReportScope {
  isScoped: boolean;
  targetUserId: string;
  isAdmin: boolean;
}

export type ReportType = 'overview' | 'leads' | 'employees' | 'properties' | 'visits';
export type ExportFormat = 'csv' | 'xlsx';
