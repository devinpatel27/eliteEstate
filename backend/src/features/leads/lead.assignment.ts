import { UserModel } from '../../models/User.model';
import { AppError } from '../../middleware/error.middleware';
import { isValidObjectId } from '../../utils/objectId.utils';

export async function assertValidAssignee(id: string) {
  if (!isValidObjectId(id)) throw new AppError('Invalid employee', 400);
  const employee = await UserModel.findById(id).populate('role', 'roleName');
  if (!employee || employee.status !== 'active' || (employee.role as unknown as { roleName: string })?.roleName === 'master_admin') {
    throw new AppError('Select an active employee', 400);
  }
}
