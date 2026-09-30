'use strict';

const crypto = require('crypto');
const { EventEmitter } = require('events');
const { Pool } = require('pg');

let pool;
const models = {};
const schemas = {};
const cache = new Map();
const connection = new EventEmitter();
connection.readyState = 0;

class ObjectId {
  constructor(value) {
    const raw = value instanceof ObjectId ? value.value : value;
    this.value = raw ? String(raw) : crypto.randomBytes(12).toString('hex');
    if (!ObjectId.isValid(this.value)) throw new Error(`Invalid ObjectId: ${this.value}`);
  }
  static isValid(value) {
    const raw = value instanceof ObjectId ? value.value : String(value || '');
    return /^[a-fA-F0-9]{24}$/.test(raw);
  }
  equals(value) { return String(this) === String(value); }
  toString() { return this.value; }
  valueOf() { return this.value; }
  toJSON() { return this.value; }
}

class Schema {
  constructor(definition = {}, options = {}) {
    this.definition = definition;
    this.options = options;
    this.refs = collectRefs(definition);
  }
  index() { return this; }
}
Schema.Types = { ObjectId, Mixed: Object };

function collectRefs(definition, prefix = '', output = {}) {
  for (const [key, config] of Object.entries(definition || {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(config) && config[0]?.ref) output[path] = { ref: config[0].ref, array: true };
    else if (config?.ref) output[path] = { ref: config.ref, array: false };
    else if (config?.definition) Object.assign(output, collectRefs(config.definition, path, output));
  }
  return output;
}

function revive(value, key = '') {
  if (Array.isArray(value)) return value.map((v) => revive(v));
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && /(?:At|Date)$/.test(key) && !Number.isNaN(Date.parse(value))) return new Date(value);
    return value;
  }
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = revive(v, k);
  return out;
}

function serialize(value) {
  return JSON.parse(JSON.stringify(value, (_key, item) => item instanceof ObjectId ? item.toString() : item));
}

function getPath(source, path) {
  return String(path).split('.').reduce((value, key) => value == null ? undefined : value[key], source);
}

function setPath(source, path, value) {
  const keys = String(path).split('.');
  let target = source;
  keys.slice(0, -1).forEach((key) => { target[key] ||= {}; target = target[key]; });
  target[keys[keys.length - 1]] = value;
}

function unsetPath(source, path) {
  const keys = String(path).split('.');
  let target = source;
  keys.slice(0, -1).forEach((key) => { target = target?.[key]; });
  if (target) delete target[keys[keys.length - 1]];
}

function comparable(value) {
  if (value instanceof ObjectId) return value.toString();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value)) && /^\d{4}-\d{2}-\d{2}T/.test(value)) return Date.parse(value);
  return value;
}

function equals(left, right) {
  if (Array.isArray(left)) return left.some((item) => equals(item, right));
  if (left == null || right == null) return left == right;
  return String(comparable(left)) === String(comparable(right));
}

function matchesValue(actual, expected) {
  if (expected instanceof RegExp) return expected.test(String(actual ?? ''));
  if (!expected || typeof expected !== 'object' || expected instanceof Date || expected instanceof ObjectId) return equals(actual, expected);
  for (const [operator, operand] of Object.entries(expected)) {
    if (operator === '$in' && !operand.some((item) => equals(actual, item))) return false;
    if (operator === '$nin' && operand.some((item) => equals(actual, item))) return false;
    if (operator === '$ne' && equals(actual, operand)) return false;
    if (operator === '$eq' && !equals(actual, operand)) return false;
    if (operator === '$exists' && Boolean(actual !== undefined) !== Boolean(operand)) return false;
    if (operator === '$gte' && !(comparable(actual) >= comparable(operand))) return false;
    if (operator === '$gt' && !(comparable(actual) > comparable(operand))) return false;
    if (operator === '$lte' && !(comparable(actual) <= comparable(operand))) return false;
    if (operator === '$lt' && !(comparable(actual) < comparable(operand))) return false;
    if (operator === '$regex') {
      const regex = operand instanceof RegExp ? operand : new RegExp(String(operand), expected.$options || '');
      if (!regex.test(String(actual ?? ''))) return false;
    }
    if (!operator.startsWith('$') && !matchesValue(actual?.[operator], operand)) return false;
  }
  return true;
}

