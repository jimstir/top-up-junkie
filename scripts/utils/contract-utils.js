const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Load deployment info for a specific network
 * @param {string} network - Network name (e.g., 'localhost', 'sepolia')
 * @returns {Object} Deployment info object
 */
function loadDeploymentInfo(network) {
  const deploymentsDir = path.join(__dirname, "../../deployments");
  const deploymentPath = path.join(deploymentsDir, `${network}.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`No deployment found for network ${network}`);
  }
  
  return JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
}

/**
 * Get contract instance from deployment info
 * @param {string} contractName - Name of the contract ('topAcc' or 'addService')
 * @param {string} network - Network name
 * @returns {Promise<Contract>} Contract instance
 */
async function getContractInstance(contractName, network) {
  const deployment = loadDeploymentInfo(network);
  const contractInfo = deployment.contracts[contractName];
  
  if (!contractInfo) {
    throw new Error(`No deployment info found for ${contractName} on ${network}`);
  }
  
  const Contract = await hre.ethers.getContractFactory(contractName === 'topAcc' ? 'TopAcc' : 'AddService');
  return Contract.attach(contractInfo.address);
}

/**
 * Get contract ABI
 * @param {string} contractName - Name of the contract ('topAcc' or 'addService')
 * @returns {Array} Contract ABI
 */
function getContractAbi(contractName) {
  const artifactPath = path.join(
    __dirname,
    `../../artifacts/contracts/services/${contractName === 'topAcc' ? 'TopAcc' : 'AddService'}.sol/${contractName === 'topAcc' ? 'TopAcc' : 'AddService'}.json`
  );
  
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Contract artifact not found at ${artifactPath}`);
  }
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  return artifact.abi;
}

/**
 * Get contract addresses for frontend
 * @param {string} network - Network name
 * @returns {Object} Contract addresses
 */
function getContractAddresses(network) {
  try {
    const deployment = loadDeploymentInfo(network);
    return {
      topAcc: deployment.contracts?.topAcc?.address,
      addService: deployment.contracts?.addService?.address,
      network: deployment.network,
      timestamp: deployment.timestamp
    };
  } catch (error) {
    console.warn(`Failed to load contract addresses for ${network}:`, error.message);
    return {
      topAcc: null,
      addService: null,
      network,
      error: error.message
    };
  }
}

module.exports = {
  loadDeploymentInfo,
  getContractInstance,
  getContractAbi,
  getContractAddresses
};
