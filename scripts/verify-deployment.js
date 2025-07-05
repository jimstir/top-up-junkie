const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = hre.network.name;
  console.log(`Verifying deployment on ${network} network...`);

  // Load deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  const deploymentPath = path.join(deploymentsDir, `${network}.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`No deployment found for network ${network}. Please deploy contracts first.`);
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  if (deploymentInfo.contracts?.topAcc?.address) {
    console.log("\nVerifying TopAcc contract...");
    try {
      await hre.run("verify:verify", {
        address: deploymentInfo.contracts.topAcc.address,
        constructorArguments: [],
      });
      console.log("TopAcc verified successfully!");
    } catch (error) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log("TopAcc already verified");
      } else {
        console.error("Error verifying TopAcc:", error.message);
      }
    }
  }

  if (deploymentInfo.contracts?.addService?.address) {
    console.log("\nVerifying AddService contract...");
    try {
      await hre.run("verify:verify", {
        address: deploymentInfo.contracts.addService.address,
        constructorArguments: [],
      });
      console.log("AddService verified successfully!");
    } catch (error) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log("AddService already verified");
      } else {
        console.error("Error verifying AddService:", error.message);
      }
    }
  }

  console.log("\nDeployment verification complete!");
  console.log("\nDeployment Summary:");
  console.log("------------------");
  console.log(`Network: ${network}`);
  console.log(`Deployer: ${deploymentInfo.deployer || 'N/A'}`);
  
  if (deploymentInfo.contracts?.topAcc?.address) {
    console.log("\nTopAcc:");
    console.log(`  Address: ${deploymentInfo.contracts.topAcc.address}`);
    console.log(`  Explorer: ${getExplorerUrl(network, deploymentInfo.contracts.topAcc.address)}`);
  }
  
  if (deploymentInfo.contracts?.addService?.address) {
    console.log("\nAddService:");
    console.log(`  Address: ${deploymentInfo.contracts.addService.address}`);
    console.log(`  Explorer: ${getExplorerUrl(network, deploymentInfo.contracts.addService.address)}`);
  }
}

function getExplorerUrl(network, address) {
  const explorers = {
    mainnet: `https://etherscan.io/address/${address}`,
    sepolia: `https://sepolia.etherscan.io/address/${address}`,
    goerli: `https://goerli.etherscan.io/address/${address}`,
    polygon: `https://polygonscan.com/address/${address}`,
    mumbai: `https://mumbai.polygonscan.com/address/${address}`,
  };
  
  return explorers[network] || `https://${network}.etherscan.io/address/${address}`;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
