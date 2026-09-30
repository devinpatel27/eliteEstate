import { IRole } from '../models/Role.model';

type RoleLike = Record<string, unknown> & {
  roleName?: string;
  slug?: string;
  name?: string;
  permissions?: unknown;
};

export function normalizeRoleDoc(role: IRole | RoleLike): Record<string, unknown> {
  const doc = typeof (role as IRole).toObject === 'function'
    ? (role as IRole).toObject()
    : { ...role };

  const rawName =
    (doc.roleName as string) ||
    (doc.slug as string) ||
    (doc.name as string) ||
    'unknown';

  return {
    ...doc,
    roleName: String(rawName).trim().toLowerCase().replace(/\s+/g, '_'),
    permissions: Array.isArray(doc.permissions) ? doc.permissions : [],
    status: doc.status === 'inactive' ? 'inactive' : 'active',
    isSystem: Boolean(doc.isSystem),
  };
}
