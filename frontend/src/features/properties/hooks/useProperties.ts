'use client';

import { useCallback, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { propertyService } from '../services/property.service';
import { Property, PropertyListParams } from '../types/property.types';

export function usePropertyList(initialParams: PropertyListParams = {}) {
  const [params, setParams] = useState<PropertyListParams>({
    page: 1,
    limit: 10,
    search: '',
    ...initialParams,
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['properties', params],
    queryFn: async () => {
      const res = await propertyService.list({
        page: params.page,
        limit: params.limit,
        search: params.search || undefined,
        purpose: (params.purpose as Property['purpose']) || undefined,
        status: (params.status as Property['status']) || undefined,
      });
      if (!res.success) throw new Error('Failed to load properties');
      return {
        properties: res.data || [],
        totalCount: res.pagination?.total || 0,
        pageCount: res.pagination?.totalPages || 1,
      };
    },
    placeholderData: keepPreviousData,
  });

  const updateParams = useCallback((updates: Partial<PropertyListParams>) => {
    setParams((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    properties: data?.properties ?? [],
    totalCount: data?.totalCount ?? 0,
    pageCount: data?.pageCount ?? 1,
    isLoading: isLoading && !data,
    isFetching,
    params,
    updateParams,
    refetch,
  };
}

export function usePropertyDashboardStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['properties-dashboard'],
    queryFn: async () => {
      const res = await propertyService.getDashboard();
      if (!res.success) throw new Error('Failed to load property stats');
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  return { stats: data, isLoading: isLoading && !data };
}
