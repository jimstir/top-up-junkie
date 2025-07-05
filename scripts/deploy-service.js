const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying AddService contract with the account:", deployer.address);

  // Load deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  const deploymentPath = path.join(deploymentsDir, `${hre.network.name}.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`No deployment found for network ${hre.network.name}. Please deploy TopAcc first.`);
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  // Deploy AddService
  console.log("Deploying AddService...");
  const AddService = await hre.ethers.getContractFactory("AddService");
  const addService = await AddService.deploy();
  await addService.deployed();
  
  console.log(`AddService deployed to: ${addService.address}`);
  
  // Verify contract on Etherscan if not on local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await addService.deployTransaction.wait(6);
    
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: addService.address,
        constructorArguments: [],
      });
    } catch (error) {
      console.error("Verification failed but continuing:", error.message);
    }
  }
  
  // Update deployment info
  deploymentInfo.addService = {
    address: addService.address,
    abi: JSON.parse(addService.interface.format("json")),
    deployTx: addService.deployTransaction.hash
  };
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Updated deployment info saved to:", deploymentPath);
  
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
