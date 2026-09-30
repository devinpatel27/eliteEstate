'use client';

import { useCallback, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { employeeService } from '../services/employee.service';
import { Employee, EmployeeListParams } from '../types/employee.types';

export function useEmployeeList(initialParams: EmployeeListParams = {}) {
  const [params, setParams] = useState<EmployeeListParams>({
    page: 1,
    limit: 10,
    ...initialParams,
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['employees', params],
    queryFn: async () => {
      const res = await employeeService.list(params);
      if (!res.success) throw new Error('Failed to load employees');
      return {
        employees: res.data,
        totalCount: res.pagination.total,
        pageCount: res.pagination.totalPages,
      };
    },
    placeholderData: keepPreviousData,
  });

  const updateParams = useCallback((updates: Partial<EmployeeListParams>) => {
    setParams((prev) => ({ ...prev, ...updates, page: updates.page ?? 1 }));
  }, []);

  return {
    employees: data?.employees ?? [],
    totalCount: data?.totalCount ?? 0,
    pageCount: data?.pageCount ?? 1,
    isLoading: isLoading && !data,
    isFetching,
    params,
    updateParams,
    refetch,
  };
}

export function useEmployee(id: string) {
  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await employeeService.getById(id);
      if (!res.success || !res.data) throw new Error('Failed to load employee');
      return res.data;
    },
    enabled: !!id,
  });

  return { employee: employee ?? null, isLoading, error: error ? 'Failed to load employee' : null };
}

export function useEmployeeActions() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const deleteEmployee = async (id: string, onSuccess?: () => void) => {
    setIsLoading(true);
    try {
      await employeeService.delete(id);
      toast.success('Employee deleted successfully');
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to delete employee');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (
    id: string,
    status: 'active' | 'inactive',
    onSuccess?: () => void
  ) => {
    setIsLoading(true);
    try {
      await employeeService.updateStatus(id, status);
      toast.success(`Employee ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (
    id: string,
    newPassword: string,
    onSuccess?: () => void
  ) => {
    setIsLoading(true);
    try {
      await employeeService.resetPassword(id, newPassword);
      toast.success('Password reset successfully');
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteEmployee, toggleStatus, resetPassword, isLoading };
}
