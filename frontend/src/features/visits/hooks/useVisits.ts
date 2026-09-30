'use client';

import { useCallback, useState } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { visitService } from '../services/visit.service';
import { Visit, VisitListParams } from '../types/visit.types';

export function useVisitList(initialParams: VisitListParams = {}) {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<VisitListParams>({ page: 1, limit: 10, ...initialParams });

  const queryKey = ['visits', params];

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await visitService.list(params);
      if (!res.success) throw new Error('Failed to load visits');
      return {
        visits: res.data || [],
        totalCount: res.pagination?.total || 0,
        pageCount: res.pagination?.totalPages || 1,
      };
    },
    placeholderData: keepPreviousData,
  });

  const updateParams = useCallback((updates: Partial<VisitListParams>) => {
    setParams((prev) => ({ ...prev, ...updates }));
  }, []);

  const patchVisit = useCallback(
    (visitId: string, patch: Partial<Visit>) => {
      queryClient.setQueryData(queryKey, (old: typeof data) => {
        if (!old) return old;
        return {
          ...old,
          visits: old.visits.map((v) => (v._id === visitId ? { ...v, ...patch } : v)),
        };
      });
    },
    [queryClient, queryKey]
  );

  const toggleFavoriteOptimistic = useCallback(
    async (visit: Visit) => {
      const nextFavorite = !visit.isFavorite;
      patchVisit(visit._id, { isFavorite: nextFavorite });
      try {
        await visitService.toggleFavorite(visit._id);
      } catch {
        patchVisit(visit._id, { isFavorite: visit.isFavorite });
        toast.error('Failed to update favorite');
      }
    },
    [patchVisit]
  );

  return {
    visits: data?.visits ?? [],
    totalCount: data?.totalCount ?? 0,
    pageCount: data?.pageCount ?? 1,
    isLoading: isLoading && !data,
    isFetching,
    params,
    updateParams,
    refetch,
    patchVisit,
    toggleFavoriteOptimistic,
  };
}
