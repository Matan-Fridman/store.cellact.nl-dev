import { Identity } from "@semaphore-protocol/identity";
import { generateProof } from "@semaphore-protocol/proof";
import { Group } from "@semaphore-protocol/group";
import { ethers } from "ethers";

export interface ActivationProof {
  merkleTreeDepth: number;
  merkleTreeRoot: string;
  nullifier: string;
  message: string;
  scope: string;
  points: string[];
}

/**
 * Recreates the Semaphore identity the same way ArnaconSDK does:
 *   keccak256(solidityPack(["bytes32", "string"], [userSecret, label]))
 * Must stay in sync with SemaphoreManager.createIdentity in arnacon-sdk.
 */
function createIdentity(userSecret: string, label: string): Identity {
  const identitySecret = ethers.utils.keccak256(
    ethers.utils.solidityPack(["bytes32", "string"], [userSecret, label]),
  );
  return new Identity(identitySecret);
}

/**
 * Generates a Semaphore ZK proof in the browser.
 * SNARK artifacts (~20 MB) are downloaded once from the zk-kit CDN on first call.
 *
 * @param userSecret  - The secret returned by insertCommitment (32-byte hex)
 * @param label       - The phone number label (e.g. "972501234567")
 * @param commitments - All group member commitments (strings) from GET /group-members
 * @param scope       - REGISTER_SCOPE constant from the SemaphoreInteractor contract
 */
export async function generateActivationProof(
  userSecret: string,
  label: string,
  commitments: string[],
  scope: string,
  expectedMerkleTreeRoot?: string,
): Promise<ActivationProof> {
  const identity = createIdentity(userSecret, label);

  const group = new Group();
  for (const c of commitments) {
    group.addMember(BigInt(c));
  }

  if (group.indexOf(identity.commitment) === -1) {
    throw new Error("Activation secret does not match the current claim group");
  }

  const groupRoot = group.root.toString();
  if (expectedMerkleTreeRoot && groupRoot !== expectedMerkleTreeRoot) {
    throw new Error(
      `Claim group root mismatch. Client root ${groupRoot} does not match chain root ${expectedMerkleTreeRoot}`,
    );
  }

  // Encode label the same way the contract does: formatBytes32String → BigNumber → string
  const message = ethers.BigNumber.from(
    ethers.utils.formatBytes32String(label),
  ).toString();

  console.info("[secnum] proof inputs", {
    label,
    commitment: identity.commitment.toString(),
    commitmentIndex: group.indexOf(identity.commitment),
    memberCount: commitments.length,
    groupRoot,
    expectedMerkleTreeRoot,
    scope,
    message,
  });

  const proof = await generateProof(identity, group, message, scope);

  console.info("[secnum] generated proof", {
    merkleTreeDepth: proof.merkleTreeDepth,
    merkleTreeRoot: String(proof.merkleTreeRoot),
    rootMatches: String(proof.merkleTreeRoot) === groupRoot,
    scope: String(proof.scope),
    message: String(proof.message),
    nullifier: String(proof.nullifier),
    pointsLength: proof.points.length,
  });

  return {
    merkleTreeDepth: proof.merkleTreeDepth,
    merkleTreeRoot: String(proof.merkleTreeRoot),
    nullifier: String(proof.nullifier),
    message: String(proof.message),
    scope: String(proof.scope),
    points: proof.points.map(String),
  };
}
