'use client';

import { useEffect, useMemo } from 'react';
import { UserSearch, Calendar, CalendarClock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { TaskCardsSection } from './TaskCardsSection';
import { useDashboardOverview, useEmployeePerformance } from '../hooks/useDashboardOverview';
import { EmployeePerformanceRow } from '../types/dashboard.types';
import { getImageUrl, getInitials } from '@/lib/utils';

interface EmployeeDashboardSelectorProps {
  selectedEmployeeId: string | null;
  onSelectEmployee: (employeeId: string | null) => void;
}

function sortEmployeesByWorkload(employees: EmployeePerformanceRow[]) {
  return [...employees].sort((a, b) => {
    const todayA = a.schedule.visitsToday + a.schedule.followUpsToday;
    const todayB = b.schedule.visitsToday + b.schedule.followUpsToday;
    if (todayB !== todayA) return todayB - todayA;

    const dueA = a.schedule.visitsDue + a.schedule.followUpsDue;
    const dueB = b.schedule.visitsDue + b.schedule.followUpsDue;
    if (dueB !== dueA) return dueB - dueA;

    return a.name.localeCompare(b.name);
  });
}

function pickDefaultEmployee(employees: EmployeePerformanceRow[]): string | null {
  if (employees.length === 0) return null;

  const withToday = employees.find(
    (e) => e.schedule.visitsToday + e.schedule.followUpsToday > 0
  );
  if (withToday) return withToday._id;

  const withDue = employees.find(
    (e) => e.schedule.visitsDue + e.schedule.followUpsDue > 0
  );
  if (withDue) return withDue._id;

  return employees[0]._id;
}

export function EmployeeDashboardSelector({
  selectedEmployeeId,
  onSelectEmployee,
}: EmployeeDashboardSelectorProps) {
  const { data: performance, isLoading: perfLoading } = useEmployeePerformance();
  const { data: overview, isLoading: overviewLoading } = useDashboardOverview(
    selectedEmployeeId || undefined,
    Boolean(selectedEmployeeId)
  );

  const sortedEmployees = useMemo(
    () => sortEmployeesByWorkload(performance?.employees || []),
    [performance]
  );

  const selectedEmployee = sortedEmployees.find((e) => e._id === selectedEmployeeId);

  const employeeOptions = useMemo(
    () =>
      sortedEmployees.map((emp) => {
        const today = emp.schedule.visitsToday + emp.schedule.followUpsToday;
        const due = emp.schedule.visitsDue + emp.schedule.followUpsDue;
        const tomorrow = emp.schedule.visitsTomorrow;
        const suffix =
          today > 0
            ? ` · ${today} today`
            : tomorrow > 0
              ? ` · ${tomorrow} visit${tomorrow !== 1 ? 's' : ''} tomorrow`
              : due > 0
                ? ` · ${due} due`
                : '';
        return {
          value: emp._id,
          label: `${emp.name}${suffix}`,
        };
      }),
    [sortedEmployees]
  );

  useEffect(() => {
    if (perfLoading || selectedEmployeeId || sortedEmployees.length === 0) return;
    const defaultId = pickDefaultEmployee(sortedEmployees);
    if (defaultId) onSelectEmployee(defaultId);
  }, [perfLoading, selectedEmployeeId, sortedEmployees, onSelectEmployee]);

  if (perfLoading) {
    return <Card className="crm-card p-6"><Skeleton className="h-12 w-full" /></Card>;
  }

  return (
    <Card id="employee-workboard" className="crm-card overflow-hidden transition-shadow duration-200">
      <div className="border-b bg-muted/15 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <UserSearch className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Employee Workboard</h2>
              <p className="text-sm text-muted-foreground">
                Today&apos;s visits and follow-ups — pick an employee below
              </p>
            </div>
          </div>
          <SearchableSelect
            value={selectedEmployeeId || undefined}
            onValueChange={(value) => onSelectEmployee(value || null)}
            options={employeeOptions}
            placeholder="Search employee…"
            searchPlaceholder="Type name or ID…"
            className="w-full lg:w-[320px]"
            emptyText="No employees found."
          />
        </div>

        {selectedEmployee && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-muted/30 px-3 py-2.5">
            <Avatar className="h-8 w-8">
              <AvatarImage src={getImageUrl(selectedEmployee.profileImage)} />
              <AvatarFallback className="text-xs">{getInitials(selectedEmployee.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{selectedEmployee.name}</p>
              <p className="text-xs text-muted-foreground">{selectedEmployee.role} · {selectedEmployee.employeeId}</p>
            </div>
            {selectedEmployee.schedule.visitsToday + selectedEmployee.schedule.followUpsToday > 0 && (
              <Badge className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100">
                <Calendar className="h-3 w-3" />
                {selectedEmployee.schedule.visitsToday + selectedEmployee.schedule.followUpsToday} today
              </Badge>
            )}
            {selectedEmployee.schedule.visitsTomorrow > 0 && (
              <Badge className="gap-1 bg-violet-100 text-violet-700 hover:bg-violet-100">
                <CalendarClock className="h-3 w-3" />
                {selectedEmployee.schedule.visitsTomorrow} visits tomorrow
              </Badge>
            )}
            {selectedEmployee.schedule.followUpsTomorrow > 0 && (
              <Badge variant="secondary">
                {selectedEmployee.schedule.followUpsTomorrow} follow-ups tomorrow
              </Badge>
            )}
            {selectedEmployee.schedule.visitsDue + selectedEmployee.schedule.followUpsDue > 0 && (
              <Badge variant="destructive" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                {selectedEmployee.schedule.visitsDue + selectedEmployee.schedule.followUpsDue} due
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {!selectedEmployeeId ? (
          <div className="rounded-lg border border-dashed bg-muted/15 px-6 py-10 text-center">
            <UserSearch className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
            <p className="font-medium">Select an employee to load their workboard</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Employees with tasks today appear first in the list
            </p>
          </div>
        ) : overviewLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : overview ? (
          <TaskCardsSection overview={overview} showSearch embedded tabbed />
        ) : (
          <p className="text-sm text-muted-foreground">Unable to load employee workboard.</p>
        )}
      </div>
    </Card>
  );
}
