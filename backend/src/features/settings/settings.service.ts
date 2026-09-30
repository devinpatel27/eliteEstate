import { settingsRepository } from './settings.repository';

export const settingsService = {
  getLeadAssignment: () => settingsRepository.getLeadAssignment(),

  updateLeadAssignment: (data: {
    mode: 'manual' | 'round_robin';
    roundRobinEmployeeIds?: string[];
  }) => settingsRepository.updateLeadAssignment(data),
};
