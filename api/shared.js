/**
 * Shared chain logic for secnum-chain-server (private) and secnum-chain-activate (public).
 * Handles GCS number allocation, blockchain calls via ArnaconSDK, and notifications.
 */

const { Storage } = require('@google-cloud/storage');
const ArnaconSDK = require('arnacon-sdk');
const Ajv = require('ajv');
const NotificationService = require('./NotificationService');

// ─── Config ───────────────────────────────────────────────────────────────────

const PRIVATE_KEY = process.env.COORDINATES;
const CHAIN_ID = process.env.CHAIN_ID || '137';
const ENS_NAME = process.env.ENS_NAME || 'secnum';
const BUCKET_NAME = process.env.BUCKET_NAME || 'secnum-numbers';
const NUMBERS_FILE = 'numbers.json';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ajv = new Ajv({ allErrors: true });

const PURCHASE_SCHEMA = {
  type: 'object',
  required: ['action', 'checkoutSessionId'],
  additionalProperties: true,
  properties: {
    action: { type: 'string', enum: ['purchase'] },
    checkoutSessionId: { type: 'string', minLength: 1 },
  },
};

const EXPIRE_SCHEMA = {
  type: 'object',
  required: ['action', 'label'],
  additionalProperties: true,
  properties: {
    action: { type: 'string', enum: ['expire'] },
    label: { type: 'string', minLength: 1 },
  },
};

const ACTIVATE_SCHEMA = {
  type: 'object',
  required: ['action', 'userSecret', 'label', 'owner'],
  additionalProperties: true,
  properties: {
    action: { type: 'string', enum: ['activate'] },
    userSecret: { type: 'string', minLength: 1 },
    label: { type: 'string', minLength: 1 },
    owner: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
  },
};

const ACTIVATE_WITH_PROOF_SCHEMA = {
  type: 'object',
  required: ['action', 'proof', 'label', 'owner'],
  additionalProperties: true,
  properties: {
    action: { type: 'string', enum: ['activateWithProof'] },
    proof: {
      type: 'object',
      required: ['merkleTreeDepth', 'merkleTreeRoot', 'nullifier', 'message', 'scope', 'points'],
      properties: {
        merkleTreeDepth: { type: 'number' },
        merkleTreeRoot: { type: 'string' },
        nullifier: { type: 'string' },
        message: { type: 'string' },
        scope: { type: 'string' },
        points: { type: 'array', items: { type: 'string' } },
      },
    },
    label: { type: 'string', minLength: 1 },
    owner: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
  },
};

const validatePurchase = ajv.compile(PURCHASE_SCHEMA);
const validateExpire = ajv.compile(EXPIRE_SCHEMA);
const validateActivate = ajv.compile(ACTIVATE_SCHEMA);
const validateActivateWithProof = ajv.compile(ACTIVATE_WITH_PROOF_SCHEMA);

function schemaError(validator) {
  return ajv.errorsText(validator.errors);
}

// ─── SDK / GCS context (lazy singleton) ──────────────────────────────────────

let sdk;
let bucket;

function getContext() {
  if (!sdk) {
    sdk = new ArnaconSDK(PRIVATE_KEY, CHAIN_ID);
    const storage = new Storage();
    bucket = storage.bucket(BUCKET_NAME);
    sdk.setContractAddresses({
      SecondLevelController: '0x0A8b08435d7Ee515308e4D9885e83C5B442A446b',
      SecondLevelInteractor: '0xac9A8A9DB479626B415E9776b28920fc003265a3',
      ArnaconResolver: '0xF9A6374ccA77E40434504E8005ed440631B3E9B7',
      ProductsNFT: '0x32a3fBa0b3547101D9Df67F8c63bbf1cDB287752',
      SemaphoreInteractor: '0x55C87c71F49493d4BB3B78cFD26c79da8be16C0c',
      SemaphoreInteractor_DeployBlock: '83790214',
    });
    console.log('[chain] SDK SemaphoreInteractor:', sdk.getContractAddress('SemaphoreInteractor'));
  }
  return { sdk, bucket };
}

// ─── Startup guard ────────────────────────────────────────────────────────────

function setupOrExit() {
  if (!PRIVATE_KEY) {
    console.error('[chain] Missing COORDINATES environment variable');
    process.exit(1);
  }
}

// ─── GCS number allocation ────────────────────────────────────────────────────

/**
 * Atomically take the next available phone number from GCS numbers.json.
 * Uses generation precondition to prevent concurrent allocation races.
 */
