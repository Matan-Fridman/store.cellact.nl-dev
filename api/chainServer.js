/**
 * Private Cloud Function — purchase + expire only (payment worker → this URL with ID token).
 */
const functions = require('@google-cloud/functions-framework');
const { setupOrExit, handlePurchase, handleExpire, setCors } = require('./shared');

setupOrExit();

functions.http('chainServer', async (req, res) => {
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

  return res.status(404).json({ error: 'Not found' });
});
