const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying TopAcc contract...");
  
  // Get the contract factory
  const TopAcc = await hre.ethers.getContractFactory("TopAcc");
  
  // Deploy the contract
  console.log("Deploying TopAcc...");
  const topAcc = await TopAcc.deploy();
  await topAcc.deployed();
  
  console.log(`TopAcc deployed to: ${topAcc.address}`);
  
  // Verify contract on Etherscan if not on local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await topAcc.deployTransaction.wait(6);
    
    console.log("Verifying contract on Etherscan...");
    await hre.run("verify:verify", {
      address: topAcc.address,
      constructorArguments: [],
    });
  }
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    topAcc: {
      address: topAcc.address,
      abi: JSON.parse(topAcc.interface.format("json")),
      deployTx: topAcc.deployTransaction.hash
    },
    timestamp: new Date().toISOString()
  };
  
  const deploymentPath = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("Deployment info saved to:", deploymentPath);
  
  return deploymentInfo;
}

// Handle promise resolution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
