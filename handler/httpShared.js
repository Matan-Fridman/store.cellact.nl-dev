/**
 * Shared HTTP utilities for the payment handler — CORS, path helpers,
 * Pub/Sub push decoding + schema validation, order-result proxy.
 */

const Ajv = require('ajv');
const { getOrderResult, processEnvelope } = require('./logic');

// ─── Schema ───────────────────────────────────────────────────────────────────
// Pub/Sub push envelope wrapper sent by Cloud Pub/Sub to the /_pubsub endpoint.

const ajv = new Ajv({ allErrors: true });

const PUSH_WRAPPER_SCHEMA = {
  type: 'object',
  required: ['message'],
  additionalProperties: true,
  properties: {
    message: {
      type: 'object',
      required: ['data'],
      additionalProperties: true,
      properties: {
        data: { type: 'string', minLength: 1 },
        attributes: { type: 'object' },
        messageId: { type: 'string' },
      },
    },
    subscription: { type: 'string' },
  },
};

// Canonical payment envelope — same shape the processor writes.
const ENVELOPE_SCHEMA = {
  type: 'object',
  required: ['spec_version', 'type', 'provider', 'provider_event_id', 'data'],
  additionalProperties: true,
  properties: {
    spec_version: { type: 'string', enum: ['1'] },
    type: { type: 'string', minLength: 1 },
    provider: { type: 'string', minLength: 1 },
    provider_event_id: { type: 'string', minLength: 1 },
    data: { type: 'object' },
  },
};

const validatePushWrapper = ajv.compile(PUSH_WRAPPER_SCHEMA);
const validateEnvelope = ajv.compile(ENVELOPE_SCHEMA);

function schemaError(validator) {
  return ajv.errorsText(validator.errors);
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Processor-Secret');
  res.set('Access-Control-Max-Age', '3600');
}

// ─── Request helpers ──────────────────────────────────────────────────────────

function pathname(req) {
  const p = req.path || (req.url || '/').split('?')[0];
  return p || '/';
}

function getQueryParam(req, name) {
  const q = req.query && req.query[name];
  if (q != null && q !== '') return Array.isArray(q) ? q[0] : q;
  const qs = (req.url || '').split('?')[1];
  if (!qs) return null;
  try {
    return new URLSearchParams(qs).get(name);
  } catch {
    return null;
  }
}

// ─── Pub/Sub push handler ─────────────────────────────────────────────────────

async function handlePubSubPush(req, res) {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Expected JSON body' });
  }

  // Validate push wrapper shape
  if (!validatePushWrapper(body)) {
    const err = schemaError(validatePushWrapper);
    console.error(`[payment-worker] push wrapper schema invalid: ${err}`);
    return res.status(400).json({ error: `Invalid push envelope: ${err}` });
  }

  const msg = body.message;

  // Decode base64 message data
  let envelope;
  try {
    const raw = Buffer.from(msg.data, 'base64').toString('utf8');
    envelope = JSON.parse(raw);
  } catch (e) {
    console.error('[payment-worker] push: invalid message JSON', e);
    return res.status(400).json({ error: 'Invalid message data' });
  }

  if (!envelope || typeof envelope !== 'object') {
    return res.status(400).json({ error: 'Envelope not an object' });
  }

  // Validate canonical envelope schema
  if (!validateEnvelope(envelope)) {
    const err = schemaError(validateEnvelope);
    console.error(`[payment-worker] envelope schema invalid: ${err}`);
    return res.status(400).json({ error: `Invalid envelope: ${err}` });
  }

  console.log(
    `[payment-worker] push bucket=${msg.attributes?.bucket || envelope.type} provider=${envelope.provider} id=${envelope.provider_event_id}`,
  );

  try {
    await processEnvelope(envelope);
  } catch (e) {
    console.error('[payment-worker] processing failed (Pub/Sub will retry)', e);
    console.error(e.stack);
    return res.status(500).json({ error: e.message || 'Processing failed' });
  }

  return res.status(204).send('');
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  setCors,
  pathname,
  getQueryParam,
  handlePubSubPush,
  getOrderResult,
};