function matches(doc, filter = {}) {
  for (const [key, expected] of Object.entries(filter || {})) {
    if (key === '$or' && !expected.some((item) => matches(doc, item))) return false;
    else if (key === '$and' && !expected.every((item) => matches(doc, item))) return false;
    else if (key === '$nor' && expected.some((item) => matches(doc, item))) return false;
    else if (!key.startsWith('$') && !matchesValue(getPath(doc, key), expected)) return false;
  }
  return true;
}

function applyUpdate(doc, update = {}, isInsert = false) {
  const hasOperators = Object.keys(update).some((key) => key.startsWith('$'));
  if (!hasOperators) Object.assign(doc, serialize(update));
  for (const [path, value] of Object.entries(update.$set || {})) setPath(doc, path, serialize(value));
  if (isInsert) for (const [path, value] of Object.entries(update.$setOnInsert || {})) setPath(doc, path, serialize(value));
  for (const [path, value] of Object.entries(update.$inc || {})) setPath(doc, path, Number(getPath(doc, path) || 0) + Number(value));
  for (const [path, value] of Object.entries(update.$push || {})) {
    const list = Array.isArray(getPath(doc, path)) ? getPath(doc, path) : [];
    list.push(...(value?.$each || [value]).map(serialize));
    setPath(doc, path, list);
  }
  for (const [path, value] of Object.entries(update.$addToSet || {})) {
    const list = Array.isArray(getPath(doc, path)) ? getPath(doc, path) : [];
    for (const item of value?.$each || [value]) if (!list.some((current) => equals(current, item))) list.push(serialize(item));
    setPath(doc, path, list);
  }
  for (const path of Object.keys(update.$unset || {})) unsetPath(doc, path);
  return doc;
}

function project(doc, projection) {
  if (!projection) return doc;
  const fields = typeof projection === 'string' ? projection.split(/\s+/).filter(Boolean) : Object.keys(projection).filter((key) => projection[key]);
  const excludes = fields.filter((key) => key.startsWith('-')).map((key) => key.slice(1));
  const includes = fields.filter((key) => !key.startsWith('-') && key !== '+password');
  if (includes.length) {
    const out = { _id: doc._id };
    includes.forEach((path) => { const value = getPath(doc, path); if (value !== undefined) setPath(out, path, value); });
    return out;
  }
  const out = { ...doc };
  excludes.forEach((path) => unsetPath(out, path));
  return out;
}

async function all(collection) {
  if (cache.has(collection)) return cache.get(collection).map((item) => revive(serialize(item)));
  const result = await pool.query('SELECT id, data, created_at, updated_at FROM crm_documents WHERE collection = $1', [collection]);
  const documents = result.rows.map((row) => revive({ ...row.data, _id: row.id, createdAt: row.data.createdAt || row.created_at, updatedAt: row.data.updatedAt || row.updated_at }));
  cache.set(collection, documents);
  return documents.map((item) => revive(serialize(item)));
}

async function persist(collection, doc) {
  const raw = serialize(doc);
  const id = String(raw._id || new ObjectId());
  raw._id = id;
  raw.createdAt ||= new Date().toISOString();
  raw.updatedAt = new Date().toISOString();
  await pool.query(`INSERT INTO crm_documents (collection, id, data, created_at, updated_at)
    VALUES ($1, $2, $3::jsonb, COALESCE(($3::jsonb->>'createdAt')::timestamptz, NOW()), NOW())
    ON CONFLICT (collection, id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`, [collection, id, JSON.stringify(raw)]);
  const documents = cache.get(collection);
  if (documents) {
    const index = documents.findIndex((item) => String(item._id) === id);
    if (index >= 0) documents[index] = revive(raw);
    else documents.push(revive(raw));
  }
  return revive(raw);
}

async function remove(collection, id) {
  await pool.query('DELETE FROM crm_documents WHERE collection = $1 AND id = $2', [collection, String(id)]);
  const documents = cache.get(collection);
  if (documents) cache.set(collection, documents.filter((item) => String(item._id) !== String(id)));
}

function asDocument(collection, raw) {
  if (!raw) return null;
  const doc = revive({ ...raw });
  Object.defineProperty(doc, 'id', { enumerable: false, get: () => String(doc._id) });
  Object.defineProperty(doc, 'toObject', { enumerable: false, value: () => serialize(doc) });
  Object.defineProperty(doc, 'save', { enumerable: false, value: async () => Object.assign(doc, await persist(collection, doc)) });
  return doc;
}

