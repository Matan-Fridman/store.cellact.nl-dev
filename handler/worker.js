/**
 * Private HTTP target — POST /_pubsub for authenticated Pub/Sub push only.
 */
const functions = require('@google-cloud/functions-framework');
const { setCors, pathname, handlePubSubPush } = require('./httpShared');

functions.http('worker', async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  const path = pathname(req);

  if (req.method === 'GET' && path === '/') {
    return res.status(200).json({
      service: 'secnum-payment-worker',
      ok: true,
      pubsub_push_path: '/_pubsub',
    });
  }

  if (req.method === 'POST' && (path === '/_pubsub' || path.endsWith('/_pubsub'))) {
    return handlePubSubPush(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
});
