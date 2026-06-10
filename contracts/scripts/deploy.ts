import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = (await ethers.provider.getNetwork()).chainId;
  console.log(`Deploying with: ${deployer.address}`);
  console.log(`Network:        ${network.name} (chainId: ${chainId})`);

  // ── Existing contracts – unchanged ───────────────────────────────────────
  const tokenFactory = await ethers.getContractFactory("ConfidentialRWAToken");
  const token = await tokenFactory.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  const disclosureFactory = await ethers.getContractFactory("DisclosureRegistry");
  const disclosureRegistry = await disclosureFactory.deploy();
  await disclosureRegistry.waitForDeployment();
  const disclosureAddress = await disclosureRegistry.getAddress();

  const controllerFactory = await ethers.getContractFactory("TransferController");
  const transferController = await controllerFactory.deploy(tokenAddress, disclosureAddress);
  await transferController.waitForDeployment();
  const controllerAddress = await transferController.getAddress();

  const auditFactory = await ethers.getContractFactory("AuditAnchor");
  const auditAnchor = await auditFactory.deploy(deployer.address);
  await auditAnchor.waitForDeployment();
  const auditAddress = await auditAnchor.getAddress();

  // ── New: AIScoreAnchor – Mantle Turing Test compliance ───────────────────
  const aiScoreFactory = await ethers.getContractFactory("AIScoreAnchor");
  const aiScoreAnchor = await aiScoreFactory.deploy(deployer.address);
  await aiScoreAnchor.waitForDeployment();
  const aiScoreAddress = await aiScoreAnchor.getAddress();

  // Create JSON artifact (Requirement 2)
  const isMantle = chainId === 5003n || chainId === 5003 || network.name === "mantleTestnet";
  const deploymentFilename = isMantle ? "mantle-testnet.json" : `${network.name}.json`;
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentData = {
    network: isMantle ? "mantleTestnet" : network.name,
    chainId: Number(chainId),
    deployer: deployer.address,
    ConfidentialRWAToken: tokenAddress,
    DisclosureRegistry: disclosureAddress,
    TransferController: controllerAddress,
    AuditAnchor: auditAddress,
    AIScoreAnchor: aiScoreAddress
  };

  const deploymentFilePath = path.join(deploymentsDir, deploymentFilename);
  fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentData, null, 2), "utf8");

  // Auto-update environment file (Requirement 3)
  let envWarning = "";
  const envPath = path.join(__dirname, "../.env");

  if (fs.existsSync(envPath)) {
    try {
      let envContent = fs.readFileSync(envPath, "utf8");
      
      const updates: { [key: string]: string } = isMantle ? {
        "MANTLE_TESTNET_DEPLOYER": deployer.address,
        "MANTLE_TESTNET_CONFIDENTIAL_RWA_TOKEN": tokenAddress,
        "MANTLE_TESTNET_DISCLOSURE_REGISTRY": disclosureAddress,
        "MANTLE_TESTNET_TRANSFER_CONTROLLER": controllerAddress,
        "MANTLE_TESTNET_AUDIT_ANCHOR": auditAddress,
        "MANTLE_TESTNET_AI_SCORE_ANCHOR": aiScoreAddress,
      } : {
        "ARBITRUM_SEPOLIA_DEPLOYER": deployer.address,
        "ARBITRUM_SEPOLIA_CONFIDENTIAL_RWA_TOKEN": tokenAddress,
        "ARBITRUM_SEPOLIA_DISCLOSURE_REGISTRY": disclosureAddress,
        "ARBITRUM_SEPOLIA_TRANSFER_CONTROLLER": controllerAddress,
        "ARBITRUM_SEPOLIA_AUDIT_ANCHOR": auditAddress,
      };

      for (const [key, val] of Object.entries(updates)) {
        const regex = new RegExp(`^\\s*${key}\\s*=\\s*(.*)$`, "m");
        const match = envContent.match(regex);
        
        if (match) {
          const currentValue = match[1].trim();
          // Only replace if empty
          if (!currentValue) {
            envContent = envContent.replace(regex, `${key}=${val}`);
          }
        } else {
          // If the key doesn't exist, append it
          envContent += `\n${key}=${val}`;
        }
      }

      fs.writeFileSync(envPath, envContent, "utf8");
    } catch (err: any) {
      envWarning = `Warning: Could not update .env file: ${err.message}`;
    }
  } else {
    envWarning = "Warning: .env file not found in contracts directory.";
  }

  // Print console summary (Requirement 4)
  if (isMantle) {
    console.log("==============================");
    console.log("Mantle Deployment Complete");
    console.log("\nNetwork:");
    console.log("Mantle Sepolia Testnet");
    console.log("\nChain ID:");
    console.log("5003");
    console.log("\nDeployer:");
    console.log(deployer.address);
    console.log("\nConfidentialRWAToken:");
    console.log(tokenAddress);
    console.log("\nDisclosureRegistry:");
    console.log(disclosureAddress);
    console.log("\nTransferController:");
    console.log(controllerAddress);
    console.log("\nAuditAnchor:");
    console.log(auditAddress);
    console.log("\nAIScoreAnchor:");
    console.log(aiScoreAddress);
    console.log("\nDeployment file:");
    console.log(`contracts/deployments/${deploymentFilename}`);
    if (envWarning) {
      console.log(`\n${envWarning}`);
    } else {
      console.log("\nEnvironment updated successfully.");
    }
    console.log("==============================");
  } else {
    console.log("Deployment completed successfully on", network.name);
    console.log("ConfidentialRWAToken:", tokenAddress);
    console.log("DisclosureRegistry:  ", disclosureAddress);
    console.log("TransferController:  ", controllerAddress);
    console.log("AuditAnchor:         ", auditAddress);
    console.log("AIScoreAnchor:       ", aiScoreAddress);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

