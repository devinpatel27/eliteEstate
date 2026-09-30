'use client';

import { Download, FileSpreadsheet, Printer, RotateCcw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';
import { useReportExport } from '../hooks/useReports';
import { ReportFilters, ReportType } from '../types/reports.types';
import { useResetReportFilters } from './GlobalReportFilters';
import { toast } from 'sonner';

interface ReportActionBarProps {
  reportType: ReportType;
  filters: ReportFilters;
  onApplyFilters?: () => void;
}

export function ReportActionBar({ reportType, filters, onApplyFilters }: ReportActionBarProps) {
  const { hasPermission, isAdmin } = usePermissions();
  const exportReport = useReportExport();
  const resetFilters = useResetReportFilters();

  const canExport = hasPermission(PERMISSIONS.REPORT_EXPORT) || isAdmin();

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      await exportReport(reportType, format, filters);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={onApplyFilters}>
        <Filter className="mr-1.5 h-4 w-4" />
        Apply Filters
      </Button>
      <Button variant="outline" size="sm" onClick={resetFilters}>
        <RotateCcw className="mr-1.5 h-4 w-4" />
        Reset Filters
      </Button>
      {canExport && (
        <>
          <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV
          </Button>
        </>
      )}
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="mr-1.5 h-4 w-4" />
        Print Report
      </Button>
    </div>
  );
}
