const assert = require('node:assert/strict');
process.env.DATABASE_URL ||= 'postgresql://unused/test';
const {LeadModel} = require('../dist/models/Lead.model');
const {VisitModel} = require('../dist/models/Visit.model');
const {VisitFavoriteModel} = require('../dist/models/VisitFavorite.model');
const {LeadFollowUpModel} = require('../dist/models/LeadFollowUp.model');
const {visitRepository} = require('../dist/features/visits/visit.repository');
const {leadRepository} = require('../dist/features/leads/lead.repository');
const {leadService} = require('../dist/features/leads/lead.service');
const {createLeadSchema, listLeadsSchema} = require('../dist/features/leads/lead.validator');
const a = '111111111111111111111111', b = '222222222222222222222222';
const chain = rows => ({select(){return this},populate(){return this},sort(){return this},async lean(){return rows}});
const visits = [
  {_id:'333333333333333333333333',leadId:a,status:'scheduled',remark:'Newest visit discussion',createdAt:'2026-10-21'},
  {_id:'444444444444444444444444',leadId:b,status:'scheduled',remark:'Other lead',createdAt:'2026-10-20'},
  {_id:'555555555555555555555555',leadId:a,status:'scheduled',remark:'Old discussion',createdAt:'2026-10-10'},
];
const leads = [{_id:a,status:'closed',mobile:'9876543210'},{_id:b,status:'open',mobile:'8765432109'}];
function matches(row, query) {
  return Object.entries(query).every(([key,value]) => {
    if (key === '$and') return value.every(clause => matches(row,clause));
    if (key === '$or') return value.some(clause => matches(row,clause));
    if (value && value.$in) return value.$in.map(String).includes(String(row[key]));
    if (value && value.$nin) return !value.$nin.map(String).includes(String(row[key]));
    return String(row[key]) === String(value);
  });
}
VisitModel.find = query => chain(visits.filter(row => matches(row,query)));
VisitModel.distinct = async (key, query) => [...new Set(visits.filter(row => matches(row,query)).map(row => row[key]))];
LeadModel.find = query => chain(leads.filter(row => matches(row,query)));
LeadModel.distinct = async (key,query) => leads.filter(row => matches(row,query)).map(row => row[key]);
VisitFavoriteModel.find = () => chain([{visitId:visits[2]._id}]);
(async () => {
  const first = await visitRepository.findAll({skip:0,limit:1,userId:b});
  assert.equal(first.total,2,'pagination counts customers, not remarks');
  assert.equal(first.data.length,2,'one customer includes all their visit rows');
  assert.ok(first.data.every(row => row.status === 'closed'),'closing lead closes every visit entry');
  assert.ok(first.data.every(row => row.isFavorite),'old-row favourite appears on whole entry');
  const second = await visitRepository.findAll({skip:1,limit:1});
  assert.equal(String(second.data[0].leadId),b);
  const favourites = await visitRepository.findAll({skip:0,limit:25,userId:b,favorite:true});
  assert.equal(favourites.total,1);
  const closed = await visitRepository.findAll({skip:0,limit:25,status:'closed'});
  assert.equal(closed.total,1);
  assert.equal(closed.data.length,2);
  let lookup;
  LeadModel.findOne = query => {lookup=query;return {lean:async()=>null};};
  await leadRepository.findActiveByMobile('9876543210');
  assert.deepEqual(lookup.$or,[{mobile:'9876543210'},{alternateMobile:'9876543210'},{alternateMobiles:'9876543210'}]);
  const originalLookup = leadRepository.findActiveByMobile;
  leadRepository.findActiveByMobile = async number => number === '8765432109' ? {_id:a} : null;
  await assert.rejects(() => leadService.create({mobile:'9876543210',alternateMobiles:['8765432109']},b), /Lead already exists/);
  await assert.rejects(() => leadService.create({mobile:'9876543210',alternateMobiles:['9876543210']},b), /different number/);
  leadRepository.findActiveByMobile = originalLookup;
  let activityQuery;
  LeadFollowUpModel.distinct = async (key,query) => {activityQuery=query;return [];};
  LeadModel.find = () => ({...chain([]),skip(){return this},limit(){return this}});
  LeadModel.countDocuments = async () => 0;
  await leadRepository.findAll({skip:0,limit:25,parentActivity:a,childActivity:b});
  assert.equal(String(activityQuery.parentActivity),a);
  assert.equal(String(activityQuery.childActivity),b);
  assert.ok(listLeadsSchema.safeParse({query:{parentActivity:a,childActivity:b}}).success);
  const valid = {customerName:'Test',mobile:'9876543210',propertyType:a,leadSource:b,category:'buy_property'};
  assert.ok(createLeadSchema.safeParse({body:{...valid,alternateMobiles:['8765432109','7654321098']}}).success);
  assert.ok(!createLeadSchema.safeParse({body:{...valid,alternateMobiles:['123']}}).success);
  console.log('Passed: grouped pagination, live closed status, entry favourites, all-contact duplicate checks, paired activity filters and alternate validation');
})().catch(error => {console.error(error);process.exitCode=1;});
