'use client';

import { useCallback, useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leadService } from '../services/lead.service';
import { Lead, LeadListParams } from '../types/lead.types';
import { useAuthStore } from '@/stores/auth.store';
import { PERMISSIONS } from '@/lib/constants';

function canReadAllLeads(permissions: string[]): boolean {
  return permissions.includes(PERMISSIONS.WILDCARD) || permissions.includes(PERMISSIONS.LEAD_READ);
}

export function useLeadList(initialParams: LeadListParams = {}) {
  const user = useAuthStore((s) => s.user);
  const [params, setParams] = useState<LeadListParams>({ page: 1, limit: 10, ...initialParams });

  const assignedOnly = useMemo(
    () => Boolean(user && !canReadAllLeads(user.permissions ?? [])),
    [user]
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['leads', params, assignedOnly, user?._id],
    queryFn: async () => {
      const res = await leadService.list(params);
      if (!res.success) throw new Error('Failed to load leads');
      let leads = res.data || [];
      if (assignedOnly && user?._id) {
        leads = leads.filter((lead) => lead.assignedTo?._id === user._id);
      }
      return {
        leads,
        totalCount: res.pagination?.total || 0,
        pageCount: res.pagination?.totalPages || 1,
      };
    },
    placeholderData: keepPreviousData,
  });

  const updateParams = useCallback((updates: Partial<LeadListParams>) => {
    setParams((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    leads: data?.leads ?? [],
    totalCount: data?.totalCount ?? 0,
    pageCount: data?.pageCount ?? 1,
    isLoading: isLoading && !data,
    isFetching,
    params,
    updateParams,
    refetch,
  };
}

export function useLead(id: string) {
  const { data: lead, isLoading, error, refetch } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const res = await leadService.getById(id);
      if (!res.success || !res.data) throw new Error('Failed to load lead');
      return res.data;
    },
    enabled: !!id,
  });

  return { lead: lead ?? null, isLoading, error: error ? 'Failed to load lead' : null, refetch };
}

export function useLeadActions() {
  const [isLoading, setIsLoading] = useState(false);

  const deleteLead = async (id: string) => {
    setIsLoading(true);
    try {
      await leadService.delete(id);
      toast.success('Lead deleted successfully');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to delete lead');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, remark?: string) => {
    setIsLoading(true);
    try {
      await leadService.updateStatus(id, { status, remark });
      toast.success('Status updated successfully');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to update status');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const transferLead = async (id: string, assignedTo: string, transferRemark: string) => {
    setIsLoading(true);
    try {
      await leadService.transfer(id, { assignedTo, transferRemark });
      toast.success('Lead transferred successfully');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to transfer lead');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteLead, updateStatus, transferLead, isLoading };
}
