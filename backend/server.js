// Elite Estate CRM Backend Entry Point
// Ensures TypeScript is compiled and runs dist/server.js
const fs = require('fs');
const path = require('path');

const distServerPath = path.join(__dirname, 'dist', 'server.js');

if (!fs.existsSync(distServerPath)) {
  console.log('⚡ Compiling TypeScript on initial boot...');
  try {
    const { execSync } = require('child_process');
    execSync('npx tsc --pretty false', { stdio: 'inherit', cwd: __dirname });
  } catch (err) {
    console.error('Failed to compile TypeScript:', err);
  }
}

require('./dist/server.js');
