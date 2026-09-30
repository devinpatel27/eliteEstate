const { createApp } = require('../dist/config/app');
const { connectDatabase } = require('../dist/config/database');

const app = createApp();
let ready;

function initialize() {
  if (!ready) {
    ready = connectDatabase();
  }
  return ready;
}

module.exports = async (req, res) => {
  try {
    await initialize();
    return app(req, res);
  } catch (error) {
    console.error('API initialization failed', error);
    return res.status(503).json({ success: false, message: 'API is starting. Please retry.' });
  }
};
