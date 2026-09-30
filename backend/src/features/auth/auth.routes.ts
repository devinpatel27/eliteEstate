import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { loginSchema, changePasswordSchema } from './auth.validator';

export const authRoutes = Router();

authRoutes.post('/login', validate(loginSchema), authController.login);
authRoutes.post('/logout', authenticate, authController.logout);
authRoutes.get('/profile', authenticate, authController.getProfile);
authRoutes.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);
