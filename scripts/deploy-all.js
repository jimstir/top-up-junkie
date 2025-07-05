const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  // 1. Deploy TopAcc
  console.log("\nDeploying TopAcc...");
  const TopAcc = await hre.ethers.getContractFactory("TopAcc");
  const topAcc = await TopAcc.deploy();
  await topAcc.deployed();
  console.log("TopAcc deployed to:", topAcc.address);

  // 2. Deploy AddService
  console.log("\nDeploying AddService...");
  const AddService = await hre.ethers.getContractFactory("AddService");
  const addService = await AddService.deploy();
  await addService.deployed();
  console.log("AddService deployed to:", addService.address);

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      topAcc: {
        address: topAcc.address,
        abi: JSON.parse(topAcc.interface.format("json")),
        deployTx: topAcc.deployTransaction.hash
      },
      addService: {
        address: addService.address,
        abi: JSON.parse(addService.interface.format("json")),
        deployTx: addService.deployTransaction.hash
      }
    },
    timestamp: new Date().toISOString()
  };

  const deploymentPath = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\nDeployment info saved to:", deploymentPath);
  
  // Verify on Etherscan if not local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations before verification...");
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
    
    console.log("\nVerifying TopAcc on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: topAcc.address,
        constructorArguments: [],
      });
    } catch (error) {
      console.error("Failed to verify TopAcc:", error.message);
    }
    
    console.log("\nVerifying AddService on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: addService.address,
        constructorArguments: [],
      });
    } catch (error) {
      console.error("Failed to verify AddService:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
