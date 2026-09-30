import { Types } from 'mongoose';
import { SystemSettingsModel } from '../../models/SystemSettings.model';
import { isValidObjectId } from '../../utils/objectId.utils';

export const settingsRepository = {
  getLeadAssignment: async () => {
    const settings = await SystemSettingsModel.findOne({ key: 'default' }).lean();
    return (
      settings?.leadAssignment ?? {
        mode: 'manual' as const,
        roundRobinEmployeeIds: [],
        lastAssignedIndex: 0,
      }
    );
  },

  updateLeadAssignment: async (data: {
    mode: 'manual' | 'round_robin';
    roundRobinEmployeeIds?: string[];
  }) => {
    const employeeIds =
      data.roundRobinEmployeeIds?.filter(isValidObjectId).map((id) => new Types.ObjectId(id)) ?? [];

    return SystemSettingsModel.findOneAndUpdate(
      { key: 'default' },
      {
        $set: {
          leadAssignment: {
            mode: data.mode,
            roundRobinEmployeeIds: employeeIds,
            lastAssignedIndex: 0,
          },
        },
      },
      { upsert: true, new: true }
    ).lean();
  },
};
