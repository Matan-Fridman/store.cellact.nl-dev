/**
 * Cloud Function — provider setup.
 *
 * Receives a JSON describing a new service provider, then:
 *   1. Creates a fresh wallet
 *   2. Sends INITIAL_PALO_GRANT PALO from the server wallet (welcome grant)
 *   3. Registers as domain owner  — deploys SecondLevelInteractor, ArnaconResolver,
 *                                    SecondLevelController (ENS infrastructure)
 *   4. Registers as service provider — registers on the ServiceProviderRegistry
 *                                      (uploads metadata to IPFS, costs PALO)
 *   5. Purchases the ENS domain name
 *   6. Creates the service — uploads metadata to IPFS, costs PALO
 *   7. Registers the service for the domain — signs off-chain, submits on-chain
 *
 * Gas note:
 *   The SDK handles gas sponsorship internally — the new wallet does not need
 *   native tokens to execute transactions.
 *
 * Environment variables:
 *   CHAIN_ID          — chain ID or RPC URL passed to arnacon-sdk (required)
 *   SERVER_PRIVATE_KEY — funded server wallet private key (required, from Secret Manager)
 *   RPC_URL           — optional RPC URL override
 *
 * Request body:
 * {
 *   "name":          string   // ENS label, e.g. "mycompany"
 *   "providerInfo":  object   // { displayName, description?, website? }
 *   "service": {
 *     "serviceName":       string  // unique service ID, e.g. "secnum_number"
 *     "name":              string  // display name
 *     "description":       string
 *     "clientUrl":         string
 *     "image":             string  // optional
 *     "productIdentifier": string  // e.g. "SECNUM"
 *     "servicePrice":      number  // PALO tokens
 *     "duration":          number  // seconds
 *     "contractAddress":   string  // 0x...
 *   }
 *   "durationInDays": number  // optional, default 365
 * }
 */

'use strict';

require('dotenv').config();

const functions  = require('@google-cloud/functions-framework');
const { ethers } = require('ethers');
const ArnaconSDK = require('arnacon-sdk');
const { createSponsorAndEmitMetaTx, createSponsorAndEmitMetaDeploy } = require("arnacon-sponsor-wrapper");
const Ajv        = require('ajv');

// ─── Config ───────────────────────────────────────────────────────────────────

const INITIAL_PALO_GRANT = 50;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`[provider-setup] Required env var ${name} is not set`);
  return value;
}

function getConfig() {
  return {
    chainId:          requireEnv('CHAIN_ID'),
    serverPrivateKey: requireEnv('SERVER_PRIVATE_KEY'),
    rpcUrl:           process.env.RPC_URL || null,
  };
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const ajv = new Ajv({ allErrors: true });

const SETUP_SCHEMA = {
  type: 'object',
  required: ['name', 'providerInfo', 'service'],
  additionalProperties: true,
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      pattern: '^[a-z0-9-]+$',
    },
    providerInfo: {
      type: 'object',
      required: ['displayName'],
      additionalProperties: true,
      properties: {
        displayName: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        website:     { type: 'string' },
      },
    },
    service: {
      type: 'object',
      required: ['serviceName', 'name', 'description', 'clientUrl', 'productIdentifier', 'servicePrice', 'duration', 'contractAddress'],
      additionalProperties: false,
      properties: {
        serviceName:       { type: 'string', minLength: 1 },
        name:              { type: 'string', minLength: 1 },
        description:       { type: 'string', minLength: 1 },
        clientUrl:         { type: 'string', minLength: 1 },
        image:             { type: 'string', minLength: 1 },
        productIdentifier: { type: 'string', minLength: 1 },
        servicePrice:      { type: 'number', minimum: 0 },
        duration:          { type: 'number', minimum: 1 },
        contractAddress:   { type: 'string', pattern: '^0x[0-9a-fA-F]{40}$' },
      },
    },
    durationInDays: { type: 'number', minimum: 1, default: 365 },
  },
};

const validateSetup = ajv.compile(SETUP_SCHEMA);

// ─── CORS ─────────────────────────────────────────────────────────────────────

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

// ─── SDK ──────────────────────────────────────────────────────────────────────

