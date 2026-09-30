import { UserModel } from '../models/User.model';
import { RoleModel } from '../models/Role.model';
import { hashPassword, comparePassword } from '../utils/bcrypt.utils';
import { env } from '../config/env';
import { EMPLOYEE_LEAD_PERMISSIONS } from '../constants/permissions';
import { dedupeEmployeeRole } from './dedupeRoles';

export const seedAdmin = async (): Promise<void> => {
  try {
    let masterAdminRole = await RoleModel.findOne({ roleName: 'master_admin' });
    if (!masterAdminRole) {
      masterAdminRole = await RoleModel.create({
        roleName: 'master_admin',
        permissions: ['*'],
        description: 'Full system access — all permissions granted',
        status: 'active',
        isSystem: true,
      });
      console.log('✅ master_admin role created');
    }

    await dedupeEmployeeRole();

    let employeeRole = await RoleModel.findOne({ roleName: 'employee', isSystem: true });
    if (!employeeRole) {
      employeeRole = await RoleModel.create({
        roleName: 'employee',
        permissions: EMPLOYEE_LEAD_PERMISSIONS,
        description: 'Standard employee access with assigned lead management',
        status: 'active',
        isSystem: true,
      });
      console.log('✅ employee role created');
    } else {
      const missing = EMPLOYEE_LEAD_PERMISSIONS.filter(
        (p) => !employeeRole!.permissions.includes(p)
      );
      if (missing.length > 0) {
        await RoleModel.findByIdAndUpdate(employeeRole._id, {
          permissions: [...new Set([...employeeRole.permissions, ...missing])],
        });
        console.log(`✅ employee role permissions updated (+${missing.length})`);
      }
    }

    const existingAdmin = await UserModel.findOne({ email: env.ADMIN_EMAIL }).select('+password');

    if (existingAdmin) {
      const passwordMatches = await comparePassword(env.ADMIN_PASSWORD, existingAdmin.password);
      const hashedPassword = passwordMatches ? null : await hashPassword(env.ADMIN_PASSWORD);

      await UserModel.findByIdAndUpdate(existingAdmin._id, {
        ...(hashedPassword && { password: hashedPassword }),
        name: env.ADMIN_NAME,
        status: 'active',
        role: masterAdminRole._id,
        forcePasswordChange: false,
      });

      if (hashedPassword) {
        console.log(`✅ Master admin password synced from .env: ${env.ADMIN_EMAIL}`);
      } else {
        console.log('ℹ️  Master admin verified and updated');
      }

      await UserModel.updateMany({}, { forcePasswordChange: false });

      const demoAdmin = await UserModel.findOne({ email: 'demo@eliteestate.com' });
      if (!demoAdmin) {
        const demoHashed = await hashPassword('Demo@12345');
        await UserModel.create({
          employeeId: 'DEMO000',
          name: 'Elite Estate Demo Admin',
          email: 'demo@eliteestate.com',
          password: demoHashed,
          role: masterAdminRole._id,
          status: 'active',
          forcePasswordChange: false,
          joiningDate: new Date(),
        });
      }
      return;
    }

    const hashedPassword = await hashPassword(env.ADMIN_PASSWORD);

    await UserModel.create({
      employeeId: 'ELITE000',
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL,
      password: hashedPassword,
      role: masterAdminRole._id,
      status: 'active',
      forcePasswordChange: false,
      joiningDate: new Date(),
    });

    console.log(`✅ Master admin seeded: ${env.ADMIN_EMAIL}`);

    const demoAdmin = await UserModel.findOne({ email: 'demo@eliteestate.com' });
    if (!demoAdmin) {
      const demoHashed = await hashPassword('Demo@12345');
      await UserModel.create({
        employeeId: 'DEMO000',
        name: 'Elite Estate Demo Admin',
        email: 'demo@eliteestate.com',
        password: demoHashed,
        role: masterAdminRole._id,
        status: 'active',
        forcePasswordChange: false,
        joiningDate: new Date(),
      });
    }

    await UserModel.updateMany({}, { forcePasswordChange: false });
  } catch (error) {
    console.error('❌ Failed to seed admin:', error);
    throw error;
  }
};

if (require.main === module) {
  import('../config/database').then(async ({ connectDatabase, disconnectDatabase }) => {
    await connectDatabase();
    await seedAdmin();
    await disconnectDatabase();
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
