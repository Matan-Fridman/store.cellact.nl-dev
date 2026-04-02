/**
 * Public Cloud Function — activate only (/claim flow from the browser).
 */
const functions = require('@google-cloud/functions-framework');
const { setupOrExit, handleActivate, handleGetGroupMembers, handleActivateWithProof, setCors } = require('./shared');

setupOrExit();

functions.http('chainActivate', async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method === 'GET' && (req.path || '').endsWith('/group-members')) {
    return handleGetGroupMembers(req, res);
  }

  const { action } = req.body || {};

  if (action === 'activate') {
    return handleActivate(req, res);
  }

  if (action === 'activateWithProof') {
    return handleActivateWithProof(req, res);
  }

  return res.status(400).json({ error: 'Invalid action. Use "activate" or "activateWithProof"' });
});