async function populateOne(doc, spec, schema) {
  if (!doc) return doc;
  const path = typeof spec === 'string' ? spec : spec.path;
  const select = typeof spec === 'object' ? spec.select : undefined;
  const nested = typeof spec === 'object' ? spec.populate : undefined;
  const refInfo = schema?.refs?.[path];
  if (!refInfo) return doc;
  const target = models[refInfo.ref];
  if (!target) return doc;
  const value = getPath(doc, path);
  if (value == null) return doc;
  if (Array.isArray(value)) {
    const populated = await Promise.all(value.map(async (id) => {
      let item = await target.findById(id).select(select).lean();
      if (nested && item) item = await populateOne(item, nested, schemas[refInfo.ref]);
      return item;
    }));
    setPath(doc, path, populated.filter(Boolean));
  } else {
    let populated = await target.findById(value).select(select).lean();
    if (nested && populated) populated = await populateOne(populated, nested, schemas[refInfo.ref]);
    setPath(doc, path, populated);
  }
  return doc;
}

class Query {
  constructor(executor, collection, schema, single = false) {
    this.executor = executor; this.collection = collection; this.schema = schema; this.single = single;
    this._sort = null; this._skip = 0; this._limit = null; this._select = null; this._populate = []; this._lean = false;
  }
  sort(value) { this._sort = value; return this; }
  skip(value) { this._skip = Number(value); return this; }
  limit(value) { this._limit = Number(value); return this; }
  select(value) { this._select = value; return this; }
  populate(path, select) { this._populate.push(typeof path === 'string' ? { path, select } : path); return this; }
  lean() { this._lean = true; return this; }
  async exec() {
    let result = await this.executor();
    let list = this.single ? (result ? [result] : []) : result;
    if (this._sort) {
      const entries = typeof this._sort === 'string' ? [[this._sort.replace(/^-/, ''), this._sort.startsWith('-') ? -1 : 1]] : Object.entries(this._sort);
      list.sort((a, b) => { for (const [path, dir] of entries) { const av = comparable(getPath(a, path)); const bv = comparable(getPath(b, path)); if (av < bv) return -1 * dir; if (av > bv) return dir; } return 0; });
    }
    list = list.slice(this._skip, this._limit == null ? undefined : this._skip + this._limit);
    for (const item of list) for (const spec of this._populate) await populateOne(item, spec, this.schema);
    list = list.map((item) => project(item, this._select)).map((item) => this._lean ? serialize(item) : asDocument(this.collection, item));
    return this.single ? (list[0] || null) : list;
  }
  then(resolve, reject) { return this.exec().then(resolve, reject); }
  catch(reject) { return this.exec().catch(reject); }
}

