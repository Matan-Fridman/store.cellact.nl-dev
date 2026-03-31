/**
 * Payment event side effects — Firestore order updates, blockchain calls.
 * Invoked by the handler worker via Pub/Sub. No HTTP logic here.
 */

const { Firestore } = require('@google-cloud/firestore');
const Ajv = require('ajv');

// ─── Config ───────────────────────────────────────────────────────────────────

/** Private chain-server URL (purchase / expire). Falls back to legacy monolith. */
const BLOCKCHAIN_SERVER_URL =
  process.env.BLOCKCHAIN_SERVER_URL ||
  process.env.BLOCKCHAIN_CF_URL ||
  'https://insert-commitment-esimera-309305771885.europe-west1.run.app';

const STORE_ORIGIN = process.env.STORE_ORIGIN || 'https://esimera-store.vercel.app';
const SECNUM_PACKAGE_ID = process.env.SECNUM_PACKAGE_ID || 'secnum_number';
const ORDERS_COLLECTION = process.env.ORDERS_COLLECTION || 'orders';
const DEDUP_COLLECTION = process.env.DEDUP_COLLECTION || 'payment_events_processed';

// ─── Clients ──────────────────────────────────────────────────────────────────

const db = new Firestore();

// ─── Schemas ──────────────────────────────────────────────────────────────────
// Validates the `data` payload for each canonical event type processed here.

const ajv = new Ajv({ allErrors: true });

const CHECKOUT_DATA_SCHEMA = {
  type: 'object',
  required: ['order_id'],
  additionalProperties: true,
  properties: {
    order_id: { type: 'string', minLength: 1 },
    payment_status: { type: 'string' },
    subscription_id: { type: ['string', 'null'] },
    livemode: { type: 'boolean' },
  },
};

const SUBSCRIPTION_ENDED_DATA_SCHEMA = {
  type: 'object',
  required: ['subscription_id'],
  additionalProperties: true,
  properties: {
    subscription_id: { type: 'string', minLength: 1 },
    metadata: { type: 'object' },
  },
};

const validateCheckoutData = ajv.compile(CHECKOUT_DATA_SCHEMA);
const validateSubscriptionEndedData = ajv.compile(SUBSCRIPTION_ENDED_DATA_SCHEMA);

function schemaError(validator) {
  return ajv.errorsText(validator.errors);
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function dedupDocId(provider, providerEventId) {
  return `${provider}:${providerEventId}`.replace(/[/\\]/g, '_').slice(0, 1500);
}

async function isEventProcessed(provider, providerEventId) {
  const ref = db.collection(DEDUP_COLLECTION).doc(dedupDocId(provider, providerEventId));
  const snap = await ref.get();
  return snap.exists;
}

async function markEventProcessed(provider, providerEventId, eventType) {
  const ref = db.collection(DEDUP_COLLECTION).doc(dedupDocId(provider, providerEventId));
  await ref.set({ processed_at: new Date().toISOString(), type: eventType, provider });
}

// ─── GCP identity tokens ──────────────────────────────────────────────────────

function runsOnGcp() {
  return Boolean(
    process.env.K_SERVICE || process.env.FUNCTION_TARGET || process.env.K_REVISION,
  );
}

async function mergeAuthHeaders(url, headers) {
  if (process.env.SKIP_GCP_ID_TOKEN === '1') return headers;
  if (!url.startsWith('https://')) return headers;
  try {
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth();
    const client = await auth.getIdTokenClient(new URL(url).origin);
    const authHeaders = await client.getRequestHeaders(url);
    return { ...headers, ...authHeaders };
  } catch (e) {
    if (runsOnGcp()) throw e;
    console.warn(`[handler] ID token skipped (local): ${e.message}`);
    return headers;
  }
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function postJson(url, body, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const headers = await mergeAuthHeaders(url, { 'Content-Type': 'application/json' });
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text.slice(0, 500) };
    }
    if (!res.ok) {
      const err = new Error(data.error || res.statusText || `HTTP ${res.status}`);
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  } finally {
    clearTimeout(t);
  }
}

// ─── Chain-server calls ───────────────────────────────────────────────────────

async function callInsertCommitment(orderId) {
  return postJson(BLOCKCHAIN_SERVER_URL, { action: 'purchase', checkoutSessionId: orderId }, 60000);
}

async function callExpire(label) {
  return postJson(BLOCKCHAIN_SERVER_URL, { action: 'expire', label: String(label) }, 120000);
}

// ─── Order helpers ────────────────────────────────────────────────────────────

function buildClaimUrl(userSecret, label, storeOrigin) {
  const base = (storeOrigin || '').replace(/\/$/, '');
  const claimPage = `${base}/claim?secret=${encodeURIComponent(String(userSecret))}&label=${encodeURIComponent(String(label))}`;
  return `arnacon://install?url=${encodeURIComponent(claimPage)}&provider=Secnum`;
}

function isSecnumOrder(orderData) {
  const packageId = (orderData.package_id || '').trim().toLowerCase();
  return packageId === SECNUM_PACKAGE_ID.trim().toLowerCase();
}

async function findOrderDocBySubscriptionId(subscriptionId) {
  const snap = await db
    .collection(ORDERS_COLLECTION)
    .where('stripe_subscription_id', '==', subscriptionId)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0];
}

// ─── Order result (public poll) ───────────────────────────────────────────────

async function getOrderResult(sessionId) {
  const doc = await db.collection(ORDERS_COLLECTION).doc(sessionId).get();
  if (!doc.exists) return { claimUrl: null, label: null, userSecret: null };
  const data = doc.data() || {};
  const { label, userSecret, claimUrl: legacyClaim } = data;
  if (label && userSecret) {
    return { claimUrl: buildClaimUrl(userSecret, label, STORE_ORIGIN), label, userSecret };
  }
  if (legacyClaim) return { claimUrl: legacyClaim, label: null, userSecret: null };
  return { claimUrl: null, label: null, userSecret: null };
}