function initSdk(privateKey, config) {
  const sdk = new ArnaconSDK({
    privateKey,
    ...(config.chainId && { chainId: parseInt(config.chainId) }),
    ...(config.rpcUrl  && { rpcUrl: config.rpcUrl }),
  });
  console.log("sdk: ", sdk.getAllContractAddresses())

  if (config.setCustomFunctions === true){
    const executeFunction = createSponsorAndEmitMetaTx({
      privateKey
    });
    const deployFunction = createSponsorAndEmitMetaDeploy({
      privateKey
    });
    sdk.setExecuteFunction(executeFunction);
    sdk.setDeployFunction(deployFunction);
  }
  return sdk;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

async function handleProviderSetup(req, res) {
  // Validate env at request time so startup never throws
  let config;
  try {
    config = getConfig();
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: err.message });
  }

  const body = req.body || {};

  if (!validateSetup(body)) {
    return res.status(400).json({ error: `Invalid request: ${ajv.errorsText(validateSetup.errors)}` });
  }

  const { name, providerInfo, service, durationInDays = 365 } = body;
  const {
    serviceName,
    name:              serviceDisplayName,
    description:       serviceDescription,
    clientUrl,
    image,
    productIdentifier,
    servicePrice,
    duration,
    contractAddress,
  } = service;

  const serviceMetadata = {
    name:        serviceDisplayName,
    description: serviceDescription,
    clientUrl,
    ...(image && { image }),
    productIdentifier,
  };

  // ── Step 1: Create wallet ────────────────────────────────────────────────

  const wallet       = ethers.Wallet.createRandom();
  const newAddress   = wallet.address;
  const newPrivateKey = wallet.privateKey;

  console.log(`[provider-setup] Created wallet ${newAddress} for SP "${name} with private key ${newPrivateKey}"`);

  // ── Step 2: PALO welcome grant ───────────────────────────────────────────

  const serverSdk = initSdk(config.serverPrivateKey, config);

  try {
    const fundsContractAddress = serverSdk.getAllContractAddresses().Palo;
    const paloContract = new ethers.Contract(
      fundsContractAddress,
      ['function balanceOf(address) view returns (uint256)'],
      serverSdk.signer,
    );
    const existing = await paloContract.balanceOf(newAddress);
    const grantBN  = BigInt(INITIAL_PALO_GRANT);

    if (existing < grantBN) {
      const toSend = grantBN - existing;
      console.log(`[provider-setup] Sending ${toSend} PALO to ${newAddress}...`);
      await serverSdk.sendPalo(toSend, newAddress);
      console.log('[provider-setup] PALO sent.');
    } else {
      console.log(`[provider-setup] Wallet already has ${existing} PALO — skipping grant.`);
    }
  } catch (err) {
    console.error(`[provider-setup] PALO grant failed: ${err.message}`);
    return res.status(500).json({ error: 'Failed to send PALO grant', detail: err.message, address: newAddress });
  }
  config.setCustomFunctions = true;
  const sdk = initSdk(newPrivateKey, config);

  // ── Step 3: Register as domain owner ────────────────────────────────────

  let domainOwnerResult;
  try {
    console.log(`[provider-setup] Registering "${name}" as domain owner...`);
    domainOwnerResult = await sdk.registerAsDomainOwner();
    console.log('[provider-setup] Domain owner registered:', domainOwnerResult);
  } catch (err) {
    console.error(`[provider-setup] registerAsDomainOwner failed: ${err.message}`);
    return res.status(500).json({ error: 'Failed to register as domain owner', detail: err.message, address: newAddress });
  }

  // ── Step 4: Register as service provider ────────────────────────────────

  let spResult;
  try {
    console.log('[provider-setup] Registering as service provider...');
    spResult = await sdk.registerAsServiceProvider(providerInfo);
    console.log('[provider-setup] SP registered:', spResult);
  } catch (err) {
    console.error(`[provider-setup] registerAsServiceProvider failed: ${err.message}`);
    return res.status(500).json({ error: 'Domain owner registered but SP registration failed', detail: err.message, address: newAddress, domainOwner: domainOwnerResult });
  }

  // ── Step 5: Purchase domain name ────────────────────────────────────────

  let domainResult;
  try {
    console.log(`[provider-setup] Purchasing domain "${name}" for ${durationInDays} days...`);
    domainResult = await sdk.purchaseName(name, durationInDays);
    console.log('[provider-setup] Domain purchased:', domainResult);
  } catch (err) {
    console.error(`[provider-setup] purchaseName failed: ${err.message}`);
    return res.status(500).json({ error: 'SP registered but domain purchase failed', detail: err.message, address: newAddress, domainOwner: domainOwnerResult, sp: spResult });
  }

  // ── Step 6: Create service ───────────────────────────────────────────────

  let serviceResult;
  try {
    console.log(`[provider-setup] Creating service "${serviceName}"...`);
    serviceResult = await sdk.createService(serviceName, serviceMetadata, servicePrice, duration, contractAddress);
    console.log('[provider-setup] Service created:', serviceResult);
  } catch (err) {
    console.error(`[provider-setup] createService failed: ${err.message}`);
    return res.status(500).json({ error: 'Domain/SP set up but service creation failed', detail: err.message, address: newAddress, domainOwner: domainOwnerResult, sp: spResult, domain: domainResult });
  }

  // ── Step 7: Register service for the domain ──────────────────────────────

  let serviceRegistryResult;
  try {
    console.log(`[provider-setup] Registering service "${serviceName}" on "${name}"...`);
    const sig = await sdk.generateProductRegistrationSignature(serviceName, newAddress, name);
    serviceRegistryResult = await sdk.registerService(serviceName, newAddress, name, sig.timestamp, sig.signature);
    console.log('[provider-setup] Service registered:', serviceRegistryResult);
  } catch (err) {
    console.error(`[provider-setup] registerService failed: ${err.message}`);
    return res.status(500).json({ error: 'Service created but registration failed', detail: err.message, address: newAddress, domainOwner: domainOwnerResult, sp: spResult, domain: domainResult, service: serviceResult });
  }

  // ── Done ─────────────────────────────────────────────────────────────────

  console.log(`[provider-setup] Setup complete for "${name}" (${newAddress})`);

  return res.json({
    address:         newAddress,
    privateKey:      newPrivateKey,
    domainOwner:     domainOwnerResult,
    sp:              spResult,
    domain:          domainResult,
    service:         serviceResult,
    serviceRegistry: serviceRegistryResult,
  });
}

// ─── Exports (for local test server) ─────────────────────────────────────────

module.exports = { handleProviderSetup, setCors };

// ─── Cloud Function entry point ───────────────────────────────────────────────

functions.http('providerSetup', async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  return handleProviderSetup(req, res);
});
