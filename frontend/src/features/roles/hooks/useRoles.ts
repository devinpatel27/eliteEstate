'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { roleService } from '../services/role.service';
import { Role } from '../types/role.types';

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await roleService.list();
      if (res.success) setRoles(res.data!);
    } catch {
      setError('Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const deleteRole = async (id: string) => {
    try {
      await roleService.delete(id);
      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete role');
    }
  };

  return { roles, isLoading, error, refetch: fetchRoles, deleteRole };
}

export function useRole(id: string) {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    roleService
      .getById(id)
      .then((res) => {
        if (res.success) setRole(res.data!);
      })
      .catch(() => setError('Failed to load role'))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { role, isLoading, error };
}
