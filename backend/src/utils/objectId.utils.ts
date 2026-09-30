import { Types } from 'mongoose';

/** Resolves a Mongo ref that may be an ObjectId, string, or populated `{ _id }` document. */
export const resolveRefId = (value: unknown): string | undefined => {
  if (value == null) return undefined;

  if (typeof value === 'string') {
    return isValidObjectId(value) ? value : undefined;
  }

  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === 'object' && '_id' in value) {
    const nested = (value as { _id: unknown })._id;
    if (nested instanceof Types.ObjectId) return nested.toString();
    if (typeof nested === 'string' && isValidObjectId(nested)) return nested;
  }

  const asString = String(value);
  return isValidObjectId(asString) ? asString : undefined;
};

export const isValidObjectId = (value: unknown): value is string => {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) return false;
  return String(new Types.ObjectId(value)) === value;
};

export const toObjectId = (value: string): Types.ObjectId | null => {
  if (!isValidObjectId(value)) return null;
  return new Types.ObjectId(value);
};
