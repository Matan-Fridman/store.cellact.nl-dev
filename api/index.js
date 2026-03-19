const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const ArnaconSDK = require('arnacon-sdk');
const NotificationService = require('./NotificationService');

const PRIVATE_KEY = process.env.COORDINATES;
const CHAIN_ID = process.env.CHAIN_ID || '137';
const ENS_NAME = process.env.ENS_NAME || 'secnum';
const STORE_ORIGIN = process.env.STORE_ORIGIN || 'https://esimera-store.vercel.app';
const BUCKET_NAME = process.env.BUCKET_NAME || 'secnum-numbers';
const NUMBERS_FILE = 'numbers.json';

if (!PRIVATE_KEY) {
  console.error('Missing COORDINATES environment variable');
  process.exit(1);
}

const sdk = new ArnaconSDK(PRIVATE_KEY, CHAIN_ID);
const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);

sdk.setContractAddresses({
    SecondLevelController: "0x0A8b08435d7Ee515308e4D9885e83C5B442A446b",
    SecondLevelInteractor: "0xac9A8A9DB479626B415E9776b28920fc003265a3",
    ArnaconResolver: "0xF9A6374ccA77E40434504E8005ed440631B3E9B7",
    ProductsNFT: "0x32a3fBa0b3547101D9Df67F8c63bbf1cDB287752",
    SemaphoreInteractor: "0x55C87c71F49493d4BB3B78cFD26c79da8be16C0c",
    SemaphoreInteractor_DeployBlock: "83790214"
});

console.log("SDK version check - SemaphoreInteractor:", sdk.getContractAddress("SemaphoreInteractor"));
console.log("All addresses:", sdk.getAllContractAddresses());

async function takeNextNumber() {
  const file = bucket.file(NUMBERS_FILE);

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

function buildClaimUrl(userSecret, label) {
  const claimPage = `${STORE_ORIGIN}/claim?secret=${encodeURIComponent(userSecret)}&label=${encodeURIComponent(label)}`;
  return `arnacon://install?url=${encodeURIComponent(claimPage)}&provider=Secnum`;
}

async function handlePurchase(_req, res) {
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

    const notificationService = new NotificationService();

    await notificationService.send({
      walletAddress: owner,
      selectedName: label + '.' + ENS_NAME,
      package_type: 'SECNUM'
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
  }
  if (action === 'activate') {
    return handleActivate(req, res);
  }
  return res
    .status(400)
    .json({ error: 'Invalid action. Use "purchase" or "activate"' });
});