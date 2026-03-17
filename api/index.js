const functions = require('@google-cloud/functions-framework');
const ArnaconSDK = require('arnacon-sdk');
const NotificationService = require('./NotificationService');
const fs = require('fs');
const path = require('path');

const PRIVATE_KEY = process.env.COORDINATES;
const CHAIN_ID = process.env.CHAIN_ID || '137';
const ENS_NAME = process.env.ENS_NAME || 'esimera';
const STORE_ORIGIN = process.env.STORE_ORIGIN || 'https://store.esimera.com';

if (!PRIVATE_KEY) {
  console.error('Missing COORDINATES environment variable');
  process.exit(1);
}

const sdk = new ArnaconSDK(PRIVATE_KEY, CHAIN_ID);

const NUMBERS_SOURCE = path.join(__dirname, 'numbers.txt');
const NUMBERS_FILE = path.join('/tmp', 'numbers.txt');

function ensureNumbersFile() {
  if (!fs.existsSync(NUMBERS_FILE)) {
    fs.copyFileSync(NUMBERS_SOURCE, NUMBERS_FILE);
  }
}

function readNumbers() {
  ensureNumbersFile();
  const content = fs.readFileSync(NUMBERS_FILE, 'utf-8').trim();
  if (!content) return [];
  return content.split('\n').map((n) => n.trim()).filter(Boolean);
}

function writeNumbers(numbers) {
  fs.writeFileSync(NUMBERS_FILE, numbers.join('\n') + '\n', 'utf-8');
}

function takeNextNumber() {
  const numbers = readNumbers();
  if (numbers.length === 0) return null;
  const label = numbers.shift();
  writeNumbers(numbers);
  return label;
}

function buildClaimUrl(userSecret, label) {
  const claimPage = `${STORE_ORIGIN}/claim?secret=${encodeURIComponent(userSecret)}&label=${encodeURIComponent(label)}`;
  return `arnacon://install?url=${encodeURIComponent(claimPage)}&provider=eSIMera`;
}

async function handlePurchase(req, res) {
  const { label } = req.body;

  if (!label || typeof label !== 'string' || !label.trim()) {
    return res.status(400).json({ error: 'Missing required field: label (phone number)' });
  }

  try {
    console.log(`\nPurchasing number: ${label}`);
    const result = await sdk.insertCommitment(label);
    console.log(`Purchase complete — tx: ${result.transactionHash}`);

    const claimUrl = buildClaimUrl(result.userSecret, label);

    res.json({ claimUrl });
  } catch (err) {
    console.error('Purchase error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

async function handleActivate(req, res) {
  const { userSecret, label, owner } = req.body;

  if (!userSecret || !label || !owner) {
    return res
      .status(400)
      .json({ error: 'Missing required fields: userSecret, label, owner' });
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(owner)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  try {
    console.log(`\nActivating number: ${label} for ${owner}`);
    const result = await sdk.registerWithProof(
      userSecret,
      label,
      ENS_NAME,
      owner,
    );
    console.log(`Activation complete — tx: ${result.transactionHash}`);

    await NotificationService.send({
      walletAddress: owner,
      selectedName: label + '.' + ENS_NAME,
      package_type: 'ESIMERA'
    });

    res.json({
      label: result.label,
      owner: result.owner,
      name: result.name,
    });
  } catch (err) {
    console.error('Activation error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

functions.http('main', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  const { action } = req.body;

  if (action === 'purchase') {
    return handlePurchase(req, res);
  } else if (action === 'activate') {
    return handleActivate(req, res);
  } else {
    return res
      .status(400)
      .json({ error: 'Invalid action. Use "purchase" or "activate"' });
  }
});
