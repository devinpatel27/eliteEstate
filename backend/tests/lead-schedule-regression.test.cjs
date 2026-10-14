const assert = require('node:assert/strict');
process.env.DATABASE_URL ||= 'postgresql://unused/test';
const {leadRepository, buildFollowUpDueClause} = require('../dist/features/leads/lead.repository');
const {buildFollowUpDateQuery, buildVisitDateQuery} = require('../dist/features/dashboard/dashboard.service');
const {LeadModel} = require('../dist/models/Lead.model');
const {VisitModel} = require('../dist/models/Visit.model');
const now = new Date('2026-10-14T10:45:00Z');
for (const bucket of ['today','tomorrow','due']) {
  assert.deepEqual(buildFollowUpDateQuery(bucket, now), buildFollowUpDueClause(bucket === 'due' ? 'overdue' : bucket, now));
  assert.equal(buildVisitDateQuery(bucket, now).source.$ne, 'follow_up');
}
const due = buildFollowUpDateQuery('due', now);
assert.ok(new Date('2026-10-21') >= due.nextFollowUpDate.$lt, 'future NFD must not qualify as due');
assert.equal(due.nextFollowUpDate.$ne, null);
let listQuery;
let visitQuery;
LeadModel.find = query => {
  const chain = {select() {return chain;}, sort() {return chain;}, skip() {return chain;}, limit() {return chain;}, async lean() {
    if ('nextFollowUpDate' in query || query.$or) {listQuery = query; return [];}
    return [{_id:'333333333333333333333333'}];
  }};
  return chain;
};
LeadModel.countDocuments = async () => 0;
VisitModel.distinct = async (field, query) => {
  visitQuery = query;
  // Historical follow-up visit is excluded even if its activity date is overdue.
  assert.equal(query.source.$ne, 'follow_up');
  return [];
};
(async () => {
  const result = await leadRepository.findAll({skip:0,limit:20,followUpDue:'overdue'});
  assert.equal(result.total, 0);
  assert.ok(visitQuery);
  assert.equal(listQuery.$or, undefined, 'old follow-up visits must not pull future/unscheduled leads into Due');
  assert.equal(listQuery.nextFollowUpDate.$ne, null);
  console.log('Passed: future NFD + historical visit excluded, unscheduled excluded, dashboard/list date parity, manual appointments preserved');
})().catch(error => {console.error(error);process.exitCode=1;});
