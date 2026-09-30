import { JwtPayload } from '../../types/api.types';
import { ILead } from '../../models/Lead.model';
import { PERMISSIONS } from '../../constants/permissions';
import { CLOSED_LEAD_STATUSES } from '../../constants/lead.constants';
import { resolveRefId } from '../../utils/objectId.utils';

export interface LeadAccessScope {
  canView: boolean;
  isAdmin: boolean;
  filterAssignmentId?: string;
  assignedOnly: boolean;
  userId: string;
}

export const hasLeadPermission = (
  permissions: string[],
  permission: string
): boolean => permissions.includes('*') || permissions.includes(permission);

/** Can view every lead in the system (not restricted to assigned leads). */
export const canReadAllLeads = (permissions: string[]): boolean =>
  hasLeadPermission(permissions, PERMISSIONS.WILDCARD) ||
  hasLeadPermission(permissions, PERMISSIONS.LEAD_READ);

export const isLeadAdmin = (permissions: string[]): boolean =>
  canReadAllLeads(permissions) ||
  hasLeadPermission(permissions, PERMISSIONS.LEAD_TIMELINE_FULL);

/** Employees and other assigned-only users — list/detail scoped to their assignments. */
export const requiresAssignedOnlyScope = (permissions: string[]): boolean =>
  !canReadAllLeads(permissions);

export const getLeadAccessScope = (user: JwtPayload, lead: ILead): LeadAccessScope => {
  const canViewAll = canReadAllLeads(user.permissions);
  const userId = user.userId;
  const assignedToId = resolveRefId(lead.assignedTo);

  if (canViewAll) {
    return { canView: true, isAdmin: true, assignedOnly: false, userId };
  }

  const canReadAssigned = hasLeadPermission(user.permissions, PERMISSIONS.LEAD_READ_ASSIGNED);
  const isAssigned = assignedToId === userId;
  const isClosed = (CLOSED_LEAD_STATUSES as readonly string[]).includes(lead.status as string);

  if (!canReadAssigned || !isAssigned || lead.deletedAt || isClosed) {
    return { canView: false, isAdmin: false, assignedOnly: true, userId };
  }

  return {
    canView: true,
    isAdmin: false,
    filterAssignmentId: resolveRefId(lead.currentAssignmentId),
    assignedOnly: true,
    userId,
  };
};

export const canManageLead = (user: JwtPayload, lead: ILead): boolean => {
  const scope = getLeadAccessScope(user, lead);
  if (!scope.canView) return false;
  if (scope.isAdmin) return true;
  return resolveRefId(lead.assignedTo) === user.userId;
};
