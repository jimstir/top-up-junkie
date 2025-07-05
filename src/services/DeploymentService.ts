// This file will be generated during deployment
const deploymentInfo = {
  topAcc: {
    address: process.env.REACT_APP_TOPACC_ADDRESS || "",
    abi: []
  },
  addService: {
    address: process.env.REACT_APP_ADDSERVICE_ADDRESS || "",
    abi: []
  }
} as const;

export class DeploymentService {
  private static async loadDeploymentInfo() {
    try {
      const response = await fetch('/deployments/localhost.json');
      return await response.json();
    } catch (error) {
      console.warn('Using default deployment info from environment variables');
      return deploymentInfo;
    }
  }
  static async getContractAddress(contractName: string): Promise<string> {
    const info = await this.loadDeploymentInfo();
    return info[contractName]?.address || '';
  }

  static async getContractABI(contractName: string): Promise<any[]> {
    const info = await this.loadDeploymentInfo();
    return info[contractName]?.abi || [];
  }

  static async getDeployedContracts() {
    return await this.loadDeploymentInfo();
  }
}
