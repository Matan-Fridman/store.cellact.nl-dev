/**
 * Public Cloud Function — activate only (/claim flow from the browser).
 */
const functions = require('@google-cloud/functions-framework');
const { setupOrExit, handleActivate, setCors } = require('./shared');

setupOrExit();

functions.http('chainActivate', async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  const { action } = req.body || {};

  if (action === 'activate') {
    return handleActivate(req, res);
  }

  return res.status(400).json({ error: 'Invalid action. Use "activate"' });
});
