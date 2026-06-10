import fs from "fs";
import path from "path";
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying RWAUSD with: ${deployer.address}`);

  const tokenFactory = await ethers.getContractFactory("RWAUSD");
  const token = await tokenFactory.deploy();
  await token.waitForDeployment();

  const address = await token.getAddress();
  const network = await ethers.provider.getNetwork();
  const output = {
    network: "arbitrumSepolia",
    chainId: Number(network.chainId),
    deployer: deployer.address,
    contracts: {
      RWAUSD: address,
    },
    token: {
      name: "RWAUSD Demo Dollar",
      symbol: "RWAUSD",
      decimals: 6,
      mint: "public testnet faucet only",
    },
    timestamp: new Date().toISOString(),
  };

  const outputPath = path.resolve(__dirname, "..", "deployments", "rwaUsd.arbitrumSepolia.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);

  console.log("RWAUSD:", address);
  console.log("Deployment file:", outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
