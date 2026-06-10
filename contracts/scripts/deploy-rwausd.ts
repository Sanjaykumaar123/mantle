import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = (await ethers.provider.getNetwork()).chainId;
  console.log(`Deploying RWAUSD with: ${deployer.address}`);
  console.log(`Network:        ${network.name} (chainId: ${chainId})`);

  const rwausdFactory = await ethers.getContractFactory("RWAUSD");
  const rwausd = await rwausdFactory.deploy();
  await rwausd.waitForDeployment();
  const address = await rwausd.getAddress();

  console.log("==============================");
  console.log("RWAUSD deployed to:", address);
  console.log("==============================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
