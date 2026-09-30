import { UserModel } from '../models/User.model';

export const generateEmployeeId = async (): Promise<string> => {
  const lastEmployee = await UserModel.findOne(
    { employeeId: { $exists: true, $ne: 'EMP000' } },
    { employeeId: 1 },
    { sort: { createdAt: -1 } }
  );

  if (!lastEmployee?.employeeId || lastEmployee.employeeId === 'EMP000') {
    const count = await UserModel.countDocuments({ employeeId: { $ne: 'EMP000' } });
    return `EMP${String(count + 1).padStart(3, '0')}`;
  }

  const lastNumber = parseInt(lastEmployee.employeeId.replace('EMP', ''), 10);
  const nextNumber = lastNumber + 1;
  return `EMP${String(nextNumber).padStart(3, '0')}`;
};
