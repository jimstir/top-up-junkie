// Example usage of TopAcc contract with Chainlink Automation
// This is a TypeScript example for interacting with the contract

import { ethers } from "ethers";

// Contract ABI (simplified for example)
const TOP_ACC_ABI = [
    "function depositFunds() external payable",
    "function withdrawFunds(uint256 amount) external",
    "function setAutopay(uint256 amount, uint256 interval, address serviceProvider) external",
    "function disapproveService() external",
    "function getBalance(address user) external view returns (uint256)",
    "function getAutoPayConfig(address user) external view returns (tuple(bool isActive, uint256 amount, uint256 interval, uint256 lastPayment, address serviceProvider))",
    "function getActiveAutoPayUsers() external view returns (address[])",
    "event AutoPayRegistered(address indexed user, uint256 amount, uint256 interval, address serviceProvider)",
    "event AutoPayExecuted(address indexed user, uint256 amount, address serviceProvider)",
    "event AutoPayDisabled(address indexed user)",
    "event FundsDeposited(address indexed user, uint256 amount)",
    "event FundsWithdrawn(address indexed user, uint256 amount)"
];

export class TopAccService {
    private contract: ethers.Contract;
    private provider: ethers.providers.Provider;
    private signer: ethers.Signer;

    constructor(contractAddress: string, provider: ethers.providers.Provider, signer: ethers.Signer) {
        this.provider = provider;
        this.signer = signer;
        this.contract = new ethers.Contract(contractAddress, TOP_ACC_ABI, signer);
    }

    // Deposit funds to user's balance
    async depositFunds(amount: string): Promise<ethers.ContractTransaction> {
        try {
            const tx = await this.contract.depositFunds({
                value: ethers.utils.parseEther(amount)
            });
            console.log(`Depositing ${amount} ETH... Transaction hash: ${tx.hash}`);
            return tx;
        } catch (error) {
            console.error("Error depositing funds:", error);
            throw error;
        }
    }

    // Withdraw funds from user's balance
    async withdrawFunds(amount: string): Promise<ethers.ContractTransaction> {
        try {
            const tx = await this.contract.withdrawFunds(ethers.utils.parseEther(amount));
            console.log(`Withdrawing ${amount} ETH... Transaction hash: ${tx.hash}`);
            return tx;
        } catch (error) {
            console.error("Error withdrawing funds:", error);
            throw error;
        }
    }

    // Set up autopay for a service
    async setAutopay(
        amount: string,
        intervalDays: number,
        serviceProvider: string
    ): Promise<ethers.ContractTransaction> {
        try {
            const intervalSeconds = intervalDays * 24 * 60 * 60; // Convert days to seconds
            const tx = await this.contract.setAutopay(
                ethers.utils.parseEther(amount),
                intervalSeconds,
                serviceProvider
            );
            console.log(`Setting up autopay: ${amount} ETH every ${intervalDays} days to ${serviceProvider}`);
            console.log(`Transaction hash: ${tx.hash}`);
            return tx;
        } catch (error) {
            console.error("Error setting up autopay:", error);
            throw error;
        }
    }

    // Cancel autopay
    async cancelAutopay(): Promise<ethers.ContractTransaction> {
        try {
            const tx = await this.contract.disapproveService();
            console.log(`Canceling autopay... Transaction hash: ${tx.hash}`);
            return tx;
        } catch (error) {
            console.error("Error canceling autopay:", error);
            throw error;
        }
    }

    // Get user balance
    async getBalance(userAddress: string): Promise<string> {
        try {
            const balance = await this.contract.getBalance(userAddress);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error("Error getting balance:", error);
            throw error;
        }
    }

    // Get autopay configuration
    async getAutoPayConfig(userAddress: string): Promise<any> {
        try {
            const config = await this.contract.getAutoPayConfig(userAddress);
            return {
                isActive: config.isActive,
                amount: ethers.utils.formatEther(config.amount),
                interval: config.interval.toNumber(),
                lastPayment: new Date(config.lastPayment.toNumber() * 1000),
                serviceProvider: config.serviceProvider
            };
        } catch (error) {
            console.error("Error getting autopay config:", error);
            throw error;
        }
    }

