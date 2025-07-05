import { ethers } from 'ethers';

export type WalletType = 'metamask' | 'circle-social';

export interface TransactionRequest {
  to: string;
  value: string;
  data?: string;
}

export interface TransactionResponse {
  hash: string;
  wait: () => Promise<ethers.providers.TransactionReceipt>;
}

export interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  network: string | null;
  walletType: 'metamask' | 'circle-social' | null;
  userToken: string | null;
  loginMethod: 'google' | 'email' | null;
  usdcBalance: string;
  provider: ethers.providers.Web3Provider | null;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  connectMetaMask: () => Promise<string | null>;
  connectWithGoogle: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  copyToClipboard: (text: string) => void;
  sendTransaction: (tx: TransactionRequest) => Promise<TransactionResponse>;
}
