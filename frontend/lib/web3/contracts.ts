import auditAnchorAbiJson from "@/lib/web3/abi/audit-anchor.json";
import confidentialRwaTokenAbiJson from "@/lib/web3/abi/confidential-rwa-token.json";
import disclosureRegistryAbiJson from "@/lib/web3/abi/disclosure-registry.json";
import rwaUsdAbiJson from "@/lib/web3/abi/rwausd.json";
import settlementVaultAbiJson from "@/lib/web3/abi/settlement-vault.json";
import tenantFactoryAbiJson from "@/lib/web3/abi/tenant-factory.json";
import transferControllerAbiJson from "@/lib/web3/abi/transfer-controller.json";

type HexAddress = `0x${string}`;
export type CoreContractName =
  | "confidentialRwaToken"
  | "disclosureRegistry"
  | "transferController"
  | "auditAnchor";
export type ContractName = CoreContractName | "tenantFactory" | "settlementVault" | "rwaUsd";

type AbiItem = {
  type: string;
  name?: string;
  inputs?: AbiParam[];
  outputs?: AbiParam[];
  stateMutability?: string;
  anonymous?: boolean;
};

type AbiParam = {
  name: string;
  type: string;
  internalType?: string;
  indexed?: boolean;
  components?: AbiParam[];
};

type ConfigValidation = {
  ok: boolean;
  missing: string[];
  invalid: string[];
};

const DEFAULTS = {
  chainId: "5003",
  rpcUrl: "https://rpc.sepolia.mantle.xyz",
  addresses: {
    confidentialRwaToken: "0xED6f42b6129c13c0940043d0d7eaD700dd007756",
    disclosureRegistry: "0x58c6f0792738e2A039B190714C2da12C787a20Ef",
    transferController: "0x7C74B0175235A221a5A84a9A5756A74e1ccF5dE4",
    auditAnchor: "0x90756BE272C8CB4a53a4A92117cA59dA92eC22C3",
  },
} as const;

// ── Mantle Testnet defaults (additive – populated after deployment) ───────────
export const MANTLE_TESTNET_CHAIN_ID = "5003";
export const MANTLE_TESTNET_RPC_URL  = "https://rpc.sepolia.mantle.xyz";

/** Returns true when the app is configured to run against Mantle Testnet. */
export function isMantleNetwork(): boolean {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID?.trim();
  return chainId === MANTLE_TESTNET_CHAIN_ID;
}

function readEnv(name: string, fallback: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  return value.trim();
}

function readOptionalEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function isHexAddress(value: string): value is HexAddress {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isChainId(value: string): boolean {
  return /^[0-9]+$/.test(value);
}

export const chainConfig = {
  chainId: readEnv("NEXT_PUBLIC_CHAIN_ID", DEFAULTS.chainId),
  rpcUrl: readEnv("NEXT_PUBLIC_RPC_URL", DEFAULTS.rpcUrl),
} as const;

export const contractAddresses: Record<CoreContractName, HexAddress> = {
  confidentialRwaToken: readEnv(
    "NEXT_PUBLIC_CONTRACT_CONFIDENTIAL_RWA_TOKEN",
    DEFAULTS.addresses.confidentialRwaToken,
  ) as HexAddress,
  disclosureRegistry: readEnv(
    "NEXT_PUBLIC_CONTRACT_DISCLOSURE_REGISTRY",
    DEFAULTS.addresses.disclosureRegistry,
  ) as HexAddress,
  transferController: readEnv(
    "NEXT_PUBLIC_CONTRACT_TRANSFER_CONTROLLER",
    DEFAULTS.addresses.transferController,
  ) as HexAddress,
  auditAnchor: readEnv(
    "NEXT_PUBLIC_CONTRACT_AUDIT_ANCHOR",
    DEFAULTS.addresses.auditAnchor,
  ) as HexAddress,
};

const tenantFactoryEnvValue = readOptionalEnv("NEXT_PUBLIC_CONTRACT_TENANT_FACTORY");

export const tenantFactoryAddress: HexAddress | null = isHexAddress(tenantFactoryEnvValue)
  ? tenantFactoryEnvValue
  : null;

export const tenantFactoryEnvConfigured = tenantFactoryEnvValue.length > 0;
export const tenantFactoryEnvInvalid = tenantFactoryEnvConfigured && !tenantFactoryAddress;

export const MANAGED_CONTRACT_LABEL = isMantleNetwork()
  ? "Managed global demo contracts (Mantle Sepolia)"
  : "Managed global demo contracts (Mantle Sepolia)";

export function getManagedContractAddresses(): Record<CoreContractName, HexAddress> {
  return {
    confidentialRwaToken: contractAddresses.confidentialRwaToken,
    disclosureRegistry: contractAddresses.disclosureRegistry,
    transferController: contractAddresses.transferController,
    auditAnchor: contractAddresses.auditAnchor,
  };
}

const abiMap: Record<ContractName, AbiItem[]> = {
  confidentialRwaToken: confidentialRwaTokenAbiJson as AbiItem[],
  disclosureRegistry: disclosureRegistryAbiJson as AbiItem[],
  transferController: transferControllerAbiJson as AbiItem[],
  rwaUsd: rwaUsdAbiJson as AbiItem[],
  settlementVault: settlementVaultAbiJson as AbiItem[],
  auditAnchor: auditAnchorAbiJson as AbiItem[],
  tenantFactory: tenantFactoryAbiJson as AbiItem[],
};

export function getContractAbi(name: ContractName): AbiItem[] {
  return abiMap[name];
}

export function validatePublicWeb3Config(): ConfigValidation {
  const missing: string[] = [];
  const invalid: string[] = [];
  const requiredKeys = [
    "NEXT_PUBLIC_CHAIN_ID",
    "NEXT_PUBLIC_RPC_URL",
    "NEXT_PUBLIC_CONTRACT_CONFIDENTIAL_RWA_TOKEN",
    "NEXT_PUBLIC_CONTRACT_DISCLOSURE_REGISTRY",
    "NEXT_PUBLIC_CONTRACT_TRANSFER_CONTROLLER",
    "NEXT_PUBLIC_CONTRACT_AUDIT_ANCHOR",
  ];

  for (const key of requiredKeys) {
    if (!process.env[key] || process.env[key]?.trim().length === 0) {
      missing.push(key);
    }
  }

  if (!isChainId(chainConfig.chainId)) {
    invalid.push("NEXT_PUBLIC_CHAIN_ID");
  }
  if (!chainConfig.rpcUrl.startsWith("http")) {
    invalid.push("NEXT_PUBLIC_RPC_URL");
  }

  for (const [key, value] of Object.entries(contractAddresses)) {
    if (!isHexAddress(value)) {
      invalid.push(`NEXT_PUBLIC_CONTRACT_${key.toUpperCase()}`);
    }
  }
  if (tenantFactoryEnvInvalid) {
    invalid.push("NEXT_PUBLIC_CONTRACT_TENANT_FACTORY");
  }

  return { ok: missing.length === 0 && invalid.length === 0, missing, invalid };
}

export function validateRequiredWeb3ConfigInProduction(): ConfigValidation {
  const validation = validatePublicWeb3Config();
  if (process.env.NODE_ENV === "production" && !validation.ok) {
    throw new Error(
      `Invalid web3 public config. Missing: ${validation.missing.join(", ") || "-"} | Invalid: ${
        validation.invalid.join(", ") || "-"
      }`,
    );
  }

  return validation;
}
