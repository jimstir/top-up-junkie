import { ethers } from "ethers";
import TopAccService from "./TopAccService";

const STORAGE_KEY = 'topAccContract';

interface ContractStorage {
  address: string;
  network: number;
  owner: string;
}

export class ContractManager {
  private static instance: ContractManager;
  private storage: Storage;

  private constructor() {
    this.storage = window.localStorage;
  }

  public static getInstance(): ContractManager {
    if (!ContractManager.instance) {
      ContractManager.instance = new ContractManager();
    }
    return ContractManager.instance;
  }

  public async getOrDeployContract(
    provider: ethers.providers.Web3Provider,
    signer: ethers.Signer
  ): Promise<{ address: string; isNew: boolean }> {
    const stored = this.getStoredContract();
    if (stored) {
      return { address: stored.address, isNew: false };
    }

    // Deploy new contract if none exists
    return this.deployNewContract(provider, signer);
  }

  public getStoredContract(): ContractStorage | null {
    const stored = this.storage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  public async getContractBalance(
    provider: ethers.providers.Web3Provider,
    contractAddress: string
  ): Promise<string> {
    try {
      const balance = await provider.getBalance(contractAddress);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error fetching contract balance:', error);
      throw error;
    }
  }

  private async deployNewContract(
    provider: ethers.providers.Web3Provider,
    signer: ethers.Signer
  ): Promise<{ address: string; isNew: boolean }> {
    try {
      // Use require for JSON imports to avoid TypeScript module resolution issues
      // and type the result as any to bypass strict type checking
      // @ts-ignore - We know the shape of the artifact at runtime
      const TopAccArtifact = require('../artifacts/contracts/TopAcc.sol/TopAcc.json');
      
      if (!TopAccArtifact?.abi || !TopAccArtifact?.bytecode?.object) {
        throw new Error('Invalid contract artifact: missing abi or bytecode');
      }
      
      // Create contract factory with explicit types
      const factory = new ethers.ContractFactory(
        TopAccArtifact.abi as any[],
        TopAccArtifact.bytecode.object as string,
        signer
      );

      // Deploy the contract
      const contract = await factory.deploy();
      await contract.deployed();

      // Store contract details
      const contractData: ContractStorage = {
        address: contract.address,
        network: (await provider.getNetwork()).chainId,
        owner: await signer.getAddress()
      };

      this.storage.setItem(STORAGE_KEY, JSON.stringify(contractData));
      
      return { address: contract.address, isNew: true };
    } catch (error) {
      console.error('Error deploying new contract:', error);
      throw error;
    }
  }

  public clearStoredContract(): void {
    this.storage.removeItem(STORAGE_KEY);
  }
}

export default ContractManager.getInstance();
