/**
 * Legacy combined handler — order-result + /_pubsub in one deploy.
 * Production: deploy orderResult.js + worker.js separately (see docs/DEPLOYMENT.md).
 *
 * Gen2 deploy loads `package.json` → `main` → this file; require split targets so
 * `--entry-point=orderResult` / `worker` work when deploying from `handler/`.
 */
const functions = require('@google-cloud/functions-framework');
require('./orderResult');
require('./worker');
const { setCors, pathname, getQueryParam, handlePubSubPush, getOrderResult } = require('./httpShared');

functions.http('main', async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  const path = pathname(req);

  if (req.method === 'GET' && path === '/') {
    return res.status(200).json({
      service: 'payment-handler',
      ok: true,
      pubsub_push_path: '/_pubsub',
      note: 'prefer split deploy: orderResult + worker',
    });
  }

  if (req.method === 'GET' && path.endsWith('/order-result')) {
    const sessionId = getQueryParam(req, 'session_id');
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing session_id' });
    }
    console.log(`[handler] GET order-result session_id=${sessionId}`);
    const payload = await getOrderResult(sessionId);
    return res.status(200).json(payload);
  }

  if (req.method === 'POST' && (path === '/_pubsub' || path.endsWith('/_pubsub'))) {
    return handlePubSubPush(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
});
