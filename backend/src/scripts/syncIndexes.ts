import mongoose from 'mongoose';
import { RoleModel } from '../models/Role.model';

/** Legacy indexes from older schemas that are no longer in use */
const STALE_INDEXES: { collection: string; index: string }[] = [
  { collection: 'roles', index: 'slug_1' },
  { collection: 'users', index: 'slug_1' },
];

const dropStaleIndexes = async (): Promise<void> => {
  const db = mongoose.connection.db;
  if (!db) return;

  for (const { collection, index } of STALE_INDEXES) {
    try {
      const indexes = await db.collection(collection).indexes();
      const exists = indexes.some((i) => i.name === index);

      if (exists) {
        await db.collection(collection).dropIndex(index);
        console.log(`🧹 Dropped stale index: ${collection}.${index}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('index not found')) {
        console.warn(`⚠️  Could not drop ${collection}.${index}:`, message);
      }
    }
  }
};

/** Migrate legacy role documents that used slug/name instead of roleName */
const migrateLegacyRoles = async (): Promise<void> => {
  const db = mongoose.connection.db;
  if (!db) return;

  const legacyRoles = await db.collection('roles').find({
    $or: [
      { roleName: { $exists: false } },
      { roleName: null },
      { roleName: '' },
    ],
  }).toArray();

  for (const role of legacyRoles) {
    const doc = role as Record<string, unknown>;
    const roleName =
      (doc.roleName as string) ||
      (doc.slug as string) ||
      (doc.name as string) ||
      'legacy_role';

    await RoleModel.findByIdAndUpdate(doc._id, {
      roleName: String(roleName).trim().toLowerCase().replace(/\s+/g, '_'),
      permissions: Array.isArray(doc.permissions) ? doc.permissions : [],
      status: doc.status === 'inactive' ? 'inactive' : 'active',
      isSystem: Boolean(doc.isSystem),
    });

    console.log(`🔄 Migrated legacy role → ${roleName}`);
  }
};

export const syncIndexes = async (): Promise<void> => {
  await dropStaleIndexes();
  await migrateLegacyRoles();
};
