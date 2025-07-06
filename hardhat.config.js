require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();
require('@typechain/hardhat');
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-etherscan');
require('hardhat-gas-reporter');
require('solidity-coverage');
require('./tasks/testFlow');

// Ensure we have all the environment variables we need
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";

// Helper function to create network config
const createNetworkConfig = (networkName, chainId, url) => ({
  url: url || `https://eth-${networkName}.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
  chainId,
  accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
  gas: 2100000,
  gasPrice: 8000000000,
});

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8546",
      chainId: 31337,
    },
    sepolia: createNetworkConfig("sepolia", 11155111, `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`),
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY,
    token: "ETH",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};
