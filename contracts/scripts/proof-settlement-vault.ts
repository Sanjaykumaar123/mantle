import fs from "node:fs";
import path from "node:path";
import { ethers } from "hardhat";
import { createViemHandleClient } from "@iexec-nox/handle";
import { createWalletClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

async function main() {
  const bundlePath = path.resolve(
    __dirname,
    "..",
    "deployments",
    "tenantSettlementBundle.0x4ee658c5c7e711bfb51ea2a17bbe496be6cb679e.json",
  );
  const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8")) as {
    chainId: number;
    contracts: {
      settlementAsset: string;
      settlementVault: string;
      confidentialRwaToken: string;
    };
  };
  const [deployer] = await ethers.getSigners();
  const privateKey = process.env.PRIVATE_KEY as `0x${string}` | undefined;
  const rpc = process.env.ARBITRUM_SEPOLIA_RPC_URL ?? "https://sepolia-rollup.arbitrum.io/rpc";
  if (!privateKey) {
    throw new Error("Missing PRIVATE_KEY in env.");
  }

  const walletClient = createWalletClient({
    account: privateKeyToAccount(privateKey),
    chain: arbitrumSepolia,
    transport: http(rpc),
  });
  const handleClient = await createViemHandleClient(walletClient);
  const amount = 1_000_000n;

  const settlementAsset = await ethers.getContractAt("RWAUSD", bundle.contracts.settlementAsset, deployer);
  const settlementVault = await ethers.getContractAt("SettlementVault", bundle.contracts.settlementVault, deployer);
  const encrypted = await handleClient.encryptInput(amount, "uint256", bundle.contracts.settlementVault);

  const mintTx = await settlementAsset.mint(deployer.address, amount);
  await mintTx.wait();
  const approveTx = await settlementAsset.approve(bundle.contracts.settlementVault, amount);
  await approveTx.wait();
  const depositTx = await settlementVault.depositAndMint(amount, encrypted.handle, encrypted.handleProof);
  const depositReceipt = await depositTx.wait();

  const output = {
    depositor: deployer.address,
    settlementVault: bundle.contracts.settlementVault,
    confidentialRwaToken: bundle.contracts.confidentialRwaToken,
    settlementAsset: bundle.contracts.settlementAsset,
    amount: amount.toString(),
    mintTx: mintTx.hash,
    approveTx: approveTx.hash,
    depositTx: depositTx.hash,
    depositStatus: depositReceipt?.status ?? null,
  };
  const outputPath = path.resolve(__dirname, "..", "deployments", "proof-settlement-vault-latest.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
