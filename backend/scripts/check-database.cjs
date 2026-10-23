const path = require('node:path');
const inherited = Boolean(process.env.DATABASE_URL);
require('dotenv').config({path: path.resolve(__dirname, '../.env')});
const {Pool} = require('pg');

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  const url = new URL(process.env.DATABASE_URL);
  console.log(`Node: ${process.version}; working directory: ${process.cwd()}`);
  console.log(`Database target: ${url.hostname}:${url.port || '5432'}`);
  console.log(`DATABASE_URL source: ${inherited ? 'process environment' : 'backend/.env'}`);
  const pool = new Pool({connectionString: process.env.DATABASE_URL, connectionTimeoutMillis:10000, statement_timeout:10000});
  try {
    await pool.query('SELECT 1 AS ok');
    console.log('DATABASE OK: connection, authentication and query succeeded');
  } finally { await pool.end(); }
}
main().catch(error => {
  // Do not print connection options or raw errors containing credentials.
  console.error(`DATABASE FAILED: ${error.code || error.name || 'connection error'}`);
  process.exitCode = 1;
});
