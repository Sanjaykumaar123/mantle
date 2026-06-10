import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, createStorage, noopStorage } from "@wagmi/core";
import { fallback, http } from "viem";
import { arbitrumSepolia } from "wagmi/chains";
import type { Chain } from "viem";

// ── Mantle Testnet chain definition ─────────────────────────────────────────
// Not yet in wagmi/chains – defined inline so Arbitrum import is unchanged.
const mantleSepoliaTestnet = {
  id: 5003,
  name: "Mantle Sepolia Testnet",
  nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.mantle.xyz"] },
    public:  { http: ["https://rpc.sepolia.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "MantleScan", url: "https://sepolia.mantlescan.xyz" },
  },
  testnet: true,
} as const satisfies Chain;

const connectors = connectorsForWallets(
  [
    {
      groupName: "Browser Wallet",
      wallets: [injectedWallet],
    },
  ],
  {
    appName: "AEGIS AI",
    projectId: "injected-only",
  },
);

// ── Arbitrum Sepolia RPC fallbacks (unchanged) ───────────────────────────────
const arbitrumRpcUrls: string[] = [];
if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_RPC_URL) {
  arbitrumRpcUrls.push(process.env.NEXT_PUBLIC_RPC_URL);
}
arbitrumRpcUrls.push("https://sepolia-rollup.arbitrum.io/rpc");
arbitrumRpcUrls.push("https://arbitrum-sepolia-rpc.publicnode.com");
arbitrumRpcUrls.push("https://arbitrum-sepolia.drpc.org");

// ── Mantle Testnet RPC ───────────────────────────────────────────────────────
const mantleRpcUrls: string[] = [];
if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_MANTLE_RPC_URL) {
  mantleRpcUrls.push(process.env.NEXT_PUBLIC_MANTLE_RPC_URL);
}
mantleRpcUrls.push("https://rpc.sepolia.mantle.xyz");

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia, mantleSepoliaTestnet],
  connectors,
  storage: createStorage({ storage: noopStorage }),
  transports: {
    [arbitrumSepolia.id]:        fallback(arbitrumRpcUrls.map((url) => http(url))),
    [mantleSepoliaTestnet.id]:   fallback(mantleRpcUrls.map((url) => http(url))),
  },
  ssr: true,
});

