import { Types } from 'mongoose';
import { RoleModel } from '../models/Role.model';
import { UserModel } from '../models/User.model';
import { EMPLOYEE_LEAD_PERMISSIONS } from '../constants/permissions';

function normalizeRoleName(value?: string | null): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Ensures a single canonical `employee` system role exists.
 * Reassigns users from duplicates and deletes extra role documents.
 */
export const dedupeEmployeeRole = async (): Promise<void> => {
  const allRoles = await RoleModel.find({}).sort({ isSystem: -1, createdAt: 1 }).lean();

  const employeeRoles = allRoles.filter((role) => {
    const name = normalizeRoleName(role.roleName);
    const legacySlug = normalizeRoleName((role as { slug?: string }).slug);
    const legacyName = normalizeRoleName((role as { name?: string }).name);
    return name === 'employee' || legacySlug === 'employee' || legacyName === 'employee';
  });

  if (employeeRoles.length === 0) return;

  const canonical =
    employeeRoles.find((role) => role.isSystem) ||
    employeeRoles.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

  const canonicalId = canonical._id as Types.ObjectId;
  const duplicates = employeeRoles.filter((role) => String(role._id) !== String(canonicalId));

  if (duplicates.length > 0) {
    const duplicateIds = duplicates.map((role) => role._id);
    const reassigned = await UserModel.updateMany(
      { role: { $in: duplicateIds } },
      { $set: { role: canonicalId } }
    );
    await RoleModel.deleteMany({ _id: { $in: duplicateIds } });
    console.log(
      `✅ Deduped employee role: kept ${canonicalId}, removed ${duplicates.length} duplicate(s), reassigned ${reassigned.modifiedCount} user(s)`
    );
    await RoleModel.findByIdAndUpdate(canonicalId, {
      roleName: 'employee',
      isSystem: true,
      status: 'active',
      description: 'Standard employee access with assigned lead management',
      permissions: EMPLOYEE_LEAD_PERMISSIONS,
    });
    return;
  }

  const currentPerms = (canonical.permissions as string[]) || [];
  const missing = EMPLOYEE_LEAD_PERMISSIONS.filter((p) => !currentPerms.includes(p));
  const update: Record<string, unknown> = {
    roleName: 'employee',
    isSystem: true,
    status: 'active',
    description: 'Standard employee access with assigned lead management',
  };
  if (missing.length > 0) {
    update.permissions = [...currentPerms, ...missing];
  }

  await RoleModel.findByIdAndUpdate(canonicalId, update);
};
