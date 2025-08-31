const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy RewardToken first
  console.log("\nDeploying RewardToken...");
  const RewardToken = await ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy();
  await rewardToken.waitForDeployment();
  
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log("RewardToken deployed to:", rewardTokenAddress);

  // Deploy UptimeMonitor
  console.log("\nDeploying UptimeMonitor...");
  const UptimeMonitor = await ethers.getContractFactory("UptimeMonitor");
  const uptimeMonitor = await UptimeMonitor.deploy(rewardTokenAddress);
  await uptimeMonitor.waitForDeployment();
  
  const uptimeMonitorAddress = await uptimeMonitor.getAddress();
  console.log("UptimeMonitor deployed to:", uptimeMonitorAddress);

  // Add UptimeMonitor as a minter for RewardToken
  console.log("\nAdding UptimeMonitor as minter...");
  await rewardToken.addMinter(uptimeMonitorAddress);
  console.log("UptimeMonitor added as minter");

  // Transfer some tokens to the UptimeMonitor contract for rewards
  console.log("\nTransferring tokens to UptimeMonitor for rewards...");
  const rewardAmount = ethers.parseEther("10000000"); // 10 million tokens
  await rewardToken.transfer(uptimeMonitorAddress, rewardAmount);
  console.log("Transferred", ethers.formatEther(rewardAmount), "tokens to UptimeMonitor");

  console.log("\n=== Deployment Summary ===");
  console.log("RewardToken:", rewardTokenAddress);
  console.log("UptimeMonitor:", uptimeMonitorAddress);
  console.log("Deployer:", deployer.address);
  
  // Save deployment info
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    contracts: {
      RewardToken: rewardTokenAddress,
      UptimeMonitor: uptimeMonitorAddress
    },
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });