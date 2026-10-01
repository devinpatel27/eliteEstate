import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || process.env.MONGODB_URI || '';
if (!process.env.DATABASE_URL && dbUrl) {
  process.env.DATABASE_URL = dbUrl;
}
if (!process.env.MONGODB_URI && dbUrl) {
  process.env.MONGODB_URI = dbUrl;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.union([z.string(), z.number()]).default(5000).transform(Number),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL or MONGODB_URI is required'),
  MONGODB_URI: z.string().optional(),
  JWT_SECRET: z.string().default('elite_estate_crm_change_this_secret'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ADMIN_NAME: z.string().default('Elite Estate Admin'),
  ADMIN_EMAIL: z.string().default('admin@eliteestate.com'),
  ADMIN_PASSWORD: z.string().default('Elite@12345'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.union([z.string(), z.number()]).default(5242880).transform(Number),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  WEBSITE_URL: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('⚠️ Environment variable parsing issues:', parsed.error.flatten().fieldErrors);
}

export const env = parsed.success
  ? parsed.data
  : envSchema.parse({ ...process.env, PORT: process.env.PORT || 5000 });
export type Env = typeof env;
