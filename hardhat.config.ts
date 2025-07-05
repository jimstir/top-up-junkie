import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { NetworkUserConfig } from "hardhat/types";

dotenv.config();

// Ensure we have all the environment variables we need
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";

// Helper function to create network config
const createNetworkConfig = (networkName: string, chainId: number, url: string): NetworkUserConfig => ({
  url,
  chainId,
  accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
});

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: createNetworkConfig(
      "sepolia",
      11155111,
      `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    ),
    mainnet: createNetworkConfig(
      "mainnet",
      1,
      `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    ),
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY || undefined,
    token: "ETH",
    gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
  },
  mocha: {
    timeout: 300000, // 300 seconds
  },
} as HardhatUserConfig;

export default config;
