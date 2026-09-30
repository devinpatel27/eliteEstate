'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { leadService } from '../services/lead.service';
import { LeadFollowUp, LeadActivity, LeadAssignment } from '../types/lead.types';
import { FollowUpFormValues } from '../schemas/lead.schema';

export function useLeadDetailData(leadId: string) {
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [assignments, setAssignments] = useState<LeadAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!leadId) return;
    setIsLoading(true);
    try {
      const [fu, act, asn] = await Promise.all([
        leadService.getFollowUps(leadId),
        leadService.getActivities(leadId),
        leadService.getAssignments(leadId),
      ]);
      if (fu.success) setFollowUps(fu.data || []);
      if (act.success) setActivities(act.data || []);
      if (asn.success) setAssignments(asn.data || []);
    } catch {
      toast.error('Failed to load lead details');
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addFollowUp = async (data: FollowUpFormValues) => {
    try {
      await leadService.createFollowUp(leadId, data);
      toast.success('Follow-up added');
      await fetchAll();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to add follow-up');
      throw err;
    }
  };

  const addNote = async (text: string) => {
    await leadService.addNote(leadId, text);
    toast.success('Note added');
    await fetchAll();
  };

  return { followUps, activities, assignments, isLoading, refetch: fetchAll, addFollowUp, addNote };
}
