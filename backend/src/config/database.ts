import mongoose from 'mongoose';
import { env } from './env';

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000;

let retries = 0;

export const connectDatabase = async (): Promise<void> => {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    console.log('✅ PostgreSQL connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ PostgreSQL connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  PostgreSQL disconnected');
  });

  const connect = async () => {
    try {
      await mongoose.connect(env.DATABASE_URL, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      });
      retries = 0;
    } catch (error) {
      retries++;
      console.error(`❌ PostgreSQL connection failed (attempt ${retries}/${MAX_RETRIES}):`, error);

      if (retries >= MAX_RETRIES) {
        console.error('❌ Max retries reached. Exiting...');
        process.exit(1);
      }

      console.log(`🔄 Retrying in ${RETRY_INTERVAL / 1000}s...`);
      setTimeout(connect, RETRY_INTERVAL);
    }
  };

  await connect();
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log('🔌 PostgreSQL disconnected');
};
