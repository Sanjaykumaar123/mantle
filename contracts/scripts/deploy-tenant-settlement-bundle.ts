import fs from "fs";
import path from "path";
import { ethers } from "hardhat";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const factoryAddress = requiredEnv("TENANT_FACTORY_ADDRESS");
  const owner = requiredEnv("TENANT_OWNER_ADDRESS");
  const settlementAsset = requiredEnv("SETTLEMENT_ASSET_ADDRESS");

  console.log(`Deploying tenant settlement bundle with: ${deployer.address}`);
  console.log(`Tenant owner: ${owner}`);
  console.log(`Settlement asset: ${settlementAsset}`);
  console.log(`TenantFactory: ${factoryAddress}`);

  const factory = await ethers.getContractAt("TenantFactory", factoryAddress);
  const tx = await factory.createTenantSettlementBundle(owner, settlementAsset);
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("Missing transaction receipt.");
  }

  const parsed = receipt.logs
    .map((log) => {
      try {
        return factory.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event) => event?.name === "TenantSettlementBundleCreated");

  if (!parsed) {
    throw new Error("TenantSettlementBundleCreated event not found.");
  }

  const [, eventSettlementAsset, token, disclosureRegistry, transferController, auditAnchor, settlementVault] = parsed.args;
  const network = await ethers.provider.getNetwork();
  const output = {
    network: "arbitrumSepolia",
    chainId: Number(network.chainId),
    deployer: deployer.address,
    owner,
    factory: factoryAddress,
    txHash: receipt.hash,
    contracts: {
      settlementAsset: eventSettlementAsset,
      confidentialRwaToken: token,
      disclosureRegistry,
      transferController,
      auditAnchor,
      settlementVault,
    },
    timestamp: new Date().toISOString(),
  };

  const outputPath = path.resolve(__dirname, "..", "deployments", `tenantSettlementBundle.${owner}.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);

  console.log(JSON.stringify(output, null, 2));
  console.log("Deployment file:", outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
