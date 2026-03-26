/**
 * Payment event side effects — Firestore orders, blockchain CF.
 * Invoked by the handler worker (Pub/Sub), not the processor.
 */
const { Firestore } = require('@google-cloud/firestore');

const BLOCKCHAIN_CF_URL =
  process.env.BLOCKCHAIN_CF_URL ||
  'https://insert-commitment-esimera-309305771885.europe-west1.run.app';
const STORE_ORIGIN =
  process.env.STORE_ORIGIN || 'https://esimera-store.vercel.app';
const SECNUM_PACKAGE_ID = process.env.SECNUM_PACKAGE_ID || 'secnum_number';
const ORDERS_COLLECTION = process.env.ORDERS_COLLECTION || 'orders';
const DEDUP_COLLECTION = process.env.DEDUP_COLLECTION || 'payment_events_processed';

const db = new Firestore();

function buildClaimUrl(userSecret, label, storeOrigin) {
  const base = (storeOrigin || '').replace(/\/$/, '');
  const claimPage = `${base}/claim?secret=${encodeURIComponent(String(userSecret))}&label=${encodeURIComponent(String(label))}`;
  return `arnacon://install?url=${encodeURIComponent(claimPage)}&provider=Secnum`;
}

function isSecnumOrder(orderData) {
  const packageId = (orderData.package_id || '').trim().toLowerCase();
  return packageId === SECNUM_PACKAGE_ID.trim().toLowerCase();
}

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
  await ref.set({
    processed_at: new Date().toISOString(),
    type: eventType,
    provider,
  });
}

async function findOrderDocBySubscriptionId(subscriptionId) {
  const snap = await db
    .collection(ORDERS_COLLECTION)
    .where('stripe_subscription_id', '==', subscriptionId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0];
}

async function postJson(url, body, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

async function callInsertCommitment(orderId) {
  return postJson(
    BLOCKCHAIN_CF_URL,
    { action: 'purchase', checkoutSessionId: orderId },
    60000,
  );
}

async function callExpire(label) {
  return postJson(BLOCKCHAIN_CF_URL, { action: 'expire', label: String(label) }, 120000);
}

async function getOrderResult(sessionId) {
  const doc = await db.collection(ORDERS_COLLECTION).doc(sessionId).get();
  if (!doc.exists) {
    return { claimUrl: null, label: null, userSecret: null };
  }
  const data = doc.data() || {};
  const label = data.label;
  const userSecret = data.userSecret;
  const legacyClaim = data.claimUrl;
  if (label && userSecret) {
    return {
      claimUrl: buildClaimUrl(userSecret, label, STORE_ORIGIN),
      label,
      userSecret,
    };
  }
  if (legacyClaim) {
    return { claimUrl: legacyClaim, label: null, userSecret: null };
  }
  return { claimUrl: null, label: null, userSecret: null };
}

/** @returns {Promise<{ status: number, json?: object, empty?: boolean, retryable?: boolean }>} */
async function handleCheckoutCompleted(data) {
  const orderUuid = data.order_id;
  if (!orderUuid) {
    return { status: 400, json: { error: 'Missing data.order_id' }, retryable: false };
  }

  const paymentStatus = data.payment_status || '';
  const orderRef = db.collection(ORDERS_COLLECTION).doc(orderUuid);

  const updatePayload = {
    status: paymentStatus,
    updated_at: new Date().toISOString(),
  };
  if (data.subscription_id) {
    updatePayload.stripe_subscription_id = String(data.subscription_id);
  }
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
    const label = result.label;
    const userSecret = result.userSecret;
    if (!label || !userSecret) {
      throw new Error('Insert commitment response missing label or userSecret');
    }
    await orderRef.update({
      label,
      userSecret,
      provisioned_at: new Date().toISOString(),
    });
    console.log(`[handler] Secnum provisioned order=${orderUuid}`);
    return { status: 200, empty: true, retryable: false };
  } catch (e) {
    console.error(`Insert commitment failed for ${orderUuid}:`, e);
    console.error(e.stack);
    return { status: 502, json: { error: e.message || String(e) }, retryable: true };
  }
}

/** @returns {Promise<{ status: number, json?: object, empty?: boolean, retryable?: boolean }>} */
async function handleSubscriptionEnded(data) {
  const subId = data.subscription_id;
  if (!subId) {
    console.log('[handler] subscription.ended missing subscription_id');
    return { status: 200, empty: true, retryable: false };
  }

  let label = null;
  const doc = await findOrderDocBySubscriptionId(String(subId));
  if (doc) {
    const od = doc.data() || {};
    if (isSecnumOrder(od)) {
      label = od.label;
    }
  }

  if (!label) {
    let meta = data.metadata;
    if (!meta || typeof meta !== 'object') meta = {};
    const orderUuid = meta.uuid;
    if (orderUuid) {
      const snap = await db.collection(ORDERS_COLLECTION).doc(orderUuid).get();
      if (snap.exists) {
        const od = snap.data() || {};
        if (isSecnumOrder(od)) {
          label = od.label;
        }
      }
    }
  }

  if (!label) {
    console.log(`[handler] subscription.ended no label for subscription=${subId}`);
    return { status: 200, empty: true, retryable: false };
  }

  try {
    await callExpire(label);
    console.log(`[handler] Expired label=${label} subscription=${subId}`);
    return { status: 200, empty: true, retryable: false };
  } catch (e) {
    console.error(`Expire failed for label=${label} sub=${subId}:`, e);
    console.error(e.stack);
    return { status: 502, json: { error: e.message || String(e) }, retryable: true };
  }
}

async function dispatchCanonicalEvent(eventType, data) {
  if (eventType === 'checkout.completed') {
    return handleCheckoutCompleted(data);
  }
  if (eventType === 'subscription.ended') {
    return handleSubscriptionEnded(data);
  }
  console.log(`[handler] ignored event type=${eventType}`);
  return { status: 200, json: { ok: true, ignored: true }, retryable: false };
}

/**
 * Run side effects for one canonical envelope. Used by Pub/Sub worker.
 * @param {object} envelope - full body { spec_version, type, provider, provider_event_id, data, ... }
 */
async function processEnvelope(envelope) {
  const eventType = envelope.type;
  const provider = envelope.provider;
  const providerEventId = envelope.provider_event_id;
  const data = envelope.data;

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

  if (result.status === 200) {
    try {
      await markEventProcessed(provider, providerEventId, eventType);
    } catch (e) {
      console.error(
        `Failed to mark processed provider=${provider} id=${providerEventId}:`,
        e,
      );
      console.error(e.stack);
    }
    return { ok: true };
  }

  // 4xx — permanent, ack and mark processed so we do not retry forever
  if (result.status >= 400 && result.status < 500) {
    console.error(`[handler] permanent failure ${result.status}`, result.json);
    try {
      await markEventProcessed(provider, providerEventId, eventType);
    } catch (e) {
      console.error(e);
    }
    return { ok: false, permanent: true };
  }

  return { ok: result.status === 200 };
}

module.exports = {
  getOrderResult,
  processEnvelope,
  dispatchCanonicalEvent,
  isEventProcessed,
  markEventProcessed,
  dedupDocId,
};
