import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

export const authorize = (...requiredPermissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const { permissions } = req.user;

    if (permissions.includes('*')) {
      return next();
    }

    const hasPermission = requiredPermissions.every((permission) =>
      permissions.includes(permission)
    );

    if (!hasPermission) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

export const authorizeOneOf = (...permissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const { permissions: userPerms } = req.user;

    if (userPerms.includes('*')) {
      return next();
    }

    const hasAny = permissions.some((permission) => userPerms.includes(permission));

    if (!hasAny) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};
