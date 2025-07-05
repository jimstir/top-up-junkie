import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ethers } from 'ethers';
import CircleUserWalletService from '../services/CircleUserWalletService';
import { WalletContextType, TransactionRequest, TransactionResponse, WalletType } from './wallet.types';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      // Standard EIP-1193 methods
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
      chainId?: string;
      selectedAddress?: string;
      networkVersion?: string;
      
      // EIP-1193 events
      on: (eventName: string, callback: (...args: any[]) => void) => void;
      removeListener: (eventName: string, callback: (...args: any[]) => void) => void;
      
      // Legacy API for web3 compatibility
      enable?: () => Promise<string[]>;
      send?: (method: string, params?: any[]) => Promise<any>;
      sendAsync?: (request: { method: string; params?: any[] }, callback: (error: any, response: any) => void) => void;
    };
  }
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'metamask' | 'circle-social' | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<'google' | 'email' | null>(null);
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      // Wallet disconnected
      setAddress(null);
      setIsConnected(false);
      setNetwork(null);
    } else {
      setAddress(accounts[0]);
    }
  }, []);

  const getNetworkName = useCallback((chainId: string) => {
    switch (chainId) {
      case '0xaa36a7': // Sepolia testnet
      case '11155111': // Sepolia testnet (decimal)
        return 'Ethereum Sepolia';
      case '0x1': // Mainnet
        return 'Ethereum Mainnet';
      case '0x5': // Goerli
        return 'Ethereum Goerli';
      case '0x89': // Polygon Mainnet
        return 'Polygon Mainnet';
      case '0x13881': // Mumbai
        return 'Polygon Mumbai';
      default:
        return `Chain ID: ${chainId}`;
    }
  }, []);

  const handleChainChanged = useCallback(async (chainId: string) => {
    console.log('Chain changed to:', chainId);
    const networkName = getNetworkName(chainId);
    setNetwork(networkName);
    
    // If connected to an unsupported network, show a message
    if (networkName === 'Ethereum Sepolia') {
      // Do nothing, it's the correct network
    } else {
      alert(`Please switch to Ethereum Sepolia network. Current network: ${networkName}`);
    }
    
    // Refresh the page to ensure all network-dependent data is reloaded
    window.location.reload();
  }, [getNetworkName]);

  // Initialize provider and check connection on mount
  useEffect(() => {
    const initProvider = async () => {
      if (typeof window.ethereum === 'undefined') {
        console.warn('MetaMask not installed');
        return;
      }

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum as any);
      setProvider(web3Provider);

      // Check if already connected
      try {
        const accounts = await web3Provider.listAccounts();
        if (accounts.length > 0) {
          const signer = web3Provider.getSigner();
          const address = await signer.getAddress();
          setAddress(address);
          setIsConnected(true);
          setWalletType('metamask');
          
          // Set up event listeners
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          window.ethereum.on('chainChanged', handleChainChanged);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    initProvider();

    return () => {
      // Clean up event listeners
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged]);

  // USDC Contract ABI - Minimal ABI for balanceOf
  const usdcAbi = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)'
  ];

  // USDC contract address on Sepolia
  const USDC_CONTRACT_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'; // USDC on Sepolia

  const refreshBalance = useCallback(async () => {
    if (!address || !provider) {
      console.log('Cannot refresh balance: No wallet address or provider');
      return;
    }

    console.log('Refreshing USDC balance for address:', address);
    
    try {
      setUsdcBalance('0'); // Reset balance while fetching
      
      if (walletType === 'circle-social' && userToken) {
        console.log('Fetching real Circle wallet balance...');
        
        try {
          const balanceData = await CircleUserWalletService.getWalletBalance();
          console.log('Received balance data from Circle:', balanceData);
          
          // Find USDC balance
          const usdcToken = balanceData.tokenBalances.find(
            (token: any) => token.symbol === 'USDC' || token.name === 'USD Coin'
          );
          
          if (usdcToken) {
            const usdcBalance = (parseFloat(usdcToken.balance) / Math.pow(10, usdcToken.decimals || 6)).toFixed(2);
            console.log('USDC Balance:', usdcBalance);
            setUsdcBalance(usdcBalance);
          } else {
            console.log('No USDC balance found');
            setUsdcBalance('0.00');
          }
        } catch (error) {
          console.error('Error fetching Circle wallet balance:', error);
          setUsdcBalance('0.00');
          throw error;
        }
      } else if (walletType === 'metamask' && provider) {
        console.log('Fetching USDC balance from Sepolia...');
        
        try {
          // Create USDC contract instance
          const usdcContract = new ethers.Contract(
            USDC_CONTRACT_ADDRESS,
            usdcAbi,
            provider
          );
          
          // Get token decimals (usually 6 for USDC)
          const decimals = await usdcContract.decimals();
          
          // Get raw balance
          const balance = await usdcContract.balanceOf(address);
          
          // Convert to human-readable format
          const formattedBalance = ethers.utils.formatUnits(balance, decimals);
          const roundedBalance = parseFloat(formattedBalance).toFixed(2);
          
          console.log('USDC Balance:', roundedBalance);
          setUsdcBalance(roundedBalance);
        } catch (error) {
          console.error('Error fetching USDC balance:', error);
          setUsdcBalance('0.00');
          throw error;
        }
      } else {
        console.warn('Cannot refresh balance: Unsupported wallet type or missing provider');
        setUsdcBalance('0.00');
      }
    } catch (error) {
      console.error('Error in refreshBalance:', error);
      setUsdcBalance('0.00');
      throw error;
    }
  }, [address, userToken, walletType, provider]);

  const connect = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not detected. Please install the MetaMask extension.');
    }
    
    // Check if connected to Sepolia
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const networkName = getNetworkName(chainId);
    
    if (networkName !== 'Ethereum Sepolia') {
      try {
        // Try to switch to Sepolia
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Ethereum Sepolia',
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              }],
            });
          } catch (addError) {
            console.error('Error adding Sepolia network:', addError);
            throw new Error('Failed to add Sepolia network to MetaMask');
          }
        } else {
          console.error('Error switching to Sepolia:', switchError);
          throw new Error('Failed to switch to Sepolia network');
        }
      }
    }

    try {
      // Check if already connected
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum as any);
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your MetaMask wallet.');
      }
      
      const signer = web3Provider.getSigner();
      const address = await signer.getAddress();
      const network = await web3Provider.getNetwork();
      
      // Update state
      setAddress(address);
      setNetwork(network.name);
      setProvider(web3Provider);
      setIsConnected(true);
      setWalletType('metamask');
      
      // Set up event listeners
      // Note: We don't check for existing listeners to avoid TypeScript errors
      // This is safe as adding the same listener multiple times is handled by the browser
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Refresh balance after connecting
      await refreshBalance();
      
      return address;
    } catch (error: any) {
      console.error('Error connecting to wallet:', error);
      
      // Handle specific error cases
      if (error.code === 4001) {
        // User rejected the request
        throw new Error('Connection rejected. Please approve the connection in MetaMask.');
      } else if (error.code === -32002) {
        // Request already pending
        throw new Error('A connection request is already pending. Please check your MetaMask extension.');
      } else if (error.code === -32603) {
        // Internal error
        throw new Error('An internal error occurred. Please try again.');
      } else {
        // General error
        throw new Error(`Failed to connect: ${error.message || 'Unknown error'}`);
      }
    }
  }, [handleAccountsChanged, handleChainChanged, refreshBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setNetwork(null);
    setWalletType(null);
    setUserToken(null);
    setLoginMethod(null);
    setIsConnected(false);
    
    // Clear Circle wallet session if it was connected
    if (walletType === 'circle-social') {
      CircleUserWalletService.clearSession();
    }
  }, [walletType]);



  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const sendTransaction = async (tx: TransactionRequest): Promise<TransactionResponse> => {
    if (!address) {
      throw new Error('No connected account found');
    }

    // Handle Circle wallet transactions
    if (walletType === 'circle-social' && userToken) {
      try {
        // Use Circle's API to send the transaction
        const response = await fetch(`${process.env.REACT_APP_CIRCLE_CLIENT_URL}/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({
            to: tx.to,
            value: tx.value,
            data: tx.data || '0x',
            chainId: 1, // Mainnet - adjust based on your needs
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to send transaction');
        }

        const result = await response.json();
        const transactionHash = result.txHash;

        return {
          hash: transactionHash,
          wait: (): Promise<any> => {
            return new Promise((resolve, reject) => {
              const checkTransaction = async () => {
                try {
                  const receiptResponse = await fetch(`${process.env.REACT_APP_CIRCLE_CLIENT_URL}/transactions/${transactionHash}`, {
                    headers: {
                      'Authorization': `Bearer ${userToken}`
                    }
                  });

                  if (!receiptResponse.ok) {
                    throw new Error('Failed to fetch transaction receipt');
                  }

                  const receipt = await receiptResponse.json();
                  
                  if (receipt.status === 'CONFIRMED') {
                    resolve(receipt);
                  } else if (receipt.status === 'FAILED') {
                    reject(new Error('Transaction failed'));
                  } else {
                    setTimeout(checkTransaction, 2000);
                  }
                } catch (error) {
                  console.error('Error checking transaction:', error);
                  setTimeout(checkTransaction, 2000);
                }
              };
              checkTransaction();
            });
          },
        };
      } catch (error) {
        console.error('Circle transaction failed:', error);
        throw error instanceof Error ? error : new Error('Transaction failed');
      }
    }
    // Handle MetaMask transactions
    else if (window.ethereum && walletType === 'metamask') {
      try {
        const transactionHash: string = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: tx.to,
            value: tx.value,
            data: tx.data || '0x',
          }],
        });

        if (typeof transactionHash !== 'string') {
          throw new Error('Invalid transaction hash received');
        }

        return {
          hash: transactionHash,
          wait: (): Promise<any> => {
            return new Promise((resolve, reject) => {
              const checkTransaction = async () => {
                try {
                  if (!window.ethereum) {
                    reject(new Error('Ethereum provider disconnected'));
                    return;
                  }

                  const receipt = await window.ethereum.request({
                    method: 'eth_getTransactionReceipt',
                    params: [transactionHash],
                  });

                  if (receipt) {
                    resolve(receipt);
                  } else {
                    setTimeout(checkTransaction, 2000);
                  }
                } catch (error) {
                  console.error('Error checking transaction:', error);
                  setTimeout(checkTransaction, 2000);
                }
              };
              checkTransaction();
            });
          },
        };
      } catch (error) {
        console.error('MetaMask transaction failed:', error);
        throw error instanceof Error ? error : new Error('Transaction failed');
      }
    } else {
      throw new Error('No compatible wallet provider found');
    }
  };

  const switchNetwork = async (chainId: string) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (error) {
      console.error('Error switching network:', error);
      // Add network to the context value
    }
  };

  const handleSwitchNetwork = useCallback(async (chainId: string) => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId }],
        });
      }
    } catch (error) {
      console.error('Error switching network:', error);
      throw error;
    }
  }, []);

  const handleConnectWithGoogle = useCallback(async () => {
    try {
      console.log('Initiating Google login with Circle...');
      
      // Call the CircleUserWalletService to handle Google OAuth
      const result = await CircleUserWalletService.loginWithGoogle();
      
      console.log('Google login successful:', result);
      
      // Update the wallet context with the user's information
      setAddress(result.address);
      setNetwork('Ethereum Sepolia');
      setIsConnected(true);
      setWalletType('circle-social');
      setLoginMethod('google');
      setUserToken(result.userToken);
      
      // Refresh the balance after successful login
      await refreshBalance();
      
      // Don't return anything to match the expected void return type
    } catch (error) {
      console.error('Google login error:', error);
      
      // Reset connection state on error
      setIsConnected(false);
      setAddress(null);
      setWalletType(null);
      setLoginMethod(null);
      setUserToken(null);
      
      throw new Error(`Failed to connect with Google: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [refreshBalance]);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        network: network || 'Ethereum Sepolia',
        walletType,
        userToken,
        loginMethod,
        usdcBalance: usdcBalance || '0.00',
        provider,
        connect,
        disconnect,
        disconnectWallet: disconnect,
        connectMetaMask: connect,
        connectWithGoogle: handleConnectWithGoogle,
        copyToClipboard,
        refreshBalance,
        sendTransaction,
        switchNetwork: handleSwitchNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Export the hook with proper typing
const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export { WalletProvider };
export { useWallet };

export type { WalletContextType, TransactionRequest, TransactionResponse };
