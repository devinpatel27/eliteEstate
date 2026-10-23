const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
process.env.DATABASE_URL = 'postgresql://unused/test';
process.env.NODE_ENV = 'test';
const pg = require('pg');
const originalPool = pg.Pool;
const pools = [];
let failPool = true;
class FakePool extends EventEmitter {
  constructor(options) { super(); this.options=options; this.ended=false; pools.push(this); }
  async query() { if(failPool) {const error = new Error('connection timeout'); error.code='ETIMEDOUT'; throw error;} return {rows:[]}; }
  async end() { this.ended=true; }
}
pg.Pool = FakePool;
const adapter = require('../vendor/mongoose-postgres');
(async () => {
  await assert.rejects(() => adapter.connect(process.env.DATABASE_URL,{serverSelectionTimeoutMS:8000,maxPoolSize:10}), /timeout/);
  assert.ok(pools[0].ended, 'failed pool is closed before retry');
  assert.equal(adapter.connection.readyState,0);
  assert.equal(pools[0].options.connectionTimeoutMillis,8000);
  assert.equal(pools[0].options.max,10);
  assert.equal(pools[0].options.keepAlive,true);
  failPool=false;
  await adapter.connect(process.env.DATABASE_URL);
  assert.equal(adapter.connection.readyState,1);
  await adapter.disconnect();
  assert.ok(pools[1].ended);
  pg.Pool=originalPool;

  const mongoose = require('mongoose');
  const connect = mongoose.connect;
  const timeout = global.setTimeout;
  let attempts=0;
  mongoose.connect = async () => { if (++attempts < 2) throw new Error('test unavailable'); };
  global.setTimeout = callback => {queueMicrotask(callback);return 0;};
  const {connectDatabase} = require('../dist/config/database');
  try {
    await connectDatabase();
    assert.equal(attempts,2,'startup promise waits for successful retry');
    attempts=0;
    mongoose.connect=async()=> {attempts++;throw new Error('permanent failure');};
    await assert.rejects(connectDatabase,/permanent failure/);
    assert.equal(attempts,5,'retry exhaustion rejects instead of starting seeding');
  } finally { mongoose.connect=connect; global.setTimeout=timeout; }

  const {errorMiddleware}=require('../dist/middleware/error.middleware');
  const failure = new Error('connect timed out'); failure.code='ETIMEDOUT'; failure.stack='at pg-pool/index.js';
  const response={headers:{},setHeader(name,value){this.headers[name]=value;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
  errorMiddleware(failure,{},response,()=>{});
  assert.equal(response.code,503);
  assert.equal(response.headers['Retry-After'],'5');
  assert.equal(response.body.success,false);

  const {createApp}=require('../dist/config/app');
  const app=createApp();
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(`${base}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,503);
    assert.equal((await fetch(`${base}/health`)).status,200,'liveness stays available while starting');
    assert.equal((await fetch(`${base}/ready`)).status,503);
    app.locals.databaseReady=true; mongoose.connection.readyState=1;
    assert.equal((await fetch(`${base}/ready`)).status,200);
  } finally {await new Promise(resolve=>server.close(resolve)); mongoose.connection.readyState=0;}
  console.log('Passed: bounded pool, failed-pool cleanup, awaited retries, 503 responses and HTTP readiness gating');
})().catch(error=>{console.error(error);process.exitCode=1;});
