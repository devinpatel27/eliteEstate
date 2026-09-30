import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env';

// Some local network setups (notably certain Windows configurations with
// IPv6-only DNS resolvers) fail Node's SRV lookups against MongoDB Atlas
// even though the OS resolver works fine. Prefer public resolvers as a
// fallback to avoid spurious connection failures.
dns.setServers([...dns.getServers(), '8.8.8.8', '1.1.1.1']);

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000;

let retries = 0;

export const connectDatabase = async (): Promise<void> => {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });

  const connect = async () => {
    try {
      const uri = env.MONGODB_URI || env.DATABASE_URL;
      await mongoose.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      });
      retries = 0;
    } catch (error) {
      retries++;
      console.error(`❌ MongoDB connection failed (attempt ${retries}/${MAX_RETRIES}):`, error);

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
  console.log('🔌 MongoDB disconnected');
};
