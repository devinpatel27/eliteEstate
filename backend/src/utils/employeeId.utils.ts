import { UserModel } from '../models/User.model';

export const generateEmployeeId = async (): Promise<string> => {
  const employees = await UserModel.find({ employeeId: { $regex: /^EMP\d+$/ } }).select('employeeId');
  const lastNumber = employees.reduce((max, user) => Math.max(max, Number(/^EMP(\d+)$/.exec(user.employeeId)?.[1] || 0)), 0);
  const nextNumber = lastNumber + 1;
  return `EMP${String(nextNumber).padStart(3, '0')}`;
};
