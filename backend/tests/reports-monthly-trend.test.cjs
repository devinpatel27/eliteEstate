const assert = require('node:assert/strict');
process.env.DATABASE_URL ||= 'postgresql://unused/test';
const {LeadModel} = require('../dist/models/Lead.model');
const {VisitModel} = require('../dist/models/Visit.model');
const {LeadSourceModel} = require('../dist/models/LeadSource.model');
const {LeadFollowUpModel} = require('../dist/models/LeadFollowUp.model');
const {reportsService} = require('../dist/features/reports/reports.service');
const {buildMonthlyTrend} = require('../dist/features/reports/reports.trend');
const {getLast12Months} = require('../dist/features/reports/reports.filters');
const months = getLast12Months();
const latest = months[months.length-1];
const prefix = `${latest.year}-${String(latest.month).padStart(2,'0')}`;
const employee = '111111111111111111111111';
const other = '222222222222222222222222';
const records = [
  {assignedTo:employee,deletedAt:null,createdAt:`${prefix}-15T12:00:00Z`,scheduledDate:`${prefix}-15T12:00:00Z`},
  {assignedTo:employee,deletedAt:null,createdAt:`${prefix}-17T12:00:00Z`,scheduledDate:`${prefix}-17T12:00:00Z`},
  {assignedTo:employee,deletedAt:null,createdAt:`${prefix}-05T12:00:00Z`,scheduledDate:`${prefix}-05T12:00:00Z`},
  {assignedTo:other,deletedAt:null,createdAt:`${prefix}-15T12:00:00Z`,scheduledDate:`${prefix}-15T12:00:00Z`},
];
function matches(row,query) {
  return Object.entries(query).every(([key,value])=>{
    if(key==='$and') return value.every(clause=>matches(row,clause));
    if(value && value.$gte && !(new Date(row[key]) >= value.$gte)) return false;
    if(value && value.$lte && !(new Date(row[key]) <= value.$lte)) return false;
    if(value && (value.$gte || value.$lte)) return true;
    return String(row[key])===String(value);
  });
}
function rows(data) {return {select(){return this;},async lean(){return data;}};}
LeadModel.countDocuments = VisitModel.countDocuments = async()=>0;
LeadSourceModel.find = ()=>rows([]);
LeadFollowUpModel.distinct = async()=>[];
LeadModel.find = query=>rows(records.filter(row=>matches(row,query)));
VisitModel.find = query=>rows(records.filter(row=>matches(row,query)));
LeadModel.aggregate = VisitModel.aggregate = ()=>{throw new Error('Unsupported aggregation must not be used');};
(async()=>{
  assert.equal(buildMonthlyTrend([]).length,12);
  assert.ok(buildMonthlyTrend([null,undefined,'invalid date',0]).every(row=>row.count===0));
  const user={userId:employee,permissions:['*']};
  const query={dateFrom:`${prefix}-10`,dateTo:`${prefix}-20`,employeeId:employee};
  const leads=await reportsService.getLeads(user,query);
  assert.equal(leads.monthlyTrend.length,12);
  assert.equal(leads.monthlyTrend.at(-1).count,2,'date and employee filters remain applied');
  assert.equal(leads.monthlyTrend.reduce((sum,row)=>sum+row.count,0),2);
  const visits=await reportsService.getVisits(user,{dateFrom:query.dateFrom,dateTo:query.dateTo});
  assert.equal(visits.monthlyTrend.at(-1).count,3,'visit dates use the same safe month grouping');
  const template=[{year:2025,month:12,label:'Dec 2025'},{year:2026,month:1,label:'Jan 2026'}];
  assert.deepEqual(buildMonthlyTrend(['2025-12-31T23:59:59Z','2026-01-01T00:00:00Z','2026-01-02T00:00:00Z'],template).map(row=>row.count),[1,2]);
  console.log('Passed: leads/visits reports without unsupported aggregation, 12 zero-filled months, invalid dates, year boundaries and scoped date filters');
})().catch(error=>{console.error(error);process.exitCode=1;});