// ─── Event handlers ───────────────────────────────────────────────────────────

/** @returns {Promise<{ status: number, json?: object, empty?: boolean, retryable?: boolean }>} */
async function handleCheckoutCompleted(data) {
  if (!validateCheckoutData(data)) {
    const err = schemaError(validateCheckoutData);
    console.warn(`[handler] checkout data schema invalid: ${err}`);
    return { status: 400, json: { error: `Invalid checkout data: ${err}` }, retryable: false };
  }

  const { order_id: orderUuid, payment_status: paymentStatus = '', subscription_id } = data;

  const orderRef = db.collection(ORDERS_COLLECTION).doc(orderUuid);
  const updatePayload = { status: paymentStatus, updated_at: new Date().toISOString() };
  if (subscription_id) updatePayload.stripe_subscription_id = String(subscription_id);
  await orderRef.update(updatePayload);

  if (paymentStatus !== 'paid') {
    return { status: 200, empty: true, retryable: false };
  }

  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) {
    return { status: 404, json: { error: 'Order not found' }, retryable: false };
  }
  const orderData = orderDoc.data() || {};

  if (!isSecnumOrder(orderData)) {
    return { status: 200, empty: true, retryable: false };
  }

  if (orderData.label && orderData.userSecret) {
    return { status: 200, empty: true, retryable: false };
  }

  try {
    const result = await callInsertCommitment(orderUuid);
    const { label, userSecret } = result;
    if (!label || !userSecret) {
      throw new Error('Insert commitment response missing label or userSecret');
    }
    await orderRef.update({ label, userSecret, provisioned_at: new Date().toISOString() });
    console.log(`[handler] provisioned order=${orderUuid} label=${label}`);
    return { status: 200, empty: true, retryable: false };
  } catch (e) {
    console.error(`[handler] insert commitment failed for order=${orderUuid}:`, e);
    return { status: 502, json: { error: e.message || String(e) }, retryable: true };
  }
}

/** @returns {Promise<{ status: number, json?: object, empty?: boolean, retryable?: boolean }>} */
async function handleSubscriptionEnded(data) {
  if (!validateSubscriptionEndedData(data)) {
    const err = schemaError(validateSubscriptionEndedData);
    console.warn(`[handler] subscription.ended data schema invalid: ${err}`);
    return { status: 400, json: { error: `Invalid subscription data: ${err}` }, retryable: false };
  }

  const { subscription_id: subId, metadata = {} } = data;

  let label = null;

  // Try to find order by subscription id
  const doc = await findOrderDocBySubscriptionId(String(subId));
  if (doc && isSecnumOrder(doc.data() || {})) {
    label = (doc.data() || {}).label || null;
  }

  // Fall back to metadata.uuid
  if (!label && metadata.uuid) {
    const snap = await db.collection(ORDERS_COLLECTION).doc(metadata.uuid).get();
    if (snap.exists && isSecnumOrder(snap.data() || {})) {
      label = (snap.data() || {}).label || null;
    }
  }

  if (!label) {
    console.log(`[handler] subscription.ended no label for subscription=${subId}`);
    return { status: 200, empty: true, retryable: false };
  }

  try {
    await callExpire(label);
    console.log(`[handler] expired label=${label} subscription=${subId}`);
    return { status: 200, empty: true, retryable: false };
  } catch (e) {
    console.error(`[handler] expire failed label=${label} sub=${subId}:`, e);
    return { status: 502, json: { error: e.message || String(e) }, retryable: true };
  }
}

// ─── Envelope dispatcher ──────────────────────────────────────────────────────

async function dispatchCanonicalEvent(eventType, data) {
  if (eventType === 'checkout.completed') return handleCheckoutCompleted(data);
  if (eventType === 'subscription.ended') return handleSubscriptionEnded(data);
  console.log(`[handler] ignored event type=${eventType}`);
  return { status: 200, json: { ok: true, ignored: true }, retryable: false };
}

/**
 * Process one canonical envelope from Pub/Sub. Handles dedup and dispatches side effects.
 * @param {object} envelope — { spec_version, type, provider, provider_event_id, data, ... }
 */
async function processEnvelope(envelope) {
  const { type: eventType, provider, provider_event_id: providerEventId, data } = envelope;

  if (await isEventProcessed(provider, providerEventId)) {
    console.log(`[handler] deduplicated provider=${provider} id=${providerEventId}`);
    return { skipped: true, reason: 'deduplicated' };
  }

  const result = await dispatchCanonicalEvent(eventType, data);

  if (result.retryable && result.status >= 500) {
    const err = new Error(result.json?.error || 'Handler failed');
    err.handlerResult = result;
    throw err;
  }

  // 2xx — success; mark processed
  if (result.status === 200) {
    try {
      await markEventProcessed(provider, providerEventId, eventType);
    } catch (e) {
      console.error(`[handler] failed to mark processed provider=${provider} id=${providerEventId}:`, e);
    }
    return { ok: true };
  }

  // 4xx — permanent failure; ack and mark so we do not retry forever
  if (result.status >= 400 && result.status < 500) {
    console.error(`[handler] permanent failure status=${result.status}`, result.json);
    try {
      await markEventProcessed(provider, providerEventId, eventType);
    } catch (e) {
      console.error(e);
    }
    return { ok: false, permanent: true };
  }

  return { ok: result.status === 200 };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getOrderResult,
  processEnvelope,
  dispatchCanonicalEvent,
  isEventProcessed,
  markEventProcessed,
  dedupDocId,
};
