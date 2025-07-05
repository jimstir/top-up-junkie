import { BigNumber, ethers } from 'ethers';
import { NETWORKS } from '../components/CrossChainTransfer/CrossChainTransferForm';
import CircleUserWalletService from './CircleUserWalletService';

// CCTP contract ABIs
const TOKEN_MESSENGER_ABI = [
  'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) external returns (uint64 _nonce)'
];

// CCTP contract addresses (testnet)
const CCTP_CONTRACTS = {
  ethereum: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5', // Ethereum Sepolia
  avalanche: '0x58f4c17449c90645891c1d537723a5c8fafbaead', // Avalanche Fuji
  base: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5' // Base Sepolia
};

// USDC contract addresses (testnet)
const USDC_ADDRESSES = {
  ethereum: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC on Ethereum Sepolia
  avalanche: '0x5425890298aed601595a70AB815c96711a31Bc65', // USDC on Avalanche Fuji
  base: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // USDC on Base Sepolia
};

class CrossChainService {
  private static instance: CrossChainService;
  private provider: ethers.providers.Web3Provider | null = null;

  private constructor() {}

  public static getInstance(): CrossChainService {
    if (!CrossChainService.instance) {
      CrossChainService.instance = new CrossChainService();
    }
    return CrossChainService.instance;
  }

  public setProvider(provider: ethers.providers.Web3Provider) {
    this.provider = provider;
  }

  public async transferUSDC(
    amount: string,
    sourceChain: string,
    destinationChain: string,
    recipient: string
  ) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const signer = this.provider.getSigner();
    const sourceChainId = NETWORKS.find(n => n.value === sourceChain)?.id;
    const destinationChainId = NETWORKS.find(n => n.value === destinationChain)?.id;

    if (!sourceChainId || !destinationChainId) {
      throw new Error('Invalid chain selection');
    }

    // Convert amount to wei (USDC has 6 decimals on testnet, 18 on mainnet)
    const amountInWei = ethers.utils.parseUnits(amount, 6);
    
    // Get the TokenMessenger contract
    const tokenMessenger = new ethers.Contract(
      CCTP_CONTRACTS[sourceChain as keyof typeof CCTP_CONTRACTS],
      TOKEN_MESSENGER_ABI,
      signer
    );

    // Convert recipient address to bytes32
    const recipientBytes32 = ethers.utils.hexZeroPad(recipient, 32);
    
    // Execute the depositForBurn transaction
    const tx = await tokenMessenger.depositForBurn(
      amountInWei,
      parseInt(destinationChainId, 16), // Convert hex to decimal
      recipientBytes32,
      USDC_ADDRESSES[sourceChain as keyof typeof USDC_ADDRESSES]
    );

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.transactionHash,
      status: receipt.status === 1 ? 'success' : 'failed',
      amount,
      sourceChain,
      destinationChain,
      recipient
    };
  }

  // Get estimated gas fee for the transfer
  public async estimateGasFee(
    amount: string,
    sourceChain: string,
    destinationChain: string,
    recipient: string
  ) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const signer = this.provider.getSigner();
    const tokenMessenger = new ethers.Contract(
      CCTP_CONTRACTS[sourceChain as keyof typeof CCTP_CONTRACTS],
      TOKEN_MESSENGER_ABI,
      signer
    );

    const amountInWei = ethers.utils.parseUnits(amount, 6);
    const recipientBytes32 = ethers.utils.hexZeroPad(recipient, 32);
    const destinationChainId = NETWORKS.find(n => n.value === destinationChain)?.id;

    if (!destinationChainId) {
      throw new Error('Invalid destination chain');
    }

    const gasEstimate = await tokenMessenger.estimateGas.depositForBurn(
      amountInWei,
      parseInt(destinationChainId, 16),
      recipientBytes32,
      USDC_ADDRESSES[sourceChain as keyof typeof USDC_ADDRESSES]
    );

    const gasPrice = await this.provider.getGasPrice();
    const gasCost = gasEstimate.mul(gasPrice);

    return {
      gasEstimate: gasEstimate.toString(),
      gasCost: ethers.utils.formatEther(gasCost),
      gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei')
    };
  }
}

export default CrossChainService.getInstance();
