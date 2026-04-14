/**
 * Local Express test server — wraps the provider setup Cloud Function handler.
 *
 * Usage:
 *   cp .env.example .env   # fill in values
 *   node server.js         # or: npm run start:server
 *
 * Then POST to http://localhost:8082/provider-setup
 */

'use strict';

require('dotenv').config();

const express                          = require('express');
const { handleProviderSetup, setCors } = require('./index');

const PORT = process.env.PROVIDER_SETUP_PORT || 8082;

const app = express();
app.use(express.json());

app.options('/provider-setup', (req, res) => { setCors(res); res.status(204).send(''); });

app.post('/provider-setup', async (req, res) => {
  setCors(res);
  return handleProviderSetup(req, res);
});

app.use((req, res) => res.status(404).json({ error: `Unknown route: ${req.method} ${req.path}` }));

app.listen(PORT, () => {
  console.log(`[provider-setup] Server running at http://localhost:${PORT}`);
  console.log(`[provider-setup] POST http://localhost:${PORT}/provider-setup`);
});
