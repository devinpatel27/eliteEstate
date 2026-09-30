import { ActivityLogModel } from '../models/ActivityLog.model';

interface LogActivityParams {
  userId: string;
  action: string;
  module: string;
  description?: string;
  ipAddress?: string;
}

export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    await ActivityLogModel.create({
      user: params.userId,
      action: params.action,
      module: params.module,
      description: params.description,
      ipAddress: params.ipAddress,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
