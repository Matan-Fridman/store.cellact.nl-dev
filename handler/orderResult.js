/**
 * Public HTTP target — GET /order-result only (browser poll).
 * Deploy without coupling to Pub/Sub worker IAM.
 */
const functions = require('@google-cloud/functions-framework');
const { setCors, pathname, getQueryParam, getOrderResult } = require('./httpShared');

functions.http('orderResult', async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  const path = pathname(req);

  if (req.method === 'GET' && path === '/') {
    return res.status(200).json({
      service: 'secnum-order-result',
      ok: true,
    });
  }

  if (req.method === 'GET' && path.endsWith('/order-result')) {
    const sessionId = getQueryParam(req, 'session_id');
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing session_id' });
    }
    console.log(`[order-result] GET session_id=${sessionId}`);
    const payload = await getOrderResult(sessionId);
    return res.status(200).json(payload);
  }

  return res.status(404).json({ error: 'Not found' });
});
