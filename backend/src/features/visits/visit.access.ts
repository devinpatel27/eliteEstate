import { JwtPayload } from '../../types/api.types';
import { ILead } from '../../models/Lead.model';
import { PERMISSIONS } from '../../constants/permissions';
import { resolveRefId } from '../../utils/objectId.utils';

export const hasVisitPermission = (
  permissions: string[],
  permission: string
): boolean => permissions.includes('*') || permissions.includes(permission);

export const canReadAllVisits = (permissions: string[]): boolean =>
  hasVisitPermission(permissions, PERMISSIONS.WILDCARD) ||
  hasVisitPermission(permissions, PERMISSIONS.VISIT_READ);

export const requiresAssignedVisitScope = (permissions: string[]): boolean =>
  !canReadAllVisits(permissions);

export const canAccessVisitForLead = (user: JwtPayload, lead: ILead): boolean => {
  if (canReadAllVisits(user.permissions)) return true;
  const canReadAssigned = hasVisitPermission(user.permissions, PERMISSIONS.VISIT_READ_ASSIGNED);
  return canReadAssigned && resolveRefId(lead.assignedTo) === user.userId && !lead.deletedAt;
};