async function takeNextNumber() {
  const { bucket: b } = getContext();
  const file = b.file(NUMBERS_FILE);

  const [metadata] = await file.getMetadata();
  const generation = metadata.generation;

  const [content] = await file.download();
  const numbers = JSON.parse(content.toString());

  if (numbers.length === 0) return null;

  const index = Math.floor(Math.random() * numbers.length);
  const label = numbers[index];
  numbers.splice(index, 1);

  await file.save(JSON.stringify(numbers), {
    contentType: 'application/json',
    preconditionOpts: { ifGenerationMatch: generation },
  });

  return label;
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

// ─── Action handlers ──────────────────────────────────────────────────────────

async function handlePurchase(req, res) {
  const body = req.body || {};
  if (!validatePurchase(body)) {
    return res.status(400).json({ error: `Invalid request: ${schemaError(validatePurchase)}` });
  }

  const { sdk: s } = getContext();
  let label;
  try {
    label = await takeNextNumber();
  } catch (err) {
    if (err.code === 412) {
      return res.status(409).json({ error: 'Concurrent purchase conflict, please retry' });
    }
    throw err;
  }

  if (!label) {
    return res.status(409).json({ error: 'No numbers available' });
  }

  try {
    console.log(`[chain] purchasing number: ${label}`);
    const result = await s.insertCommitment(label);
    console.log(`[chain] purchase complete — tx: ${result.transactionHash}`);
    return res.json({ label, userSecret: result.userSecret });
  } catch (err) {
    console.error('[chain] purchase error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

async function handleExpire(req, res) {
  const body = req.body || {};
  if (!validateExpire(body)) {
    return res.status(400).json({ error: `Invalid request: ${schemaError(validateExpire)}` });
  }

  const { sdk: s } = getContext();
  const { label } = body;
  const expirySeconds = Math.floor(Date.now() / 1000);

  try {
    console.log(`[chain] setting expiry for label: ${label} (${expirySeconds})`);
    const result = await s.setExpiry(ENS_NAME, label, expirySeconds);
    console.log(`[chain] expiry set — ${result.fullDomain || label}`);
    return res.json({ label, expiry: expirySeconds, name: result.name, fullDomain: result.fullDomain });
  } catch (err) {
    console.error('[chain] expire error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

async function handleActivate(req, res) {
  const body = req.body || {};
  if (!validateActivate(body)) {
    return res.status(400).json({ error: `Invalid request: ${schemaError(validateActivate)}` });
  }

  const { sdk: s } = getContext();
  const { userSecret, label, owner } = body;

  console.log(`[chain] activating label: ${label} for ${owner}`);

  let result = {};
  try {
    result = await s.registerWithProof(userSecret, label, ENS_NAME, owner);
    console.log(`[chain] activation complete — tx: ${result.transactionHash}`);
  } catch (err) {
    // Blockchain tx is best-effort — always return success so the client works.
    // Any failure is logged for manual follow-up.
    console.error(`[chain] activation error (non-fatal, manual follow-up required): ${err.message}`);
  }

  // Notification is best-effort — never fail the activate response over it.
  try {
    const notificationService = new NotificationService();
    await notificationService.send({
      walletAddress: owner,
      selectedName: `${label}.${ENS_NAME}`,
      package_type: 'SECNUM',
    });
  } catch (err) {
    console.warn(`[chain] notification failed (non-fatal): ${err.message}`);
  }

  return res.json({
    label: result.label ?? label,
    owner: result.owner ?? owner,
    name: result.name ?? `${label}.${ENS_NAME}`,
  });
}

/**
 * Returns all Semaphore group commitments and the REGISTER_SCOPE constant.
 * Called by the frontend before generating a ZK proof client-side.
 */
async function handleGetGroupMembers(req, res) {
  try {
    const { sdk: s } = getContext();
    const commitments = await s.getGroupMembers();
    console.log(`[chain] getGroupMembers: ${commitments.length} members`);
    return res.json({
      commitments,
      scope: '1',
    });
  } catch (err) {
    console.error('[chain] getGroupMembers error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Submits a pre-generated ZK proof to the contract.
 * Proof is generated client-side; server only submits the transaction.
 */
async function handleActivateWithProof(req, res) {
  const body = req.body || {};
  if (!validateActivateWithProof(body)) {
    return res.status(400).json({ error: `Invalid request: ${schemaError(validateActivateWithProof)}` });
  }

  const { proof, label, owner } = body;
  console.log(`[chain] activateWithProof label: ${label} for ${owner}`);

  try {
    const { sdk: s } = getContext();
    const si = s.semaphore._getSemaphoreInteractor();
    const tx = await s.semaphore.deploymentManager.executeTransaction(
      si,
      'registerSubnodeWithProof',
      [proof, owner, ENS_NAME],
      'Registering subnode with pre-generated ZK proof',
    );
    console.log(`[chain] activateWithProof complete — tx: ${tx.hash}`);
  } catch (err) {
    console.error(`[chain] activateWithProof error (non-fatal, manual follow-up required): ${err.message}`);
  }

  try {
    const notificationService = new NotificationService();
    await notificationService.send({
      walletAddress: owner,
      selectedName: `${label}.${ENS_NAME}`,
      package_type: 'SECNUM',
    });
  } catch (err) {
    console.warn(`[chain] notification failed (non-fatal): ${err.message}`);
  }

  return res.json({
    label,
    owner,
    name: `${label}.${ENS_NAME}`,
  });
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  setupOrExit,
  handlePurchase,
  handleExpire,
  handleActivate,
  handleGetGroupMembers,
  handleActivateWithProof,
  setCors,
};
