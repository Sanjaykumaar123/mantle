import { ethers } from "ethers";

const ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "context",
        "type": "string"
      }
    ],
    "name": "storeAIScore",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "anchorId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLatestRecord",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "score",
            "type": "uint256"
          },
          {
            "internalType": "uint64",
            "name": "timestamp",
            "type": "uint64"
          },
          {
            "internalType": "address",
            "name": "submitter",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "context",
            "type": "string"
          }
        ],
        "internalType": "struct AIScoreAnchor.ScoreRecord",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export interface AnchorRecord {
  score: number;
  txHash: string;
  contractAddress: string;
  timestamp: number;
}

// Global cache to persist transaction hashes across render cycles of the server component.
const globalObj = global as any;
globalObj.aiScoreAnchorsCache = globalObj.aiScoreAnchorsCache || {};

export function getCachedAnchor(context: string): AnchorRecord | null {
  return globalObj.aiScoreAnchorsCache[context] || null;
}

export async function anchorAIScore(score: number, context: string): Promise<AnchorRecord | null> {
  try {
    const chainIdStr = process.env.NEXT_PUBLIC_CHAIN_ID?.trim() || "5003";
    const isMantle = chainIdStr === "5003";

    const rpcUrl = isMantle
      ? (process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.sepolia.mantle.xyz")
      : "https://sepolia-rollup.arbitrum.io/rpc";

    const contractAddress = isMantle
      ? (process.env.MANTLE_TESTNET_AI_SCORE_ANCHOR || "0x74469C9245cF1c283c5ab2c5C51ff376E9b762E1")
      : process.env.ARBITRUM_SEPOLIA_AI_SCORE_ANCHOR;

    if (!contractAddress) {
      console.warn(`[aiScoreAnchor] AIScoreAnchor address is not configured for chain ID ${chainIdStr}. Skipping anchoring.`);
      return null;
    }

    const privateKey = process.env.PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY || "0xe1494a6c95b5a7ef47178318259b1188c6ad880df1d16ee1568394ba4ca87b56";
    if (!privateKey) {
      console.warn(`[aiScoreAnchor] PRIVATE_KEY environment variable is not defined. Skipping anchoring.`);
      return null;
    }

    // Connect provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, ABI, wallet);

    // Call storeAIScore
    const tx = await contract.storeAIScore(score, context);
    const receipt = await tx.wait(1);

    const anchorInfo: AnchorRecord = {
      score,
      txHash: receipt.hash,
      contractAddress,
      timestamp: Date.now(),
    };

    // Store in global memory cache
    globalObj.aiScoreAnchorsCache[context] = anchorInfo;

    // Requirement 6: Log successful anchoring exact format
    console.log(
      `AI Score Anchored\n` +
      `score: ${score}\n` +
      `context: ${context}\n` +
      `txHash: ${receipt.hash}\n` +
      `contract: ${contractAddress}\n` +
      `network: ${isMantle ? "mantleSepolia" : "arbitrumSepolia"}`
    );

    return anchorInfo;
  } catch (error) {
    // Requirement 5: Log error and never crash application
    console.error(`[aiScoreAnchor] Failed to anchor score ${score} for context ${context}:`, error);
    return null;
  }
}
