import { ethers } from 'ethers';

export type WalletType = 'metamask' | 'circle-social';

export interface TransactionRequest {
  to: string;
  value: string;
  data?: string;
}

export interface TransactionResponse {
  hash: string;
  wait: () => Promise<any>;
}

export interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  network: string | null;
  walletType: 'metamask' | 'circle-social' | null;
  userToken: string | null;
  loginMethod: 'google' | 'email' | null;
  balance: string;
  usdcBalance: string;
  ethBalance: string;
  contractBalance: string;
  contractAddress: string | null;
  provider: ethers.providers.Web3Provider | null;
  loading: boolean;
  connect: () => Promise<string | null>;
  connectMetaMask: () => Promise<string | null>;
  connectWithGoogle: () => Promise<void>;
  disconnect: () => void;
  depositFunds: (amount: string) => Promise<ethers.ContractTransaction>;
  refreshBalance: () => Promise<void>;
  addUSDCToWallet: () => Promise<void>;
  checkEthBalance: () => Promise<string | null>;
  debugWalletStatus: () => Promise<void>;
  copyToClipboard: (text: string) => void;
  sendTransaction: (tx: TransactionRequest) => Promise<TransactionResponse>;
  switchNetwork: (chainId: string) => Promise<void>;
  checkWalletConnection: () => Promise<boolean>;
  loadContractFromFile: (file: File) => Promise<{ address: string }>;
}
