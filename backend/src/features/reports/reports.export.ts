import { Response } from 'express';
import ExcelJS from 'exceljs';
import { JwtPayload } from '../../types/api.types';
import { reportsService } from './reports.service';
import { ExportFormat, ReportFilters, ReportType } from './reports.types';

function escapeCsv(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function sendCsv(res: Response, filename: string, headers: string[], rows: unknown[][]): void {
  const lines = [headers.map(escapeCsv).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(','));
  }
  const content = lines.join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(content);
}

async function sendXlsx(
  res: Response,
  filename: string,
  sheets: { name: string; headers: string[]; rows: unknown[][] }[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name);
    ws.addRow(sheet.headers);
    for (const row of sheet.rows) {
      ws.addRow(row);
    }
    ws.getRow(1).font = { bold: true };
  }
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

export const reportsExportService = {
  export: async (
    user: JwtPayload,
    report: ReportType,
    format: ExportFormat,
    filters: ReportFilters,
    res: Response
  ): Promise<void> => {
    const query = filters as Record<string, unknown>;
    const timestamp = new Date().toISOString().slice(0, 10);

    if (report === 'overview') {
      const data = await reportsService.getOverview(user, query);
      const headers = ['Metric', 'Value'];
      const rows: unknown[][] = [
        ['Total Leads', data.totalLeads],
        ['Active Leads', data.activeLeads],
        ['Closed Leads', data.closedLeads],
        ['Total Properties', data.totalProperties],
        ['Active Properties', data.activeProperties],
        ['Total Visits', data.totalVisits],
        ['Completed Visits', data.completedVisits],
        ['Total Employees', data.totalEmployees],
      ];
      if (format === 'csv') {
        sendCsv(res, `overview-report-${timestamp}.csv`, headers, rows);
      } else {
        await sendXlsx(res, `overview-report-${timestamp}.xlsx`, [{ name: 'Overview', headers, rows }]);
      }
      return;
    }

    if (report === 'leads') {
      const data = await reportsService.getLeads(user, query);
      const kpiHeaders = ['Metric', 'Value'];
      const kpiRows: unknown[][] = Object.entries(data.kpis).map(([k, v]) => [k, v]);
      kpiRows.push(['Conversion Rate (%)', data.conversionRate]);

      const sourceHeaders = ['Source', 'Count'];
      const sourceRows = data.leadSourcePerformance.map((s) => [s.name, s.count]);

      const statusHeaders = ['Status', 'Count'];
      const statusRows = data.statusDistribution.map((s) => [s.label, s.count]);

      const trendHeaders = ['Month', 'Leads'];
      const trendRows = data.monthlyTrend.map((m) => [m.label, m.count]);

      if (format === 'csv') {
        const allRows = [
          ...kpiRows,
          [],
          ...sourceRows.map((r) => ['Source', ...r]),
          [],
          ...statusRows.map((r) => ['Status', ...r]),
          [],
          ...trendRows.map((r) => ['Month', ...r]),
        ];
        sendCsv(res, `leads-report-${timestamp}.csv`, kpiHeaders, allRows as unknown[][]);
      } else {
        await sendXlsx(res, `leads-report-${timestamp}.xlsx`, [
          { name: 'KPIs', headers: kpiHeaders, rows: kpiRows },
          { name: 'Lead Sources', headers: sourceHeaders, rows: sourceRows },
          { name: 'Status Distribution', headers: statusHeaders, rows: statusRows },
          { name: 'Monthly Trend', headers: trendHeaders, rows: trendRows },
        ]);
      }
      return;
    }

    if (report === 'employees') {
      const data = await reportsService.getEmployees(user, query);
      const headers = [
        'Employee Name',
        'Assigned Leads',
        'Calls Done',
        'Follow-ups Added',
        'Visits Scheduled',
        'Visits Completed',
        'Closed Leads',
        'Conversion %',
      ];
      const rows = data.employees.map((e) => [
        e.name,
        e.assignedLeads,
        e.callsDone,
        e.followUpsAdded,
        e.visitsScheduled,
        e.visitsCompleted,
        e.closedLeads,
        e.conversionRate,
      ]);
      if (format === 'csv') {
        sendCsv(res, `employees-report-${timestamp}.csv`, headers, rows);
      } else {
        await sendXlsx(res, `employees-report-${timestamp}.xlsx`, [
          { name: 'Employee Performance', headers, rows },
        ]);
      }
      return;
    }

    if (report === 'properties') {
      const data = await reportsService.getProperties(user, query);
      const kpiHeaders = ['Metric', 'Value'];
      const kpiRows: unknown[][] = Object.entries(data.kpis).map(([k, v]) => [k, v]);

      const typeHeaders = ['Property Type', 'Count'];
      const typeRows = data.propertyTypeReport.map((t) => [t.name, t.count]);

      const topHeaders = ['Property Name', 'Views', 'Inquiries', 'Last Inquiry Date'];
      const topRows = data.topViewedProperties.map((p) => [
        p.propertyName,
        p.views,
        p.inquiries,
        p.lastInquiryDate ?? '',
      ]);

      if (format === 'csv') {
        sendCsv(res, `properties-report-${timestamp}.csv`, kpiHeaders, [
          ...kpiRows,
          [],
          ...typeRows,
          [],
          ...topRows,
        ] as unknown[][]);
      } else {
        await sendXlsx(res, `properties-report-${timestamp}.xlsx`, [
          { name: 'KPIs', headers: kpiHeaders, rows: kpiRows },
          { name: 'Property Types', headers: typeHeaders, rows: typeRows },
          { name: 'Top Viewed', headers: topHeaders, rows: topRows },
        ]);
      }
      return;
    }

    if (report === 'visits') {
      const data = await reportsService.getVisits(user, query);
      const kpiHeaders = ['Metric', 'Value'];
      const kpiRows: unknown[][] = Object.entries(data.kpis).map(([k, v]) => [k, v]);

      const statusHeaders = ['Status', 'Count'];
      const statusRows = data.statusDistribution.map((s) => [s.label, s.count]);

      const trendHeaders = ['Month', 'Visits'];
      const trendRows = data.monthlyTrend.map((m) => [m.label, m.count]);

      if (format === 'csv') {
        sendCsv(res, `visits-report-${timestamp}.csv`, kpiHeaders, [
          ...kpiRows,
          [],
          ...statusRows,
          [],
          ...trendRows,
        ] as unknown[][]);
      } else {
        await sendXlsx(res, `visits-report-${timestamp}.xlsx`, [
          { name: 'KPIs', headers: kpiHeaders, rows: kpiRows },
          { name: 'Status Distribution', headers: statusHeaders, rows: statusRows },
          { name: 'Monthly Trend', headers: trendHeaders, rows: trendRows },
        ]);
      }
    }
  },
};