    // Get all active autopay users
    async getActiveAutoPayUsers(): Promise<string[]> {
        try {
            return await this.contract.getActiveAutoPayUsers();
        } catch (error) {
            console.error("Error getting active autopay users:", error);
            throw error;
        }
    }

    // Listen for events
    setupEventListeners() {
        // Listen for AutoPayRegistered events
        this.contract.on("AutoPayRegistered", (user, amount, interval, serviceProvider, event) => {
            console.log(`🔔 AutoPay Registered!`);
            console.log(`User: ${user}`);
            console.log(`Amount: ${ethers.utils.formatEther(amount)} ETH`);
            console.log(`Interval: ${interval} seconds`);
            console.log(`Service Provider: ${serviceProvider}`);
            console.log(`Block: ${event.blockNumber}`);
        });

        // Listen for AutoPayExecuted events
        this.contract.on("AutoPayExecuted", (user, amount, serviceProvider, event) => {
            console.log(`💰 AutoPay Executed!`);
            console.log(`User: ${user}`);
            console.log(`Amount: ${ethers.utils.formatEther(amount)} ETH`);
            console.log(`Service Provider: ${serviceProvider}`);
            console.log(`Block: ${event.blockNumber}`);
        });

        // Listen for AutoPayDisabled events
        this.contract.on("AutoPayDisabled", (user, event) => {
            console.log(`🛑 AutoPay Disabled!`);
            console.log(`User: ${user}`);
            console.log(`Block: ${event.blockNumber}`);
        });

        // Listen for FundsDeposited events
        this.contract.on("FundsDeposited", (user, amount, event) => {
            console.log(`💵 Funds Deposited!`);
            console.log(`User: ${user}`);
            console.log(`Amount: ${ethers.utils.formatEther(amount)} ETH`);
            console.log(`Block: ${event.blockNumber}`);
        });

        // Listen for FundsWithdrawn events
        this.contract.on("FundsWithdrawn", (user, amount, event) => {
            console.log(`💸 Funds Withdrawn!`);
            console.log(`User: ${user}`);
            console.log(`Amount: ${ethers.utils.formatEther(amount)} ETH`);
            console.log(`Block: ${event.blockNumber}`);
        });
    }
}

// Example usage
async function main() {
    // Replace with your actual values
    const CONTRACT_ADDRESS = "0x..."; // Your deployed contract address
    const PRIVATE_KEY = "your-private-key"; // Your private key
    const RPC_URL = "https://eth-mainnet.g.alchemy.com/v2/your-api-key"; // RPC URL
    const SERVICE_PROVIDER = "0x..."; // Address of service provider

    // Set up provider and signer
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    // Create service instance
    const topAccService = new TopAccService(CONTRACT_ADDRESS, provider, signer);

    // Set up event listeners
    topAccService.setupEventListeners();

    try {
        // Example workflow
        console.log("🚀 Starting TopAcc example...");

        // 1. Check current balance
        const currentBalance = await topAccService.getBalance(signer.address);
        console.log(`Current balance: ${currentBalance} ETH`);

        // 2. Deposit funds
        const depositTx = await topAccService.depositFunds("1.0");
        await depositTx.wait();
        console.log("✅ Deposit confirmed!");

        // 3. Set up autopay for 0.1 ETH every 30 days
        const autopayTx = await topAccService.setAutopay("0.1", 30, SERVICE_PROVIDER);
        await autopayTx.wait();
        console.log("✅ Autopay setup confirmed!");

        // 4. Check autopay config
        const autopayConfig = await topAccService.getAutoPayConfig(signer.address);
        console.log("📋 Autopay Configuration:", autopayConfig);

        // 5. Get updated balance
        const newBalance = await topAccService.getBalance(signer.address);
        console.log(`New balance: ${newBalance} ETH`);

        console.log("🎉 Example completed successfully!");
        console.log("💡 Your autopay is now active and will be executed by Chainlink Automation!");

    } catch (error) {
        console.error("❌ Error in example:", error);
    }
}

// Uncomment to run the example
// main().catch(console.error);

export default TopAccService;
