import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const arbitrumSepoliaRpcUrl =
  process.env.ARBITRUM_SEPOLIA_RPC_URL ?? "https://sepolia-rollup.arbitrum.io/rpc";

// Mantle Testnet (Sepolia) – additive, does not affect Arbitrum config
const mantleTestnetRpcUrl =
  process.env.MANTLE_TESTNET_RPC_URL ?? "https://rpc.sepolia.mantle.xyz";

const privateKey = process.env.PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    // ── Existing network – unchanged ──────────────────────────────────────────
    arbitrumSepolia: {
      url: arbitrumSepoliaRpcUrl,
      chainId: 421614,
      accounts: privateKey ? [privateKey] : []
    },
    // ── New: Mantle Testnet ───────────────────────────────────────────────────
    mantleTestnet: {
      url: mantleTestnetRpcUrl,
      chainId: 5003,
      accounts: privateKey ? [privateKey] : []
    }
  }
};

export default config;
