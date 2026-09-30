import { createApp } from './config/app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { syncIndexes } from './scripts/syncIndexes';
import { seedAdmin } from './scripts/seedAdmin';
import { seedMasters } from './scripts/seedMasters';

const startServer = async (): Promise<void> => {
  const app = createApp();
  const PORT = Number(process.env.PORT) || env.PORT || 5000;
  const HOST = '0.0.0.0';

  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT} [${env.NODE_ENV}]`);
    console.log(`📡 API: http://${HOST}:${PORT}/api`);
    console.log(`🏥 Health: http://${HOST}:${PORT}/health`);
  });

  // Initialize DB asynchronously so HTTP health check is instantly available
  connectDatabase()
    .then(async () => {
      await syncIndexes();
      await seedAdmin();
      await seedMasters();
      console.log('✅ Database connected and initialized successfully');
    })
    .catch((dbError) => {
      console.error('❌ Database connection or seeding error:', dbError);
    });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
});
