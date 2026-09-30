'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { LEAD_CATEGORIES } from '@/lib/constants';
import { usePermissions } from '@/hooks/usePermissions';
import { masterService } from '@/features/leads/services/master.service';
import { employeeService } from '@/features/employees/services/employee.service';
import { ReportFilters } from '../types/reports.types';

interface GlobalReportFiltersProps {
  onApply?: () => void;
}

export function GlobalReportFilters({ onApply }: GlobalReportFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { canViewAllLeads } = usePermissions();

  const [draft, setDraft] = useState<ReportFilters>({
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
    employeeId: searchParams.get('employeeId') || undefined,
    leadSourceId: searchParams.get('leadSourceId') || undefined,
    propertyTypeId: searchParams.get('propertyTypeId') || undefined,
    category: searchParams.get('category') || undefined,
  });

  useEffect(() => {
    setDraft({
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      employeeId: searchParams.get('employeeId') || undefined,
      leadSourceId: searchParams.get('leadSourceId') || undefined,
      propertyTypeId: searchParams.get('propertyTypeId') || undefined,
      category: searchParams.get('category') || undefined,
    });
  }, [searchParams]);

  const { data: leadSources = [] } = useQuery({
    queryKey: ['lead-sources', 'active'],
    queryFn: async () => {
      const res = await masterService.listLeadSources(true);
      return res.data || [];
    },
  });

  const { data: propertyTypes = [] } = useQuery({
    queryKey: ['property-types', 'active'],
    queryFn: async () => {
      const res = await masterService.listPropertyTypes(true);
      return res.data || [];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', 'report-filter'],
    queryFn: async () => {
      const res = await employeeService.list({ page: 1, limit: 100, status: 'active' });
      return res.data || [];
    },
    enabled: canViewAllLeads(),
  });

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (draft.dateFrom) params.set('dateFrom', draft.dateFrom);
    if (draft.dateTo) params.set('dateTo', draft.dateTo);
    if (draft.employeeId) params.set('employeeId', draft.employeeId);
    if (draft.leadSourceId) params.set('leadSourceId', draft.leadSourceId);
    if (draft.propertyTypeId) params.set('propertyTypeId', draft.propertyTypeId);
    if (draft.category) params.set('category', draft.category);
    router.replace(`${pathname}?${params.toString()}`);
    onApply?.();
  }, [draft, pathname, router, onApply]);

  return (
    <Card className="crm-card p-4 print:hidden">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <DateRangePicker
          dateFrom={draft.dateFrom}
          dateTo={draft.dateTo}
          onChange={(range) => setDraft((d) => ({ ...d, ...range }))}
        />

        {canViewAllLeads() && (
          <Select
            value={draft.employeeId || 'all'}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, employeeId: v === 'all' ? undefined : v }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp._id} value={emp._id}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={draft.leadSourceId || 'all'}
          onValueChange={(v) =>
            setDraft((d) => ({ ...d, leadSourceId: v === 'all' ? undefined : v }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Lead Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {leadSources.map((s) => (
              <SelectItem key={s._id} value={s._id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={draft.propertyTypeId || 'all'}
          onValueChange={(v) =>
            setDraft((d) => ({ ...d, propertyTypeId: v === 'all' ? undefined : v }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Property Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {propertyTypes.map((t) => (
              <SelectItem key={t._id} value={t._id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={draft.category || 'all'}
          onValueChange={(v) =>
            setDraft((d) => ({ ...d, category: v === 'all' ? undefined : v }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Buy / Sell / Rent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {LEAD_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.shortLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={applyFilters}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Apply Filters
        </button>
      </div>
    </Card>
  );
}

export function useResetReportFilters() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(() => {
    router.replace(pathname);
  }, [router, pathname]);
}
