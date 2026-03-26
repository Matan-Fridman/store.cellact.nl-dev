/**
 * Payment handler — single HTTP Cloud Function (or Cloud Run) with:
 *
 * - GET /order-result — browser poll (CORS)
 * - POST /_pubsub — Pub/Sub **push** payload (same JSON envelope the processor publishes)
 *
 * Deploy **once** with `--trigger-http`, then attach a **push subscription** on your topic
 * pointing at `https://<your-function-url>/_pubsub` (see handler/README.md).
 *
 * See docs/PAYMENT_ARCHITECTURE.md
 */
const functions = require('@google-cloud/functions-framework');
const { getOrderResult, processEnvelope } = require('./logic');

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Accept, Authorization, X-Processor-Secret',
  );
  res.set('Access-Control-Max-Age', '3600');
}

function pathname(req) {
  const p = req.path || (req.url || '/').split('?')[0];
  return p || '/';
}

function getQueryParam(req, name) {
  const q = req.query && req.query[name];
  if (q != null && q !== '') {
    return Array.isArray(q) ? q[0] : q;
  }
  const qs = (req.url || '').split('?')[1];
  if (!qs) return null;
  try {
    return new URLSearchParams(qs).get(name);
  } catch {
    return null;
  }
}

/**
 * Pub/Sub push body shape:
 * https://cloud.google.com/pubsub/docs/push
 */
async function handlePubSubPush(req, res) {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Expected JSON body' });
  }
  const msg = body.message;
  if (!msg || !msg.data) {
    console.error('[handler] push: missing message.data', Object.keys(body));
    return res.status(400).json({ error: 'Invalid push envelope' });
  }

  let envelope;
  try {
    const raw = Buffer.from(msg.data, 'base64').toString('utf8');
    envelope = JSON.parse(raw);
  } catch (e) {
    console.error('[handler] push: invalid message JSON', e);
    return res.status(400).json({ error: 'Invalid message data' });
  }
  if (!envelope || typeof envelope !== 'object') {
    return res.status(400).json({ error: 'Envelope not an object' });
  }

  console.log(
    `[handler] pubsub push bucket=${msg.attributes?.bucket || envelope.type} provider=${envelope.provider} id=${envelope.provider_event_id}`,
  );

  try {
    await processEnvelope(envelope);
  } catch (e) {
    console.error('[handler] push: processing failed (Pub/Sub will retry)', e);
    console.error(e.stack);
    return res.status(500).json({ error: e.message || 'Processing failed' });
  }

  // Ack push delivery — empty 204 is fine per Pub/Sub docs
  return res.status(204).send('');
}

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
