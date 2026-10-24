const assert = require('node:assert/strict');
process.env.DATABASE_URL ||= 'postgresql://unused/test';
const {LeadFollowUpModel} = require('../dist/models/LeadFollowUp.model');
const {LeadModel} = require('../dist/models/Lead.model');
const {buildFreshLeadFilter} = require('../dist/features/leads/lead.fresh');
const {leadRepository} = require('../dist/features/leads/lead.repository');
const {listLeadsSchema} = require('../dist/features/leads/lead.validator');
const records = [
  {_id:'a',status:'open',assignedTo:'one',deletedAt:null,initialRemark:'Requirement captured on creation'},
  {_id:'b',status:'open',assignedTo:'one',deletedAt:null},
  {_id:'c',status:'closed',assignedTo:'one',deletedAt:null},
  {_id:'d',status:'new',assignedTo:'two',deletedAt:null},
  {_id:'e',status:'open',assignedTo:'one',deletedAt:'2026-10-01'},
];
const followUps = [{leadId:'b',assignmentId:'old assignment'},{leadId:'b',assignmentId:'new assignment'}];
LeadFollowUpModel.distinct = async () => [...new Set(followUps.map(item => item.leadId))];
function matches(row, query) {
  return Object.entries(query).every(([key,value]) => {
    if(key === '$and') return value.every(clause => matches(row,clause));
    if(value?.$in) return value.$in.includes(row[key]);
    if(value?.$nin) return !value.$nin.includes(row[key]);
    return row[key] === value;
  });
}
const freshIds = async base => {const filter = await buildFreshLeadFilter(base);return records.filter(row => matches(row,filter)).map(row => row._id);};
(async () => {
  assert.deepEqual(await freshIds({}),['a','d'],'worked, closed and deleted leads are not fresh; initial remark remains fresh');
  assert.deepEqual(await freshIds({assignedTo:'one'}),['a'],'employee count stays scoped');
  assert.deepEqual(await freshIds({status:'closed'}),[],'fresh filter must not override a conflicting status filter');
  followUps.push({leadId:'a',remark:''});
  assert.deepEqual(await freshIds({}),['d'],'first follow-up immediately removes lead, including empty-remark follow-ups');
  LeadModel.find = () => ({select(){return this},sort(){return this},skip(){return this},limit(){return this},async lean(){return [];}});
  LeadModel.countDocuments = async query => records.filter(row => matches(row,query)).length;
  const list = await leadRepository.findAll({skip:0,limit:25,status:'open',freshOnly:true});
  assert.equal(list.total,1,'list uses the same freshness rule as dashboard');
  assert.ok(listLeadsSchema.safeParse({query:{freshOnly:'true'}}).success);
  assert.ok(!listLeadsSchema.safeParse({query:{freshOnly:'anything'}}).success);
  console.log('Passed: untouched vs worked leads, creation remarks, empty follow-ups, reassignment history, scoped counts and fresh-list parity');
})().catch(error=>{console.error(error);process.exitCode=1;});
