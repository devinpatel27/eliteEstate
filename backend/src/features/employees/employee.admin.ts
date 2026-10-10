import { RoleModel } from '../../models/Role.model';
import { employeeRepository } from './employee.repository';
import { AppError } from '../../middleware/error.middleware';

export const isAdminRole = (role: { roleName?: string; permissions?: string[] } | null | undefined) =>
  role?.roleName === 'master_admin' || role?.roleName === 'admin' || role?.permissions?.includes('*') === true;

export async function resolveEmployeeRole(role: unknown) {
  if (role && typeof role === 'object' && 'roleName' in role) return role as { roleName: string; permissions?: string[] };
  return RoleModel.findById(String(role));
}

export async function assertAdminAssignmentAllowed(role: { roleName: string; permissions?: string[] }, actorId: string) {
  if (!isAdminRole(role)) return;
  const actor = await employeeRepository.findById(actorId);
  if (!actor || !isAdminRole(await resolveEmployeeRole(actor.role))) throw new AppError('Only an admin can create or assign another admin', 403);
}