function createModel(name, schema = new Schema()) {
  const collection = name.toLowerCase() + 's';
  schemas[name] = schema;
  class Model {
    constructor(data = {}) { Object.assign(this, asDocument(collection, { ...data, _id: data._id || new ObjectId().toString() })); }
    static find(filter = {}, projection) { const q = new Query(async () => (await all(collection)).filter((doc) => matches(doc, filter)), collection, schema); if (projection) q.select(projection); return q; }
    static findOne(filter = {}, projection) { const q = new Query(async () => (await all(collection)).find((doc) => matches(doc, filter)) || null, collection, schema, true); if (projection) q.select(projection); return q; }
    static findById(id, projection) { return this.findOne({ _id: id }, projection); }
    static async create(data) { if (Array.isArray(data)) return Promise.all(data.map((item) => this.create(item))); return asDocument(collection, await persist(collection, { ...data, _id: data._id || new ObjectId().toString() })); }
    static async insertMany(data) { return Promise.all(data.map((item) => this.create(item))); }
    static async countDocuments(filter = {}) { return (await all(collection)).filter((doc) => matches(doc, filter)).length; }
    static async distinct(field, filter = {}) { return [...new Set((await all(collection)).filter((doc) => matches(doc, filter)).flatMap((doc) => { const value = getPath(doc, field); return Array.isArray(value) ? value : [value]; }).filter((value) => value != null).map(String))]; }
    static findByIdAndUpdate(id, update, options = {}) { return this.findOneAndUpdate({ _id: id }, update, options); }
    static findOneAndUpdate(filter, update, options = {}) { return new Query(async () => { let doc = (await all(collection)).find((item) => matches(item, filter)); const inserted = !doc; if (!doc && options.upsert) doc = { ...serialize(filter), _id: new ObjectId().toString() }; if (!doc) return null; const before = { ...doc }; applyUpdate(doc, update, inserted); const saved = await persist(collection, doc); return options.new || options.upsert ? saved : before; }, collection, schema, true); }
    static findByIdAndDelete(id) { return this.findOneAndDelete({ _id: id }); }
    static findOneAndDelete(filter) { return new Query(async () => { const doc = (await all(collection)).find((item) => matches(item, filter)); if (doc) await remove(collection, doc._id); return doc || null; }, collection, schema, true); }
    static async updateOne(filter, update, options = {}) { const doc = await this.findOneAndUpdate(filter, update, { ...options, new: true }); return { acknowledged: true, matchedCount: doc ? 1 : 0, modifiedCount: doc ? 1 : 0, upsertedCount: options.upsert && doc ? 1 : 0 }; }
    static async updateMany(filter, update) { const docs = (await all(collection)).filter((item) => matches(item, filter)); await Promise.all(docs.map((doc) => persist(collection, applyUpdate(doc, update)))); return { acknowledged: true, matchedCount: docs.length, modifiedCount: docs.length }; }
    static async deleteOne(filter) { const doc = (await all(collection)).find((item) => matches(item, filter)); if (doc) await remove(collection, doc._id); return { deletedCount: doc ? 1 : 0 }; }
    static async deleteMany(filter) { const docs = (await all(collection)).filter((item) => matches(item, filter)); await Promise.all(docs.map((doc) => remove(collection, doc._id))); return { deletedCount: docs.length }; }
    static async aggregate(pipeline = []) { let docs = await all(collection); for (const stage of pipeline) { if (stage.$match) docs = docs.filter((doc) => matches(doc, stage.$match)); else if (stage.$sort) docs.sort((a, b) => { for (const [path, dir] of Object.entries(stage.$sort)) { const av = comparable(getPath(a, path)); const bv = comparable(getPath(b, path)); if (av < bv) return -dir; if (av > bv) return dir; } return 0; }); else if (stage.$group) { const groups = new Map(); for (const doc of docs) { const keyPath = String(stage.$group._id || '').replace(/^\$/, ''); const key = keyPath ? getPath(doc, keyPath) : null; if (!groups.has(String(key))) groups.set(String(key), { _id: key }); const group = groups.get(String(key)); for (const [field, expression] of Object.entries(stage.$group)) { if (field === '_id') continue; if (expression.$first !== undefined && group[field] === undefined) group[field] = getPath(doc, String(expression.$first).replace(/^\$/, '')); if (expression.$sum !== undefined) group[field] = Number(group[field] || 0) + (typeof expression.$sum === 'number' ? expression.$sum : Number(getPath(doc, String(expression.$sum).replace(/^\$/, '')) || 0)); } } docs = [...groups.values()]; } }
      return docs;
    }
  }
  models[name] = Model;
  return Model;
}

async function connect(uri) {
  pool = new Pool({ connectionString: uri, ssl: { rejectUnauthorized: false }, max: 5 });
  await pool.query(`CREATE TABLE IF NOT EXISTS crm_documents (
    collection text NOT NULL,
    id text NOT NULL,
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (collection, id)
  )`);
  await pool.query('CREATE INDEX IF NOT EXISTS crm_documents_collection_idx ON crm_documents(collection)');
  connection.readyState = 1;
  connection.db = null;
  connection.emit('connected');
  return module.exports;
}

async function disconnect() {
  if (pool) await pool.end();
  connection.readyState = 0;
  cache.clear();
  connection.emit('disconnected');
}

function model(name, schema) { return models[name] || createModel(name, schema); }
function set() {}

const mongoose = { Schema, Types: { ObjectId }, model, models, connect, disconnect, set, connection };
module.exports = mongoose;
module.exports.default = mongoose;
module.exports.Schema = Schema;
module.exports.Types = mongoose.Types;
module.exports.ObjectId = ObjectId;
module.exports.model = model;
module.exports.models = models;
module.exports.connect = connect;
module.exports.disconnect = disconnect;
module.exports.set = set;
module.exports.connection = connection;
