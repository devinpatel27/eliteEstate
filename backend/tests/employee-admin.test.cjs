const assert=require('node:assert/strict');
process.env.DATABASE_URL ||= 'postgresql://unused/test';
const {employeeService}=require('../dist/features/employees/employee.service');
const {employeeRepository:repo}=require('../dist/features/employees/employee.repository');
const {RoleModel}=require('../dist/models/Role.model');
const {UserModel}=require('../dist/models/User.model');
const {generateEmployeeId}=require('../dist/utils/employeeId.utils');
const {assertAdminAssignmentAllowed}=require('../dist/features/employees/employee.admin');
const {updateEmployeeSchema}=require('../dist/features/employees/employee.validator');
require('../dist/utils/activityLogger').logActivity=async()=>{};
const master={roleName:'master_admin',permissions:['*'],_id:'master-role'};
const normal={roleName:'employee',permissions:[],_id:'employee-role'};
let record={_id:'admin-user',role:master};let writes=0;
repo.findById=async()=>record;
repo.findByEmail=async()=>null;
repo.create=async data=>{writes++;return {...data,_id:'new-admin'};};
repo.delete=async()=>{writes++;};
RoleModel.findById=async id=>id==='master-role'?master:normal;
RoleModel.find=()=>({select:async()=>[master]});
UserModel.find=()=>({select:async()=>[{employeeId:'ELITE000'},{employeeId:'EMP009'},{employeeId:'EMP003'},{employeeId:'EMPNaN'}]});
UserModel.countDocuments=async()=>3;
(async()=>{
 assert.equal(await generateEmployeeId(),'EMP010');
 await employeeService.createEmployee({name:'Other Admin',email:'other@example.test',password:'TestPassword123',role:'master-role',status:'active'},'admin-user');
 assert.equal(writes,1,'Master Admin creation must bypass the employee cap');
 await assert.rejects(()=>employeeService.createEmployee({name:'Employee',email:'employee@example.test',password:'TestPassword123',role:'employee-role',status:'active'},'admin-user'),/limit/);
 for(const role of [master,{roleName:'admin'},{roleName:'custom',permissions:['*']}]){
  record={_id:'protected-admin',role};
  await assert.rejects(()=>employeeService.deleteEmployee('protected-admin','other-user'),/cannot be deleted/);
 }
 assert.equal(writes,1,'Protected delete must perform no writes');
 record={_id:'regular-user',role:normal};
 await assert.rejects(()=>assertAdminAssignmentAllowed(master,'regular-user'),/Only an admin/);
 assert.equal(updateEmployeeSchema.safeParse({body:{joiningDate:'invalid-date'},params:{id:'user'}}).success,false);
 assert.equal(updateEmployeeSchema.safeParse({body:{joiningDate:'2026-10-10'},params:{id:'user'}}).success,true);
 console.log('Passed: additional admin creation, employee cap, admin deletion blocked, non-admin escalation blocked, IDs and date validation');
})().catch(error=>{console.error(error);process.exitCode=1});
