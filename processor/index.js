/**
 * Payment processor (ingest only) — validates adapters, dedupes ingest, writes **buckets**, publishes to Pub/Sub.
 * Does **not** update orders or call the blockchain; the **handler** subscribes and runs side effects.
 *
 * POST /v1/events — adapters + X-Processor-Secret
 *
 * Buckets (Firestore):
 *   payment_event_buckets/{bucket}/items/{autoId}
 *   fields: envelope (full canonical object), ingested_at
 *
 * Pub/Sub: topic PAYMENT_EVENTS_TOPIC — message body = JSON envelope, attributes.bucket = canonical type
 *
 * Ingest dedup (Firestore): payment_event_ingest_keys/{provider:evtId} — prevents double enqueue
 *
 * See docs/PAYMENT_ARCHITECTURE.md
 */
const functions = require('@google-cloud/functions-framework');
const { Firestore, FieldValue } = require('@google-cloud/firestore');
const { PubSub } = require('@google-cloud/pubsub');

const PROCESSOR_INGEST_SECRET = process.env.PROCESSOR_INGEST_SECRET || '';
const INGEST_KEYS_COLLECTION =
  process.env.INGEST_KEYS_COLLECTION || 'payment_event_ingest_keys';
const BUCKET_ROOT = process.env.PAYMENT_EVENT_BUCKET_ROOT || 'payment_event_buckets';

const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
const PAYMENT_EVENTS_TOPIC =
  process.env.PAYMENT_EVENTS_TOPIC || 'secnum-payment-events';

const db = new Firestore();
const pubsub = PROJECT_ID ? new PubSub({ projectId: PROJECT_ID }) : new PubSub();

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

function dedupDocId(provider, providerEventId) {
  return `${provider}:${providerEventId}`.replace(/[/\\]/g, '_').slice(0, 1500);
}

/** Firestore collection document id safe bucket name from canonical type */
function bucketSlug(type) {
  return String(type || 'unknown')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 200);
}

function isAlreadyExistsError(e) {
  return (
    e.code === 6 ||
    e.code === 'ALREADY_EXISTS' ||
    (e.message && String(e.message).includes('ALREADY_EXISTS'))
  );
}

functions.http('main', async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  const path = pathname(req);

  if (req.method === 'GET' && path === '/') {
    return res.status(200).json({
      service: 'payment-processor',
      ok: true,
      role: 'ingest-only',
    });
  }

  if (req.method !== 'POST' || !path.endsWith('/v1/events')) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (!PROCESSOR_INGEST_SECRET) {
    console.log('PROCESSOR_INGEST_SECRET is not set');
    return res.status(500).json({ error: 'Processor not configured' });
  }

  const secret = req.get('X-Processor-Secret') || '';
  if (secret !== PROCESSOR_INGEST_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Expected JSON object' });
  }

  if (body.spec_version !== '1') {
    return res.status(400).json({ error: 'Unsupported spec_version' });
  }

  const eventType = body.type;
  const provider = body.provider;
  const providerEventId = body.provider_event_id;
  const data = body.data;

  if (!eventType || typeof eventType !== 'string') {
    return res.status(400).json({ error: 'Missing type' });
  }
  if (!provider || typeof provider !== 'string') {
    return res.status(400).json({ error: 'Missing provider' });
  }
  if (!providerEventId || typeof providerEventId !== 'string') {
    return res.status(400).json({ error: 'Missing provider_event_id' });
  }
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Missing data object' });
  }

  const ingestKeyId = dedupDocId(provider, providerEventId);
  const ingestKeyRef = db.collection(INGEST_KEYS_COLLECTION).doc(ingestKeyId);
  const bucket = bucketSlug(eventType);
  const bucketItemRef = db
    .collection(BUCKET_ROOT)
    .doc(bucket)
    .collection('items')
    .doc();

  try {
    await ingestKeyRef.create({
      created_at: FieldValue.serverTimestamp(),
      bucket,
      provider,
      provider_event_id: providerEventId,
      type: eventType,
    });
  } catch (e) {
    if (isAlreadyExistsError(e)) {
      console.log(`[processor] deduplicated ingest provider=${provider} id=${providerEventId}`);
      return res.status(200).json({ ok: true, deduplicated: true });
    }
    console.error('[processor] ingest key create failed', e);
    return res.status(500).json({ error: 'Ingest dedup failed' });
  }

  try {
    await bucketItemRef.set({
      envelope: body,
      ingested_at: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('[processor] bucket write failed', e);
    await ingestKeyRef.delete().catch(() => {});
    return res.status(500).json({ error: 'Bucket write failed' });
  }

  const topic = pubsub.topic(PAYMENT_EVENTS_TOPIC);
  try {
    await topic.publishMessage({
      data: Buffer.from(JSON.stringify(body), 'utf8'),
      attributes: {
        bucket: eventType,
        provider,
        type: eventType,
      },
    });
  } catch (e) {
    console.error('[processor] Pub/Sub publish failed', e);
    await bucketItemRef.delete().catch(() => {});
    await ingestKeyRef.delete().catch(() => {});
    return res.status(502).json({ error: 'Failed to publish event' });
  }

  console.log(
    `[processor] enqueued bucket=${bucket} provider=${provider} id=${providerEventId} topic=${PAYMENT_EVENTS_TOPIC}`,
  );

  return res.status(202).json({
    ok: true,
    accepted: true,
    bucket,
    bucket_item_id: bucketItemRef.id,
    topic: PAYMENT_EVENTS_TOPIC,
  });
});
