import fs from "fs";
import path from "path";
import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = (await ethers.provider.getNetwork()).chainId;
  console.log(`Deploying TenantFactory with: ${deployer.address}`);
  console.log(`Network:        ${network.name} (chainId: ${chainId})`);

  const factoryFactory = await ethers.getContractFactory("TenantFactory");
  const factory = await factoryFactory.deploy();
  await factory.waitForDeployment();

  const address = await factory.getAddress();
  
  const isMantle = chainId === 5003n || chainId === 5003 || network.name === "mantleTestnet";
  const deploymentFilename = isMantle ? "tenantFactory.mantleTestnet.json" : `tenantFactory.${network.name}.json`;
  
  const output = {
    network: isMantle ? "mantleTestnet" : network.name,
    chainId: Number(chainId),
    deployer: deployer.address,
    contracts: {
      TenantFactory: address,
    },
    timestamp: new Date().toISOString(),
  };

  const deploymentsDir = path.resolve(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const outputPath = path.join(deploymentsDir, deploymentFilename);
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);

  console.log("TenantFactory:", address);
  console.log("Deployment file:", outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
