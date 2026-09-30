import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { env } from '../config/env';

const THUMB_WIDTH = 400;
const MEDIUM_WIDTH = 1200;

export const optimizePropertyImage = async (
  filePath: string
): Promise<{ thumbPath: string; mediumPath: string }> => {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  const thumbPath = path.join(dir, `thumb-${base}${ext}`);
  const mediumPath = path.join(dir, `medium-${base}${ext}`);

  await Promise.all([
    sharp(filePath).resize(THUMB_WIDTH, undefined, { withoutEnlargement: true }).toFile(thumbPath),
    sharp(filePath).resize(MEDIUM_WIDTH, undefined, { withoutEnlargement: true }).toFile(mediumPath),
  ]);

  const uploadRoot = path.join(process.cwd(), env.UPLOAD_DIR);
  return {
    thumbPath: path.relative(uploadRoot, thumbPath).replace(/\\/g, '/'),
    mediumPath: path.relative(uploadRoot, mediumPath).replace(/\\/g, '/'),
  };
};

export const toUploadRelativePath = (absolutePath: string): string => {
  const uploadRoot = path.join(process.cwd(), env.UPLOAD_DIR);
  return path.relative(uploadRoot, absolutePath).replace(/\\/g, '/');
};

export const deleteMediaFiles = async (paths: (string | undefined)[]) => {
  for (const rel of paths) {
    if (!rel) continue;
    const full = path.join(process.cwd(), env.UPLOAD_DIR, rel);
    try {
      await fs.unlink(full);
    } catch {
      // ignore missing files
    }
  }
};
