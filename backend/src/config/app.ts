import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './env';
import { errorMiddleware } from '../middleware/error.middleware';
import { authRoutes } from '../features/auth/auth.routes';
import { employeeRoutes } from '../features/employees/employee.routes';
import { roleRoutes } from '../features/roles/role.routes';
import { dashboardRoutes } from '../features/dashboard/dashboard.routes';
import { leadRoutes } from '../features/leads/lead.routes';
import { propertyTypeRoutes, leadSourceRoutes, followUpActivityRoutes } from '../features/masters/master.routes';
import { visitRoutes } from '../features/visits/visit.routes';
import { propertyRoutes } from '../features/properties/property.routes';
import { amenityRoutes } from '../features/amenities/amenity.routes';
import { settingsRoutes } from '../features/settings/settings.routes';
import { publicRoutes } from '../features/public/public.routes';
import { reportRoutes } from '../features/reports/reports.routes';

export const createApp = (): Application => {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  const allowedOrigins = [
    env.FRONTEND_URL,
    env.WEBSITE_URL,
    'http://localhost:3000',
    'http://localhost:3001',
  ]
    .filter(Boolean)
    .map((url) => url.replace(/\/+$/, ''));

  app.use(
    cors({
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.includes(origin.replace(/\/+$/, ''))
        ) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD_DIR)));

  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/roles', roleRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/property-types', propertyTypeRoutes);
  app.use('/api/lead-sources', leadSourceRoutes);
  app.use('/api/follow-up-activities', followUpActivityRoutes);
  app.use('/api/visits', visitRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/property-amenities', amenityRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/reports', reportRoutes);

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      name: 'Elite Estate CRM API',
      status: 'running',
      health: '/health',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use(errorMiddleware);

  return app;
};
