import mongoose from 'mongoose';
import { env } from './env';

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000;

export const connectDatabase = async (): Promise<void> => {
  mongoose.set('strictQuery', true);
  const target = new URL(env.DATABASE_URL);
  console.log(`PostgreSQL target: ${target.hostname}:${target.port || '5432'}; Node ${process.version}`);

  mongoose.connection.on('connected', () => {
    console.log('✅ PostgreSQL connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ PostgreSQL connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  PostgreSQL disconnected');
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(env.DATABASE_URL, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      });
      return;
    } catch (error) {
      console.error(`❌ PostgreSQL connection failed (attempt ${attempt}/${MAX_RETRIES}):`, error);

      if (attempt >= MAX_RETRIES) {
        throw error;
      }

      console.log(`🔄 Retrying in ${RETRY_INTERVAL / 1000}s...`);
      await new Promise<void>(resolve => setTimeout(resolve, RETRY_INTERVAL));
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log('🔌 PostgreSQL disconnected');
};
