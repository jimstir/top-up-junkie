import { ethers } from 'ethers';
import AddServiceArtifact from '../../../artifacts/contracts/services/AddService.sol/AddService.json';

const ADD_SERVICE_CONTRACT_KEY = 'addServiceContract';

export interface AddServiceContractData {
  address: string;
  network: string;
  owner: string;
}

export class AddServiceManager {
  static getStoredContract(): AddServiceContractData | null {
    const stored = localStorage.getItem(ADD_SERVICE_CONTRACT_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  static storeContract(data: AddServiceContractData): void {
    localStorage.setItem(ADD_SERVICE_CONTRACT_KEY, JSON.stringify(data));
  }

  static async deployNewContract(
    provider: ethers.providers.Web3Provider,
    signer: ethers.Signer
  ): Promise<{ address: string; isNew: boolean }> {
    try {
      const factory = new ethers.ContractFactory(
        AddServiceArtifact.abi,
        AddServiceArtifact.bytecode,
        signer
      );

      const contract = await factory.deploy();
      await contract.deployed();

      const network = await provider.getNetwork();
      const owner = await signer.getAddress();

      const contractData: AddServiceContractData = {
        address: contract.address,
        network: network.chainId.toString(),
        owner
      };

      this.storeContract(contractData);
      return { address: contract.address, isNew: true };
    } catch (error) {
      console.error('Error deploying AddService contract:', error);
      throw new Error('Failed to deploy AddService contract');
    }
  }

  static async getOrDeployContract(
    provider: ethers.providers.Web3Provider,
    signer: ethers.Signer
  ): Promise<string> {
    const stored = this.getStoredContract();
    
    if (stored) {
      // Verify the contract exists on the current network
      const network = await provider.getNetwork();
      if (stored.network === network.chainId.toString()) {
        return stored.address;
      }
    }

    // Deploy new contract if none exists or network changed
    const { address } = await this.deployNewContract(provider, signer);
    return address;
  }

  static getContract(
    provider: ethers.providers.Web3Provider,
    address: string
  ): ethers.Contract {
    return new ethers.Contract(
      address,
      AddServiceArtifact.abi,
      provider.getSigner()
    );
  }
}
