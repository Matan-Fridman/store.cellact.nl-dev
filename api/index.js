/**
 * Legacy monolith entry — purchase, expire, activate in one deploy.
 * Production: prefer chainServer.js + chainActivate.js (split IAM).
 *
 * Gen2 deploy always loads this file as `main`; `require` split targets so
 * `--entry-point=chainServer` / `chainActivate` resolve when deploying from this directory.
 */
const functions = require('@google-cloud/functions-framework');
require('./chainServer');
require('./chainActivate');
const {
  setupOrExit,
  handlePurchase,
  handleExpire,
  handleActivate,
  setCors,
} = require('./shared');

setupOrExit();

functions.http('main', async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  const { action } = req.body || {};

  if (action === 'purchase') {
    return handlePurchase(req, res);
  }
  if (action === 'expire') {
    return handleExpire(req, res);
  }
  if (action === 'activate') {
    return handleActivate(req, res);
  }
  return res
    .status(400)
    .json({ error: 'Invalid action. Use "purchase", "expire", or "activate"' });
});
