import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { circleUserWalletService } from '../services/CircleUserWalletService';
import ContractManager from '../services/ContractManager';
import { WalletContextType, TransactionRequest, TransactionResponse } from './wallet.types';

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

export const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'metamask' | 'circle-social' | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<'google' | 'email' | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [contractBalance, setContractBalance] = useState<string>('0');
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Define refreshBalance first to avoid circular dependency
  const refreshBalance = useCallback(async () => {
    if (!provider || !address) return;

    try {
      // Get ETH balance
      const ethBal = await provider.getBalance(address);
      setEthBalance(ethers.utils.formatEther(ethBal));
      
      // Get USDC balance - using the wallet service's method
      const usdcBalance = await circleUserWalletService.getWalletBalance();
      const usdcBalanceFormatted = usdcBalance.tokenBalances[0]?.formattedBalance || '0';
      setUsdcBalance(usdcBalanceFormatted);
      
      // Check if we have a contract and refresh its balance
      const contractData = ContractManager.getStoredContract();
      if (contractData) {
        setContractAddress(contractData.address);
        const balance = await ContractManager.getContractBalance(provider, contractData.address);
        setContractBalance(balance);
      }
      
      // Set the main balance to USDC balance by default
      setBalance(usdcBalanceFormatted);
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  }, [provider, address]);

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

  // Check if wallet is connected on mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (!window.ethereum) return;

      // Cast window.ethereum to any to avoid type issues
      const ethereum = window.ethereum as any;
      const web3Provider = new ethers.providers.Web3Provider(ethereum);

      // Check if already connected
      try {
        const accounts = await web3Provider.listAccounts();
        if (accounts.length > 0) {
          const signer = web3Provider.getSigner();
          const address = await signer.getAddress();
          
          setProvider(web3Provider);
          setAddress(address);
          setWalletType('metamask');
          setIsConnected(true);
          
          // Set up event listeners
          ethereum.on('accountsChanged', handleAccountsChanged);
          ethereum.on('chainChanged', handleChainChanged);
          
          // Refresh balances
          await refreshBalance();
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkWalletConnection();

    // Clean up event listeners
    return () => {
      if (window.ethereum) {
        const ethereum = window.ethereum as any;
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged, refreshBalance]);

  const depositFunds = useCallback(async (amount: string) => {
    if (!provider || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      // Get or deploy contract
      const { address: contractAddress } = await ContractManager.getOrDeployContract(provider, provider.getSigner());
      setContractAddress(contractAddress);
      
      // Deposit to the contract
      const signer = provider.getSigner();
      const tx = await signer.sendTransaction({
        to: contractAddress,
        value: ethers.utils.parseEther(amount)
      });
      
      await tx.wait();
      await refreshBalance();
      return tx;
    } catch (error) {
      console.error('Deposit failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [provider, address, refreshBalance]);

  const connect = useCallback(async (): Promise<string | null> => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not detected. Please install the MetaMask extension.');
    }
    
    try {
      // Cast window.ethereum to any to avoid type issues
      const ethereum = window.ethereum as any;
      
      // Check if connected to Sepolia
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      const networkName = getNetworkName(chainId);
      
      if (networkName !== 'Ethereum Sepolia') {
        try {
          // Try to switch to Sepolia
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia test network',
                  nativeCurrency: {
                    name: 'SepoliaETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/demo', 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
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

      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      
      if (!address) {
        throw new Error('No accounts found');
      }
      
      // Create a new provider with the current ethereum provider
      const provider = new ethers.providers.Web3Provider(ethereum);
      
      // Update state
      setProvider(provider);
      setAddress(address);
      setWalletType('metamask');
      setIsConnected(true);
      
      // Set up event listeners
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);
      
      // Refresh balances
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
  }, [handleAccountsChanged, handleChainChanged, refreshBalance, getNetworkName]);

  const disconnect = useCallback(async () => {
    // Clean up event listeners
    if (window.ethereum) {
      const ethereum = window.ethereum as any;
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    }
    
    // Reset all state
    setAddress(null);
    setNetwork(null);
    setWalletType(null);
    setUserToken(null);
    setLoginMethod(null);
    setIsConnected(false);
    setBalance('0');
    setUsdcBalance('0');
    setEthBalance('0');
    setContractBalance('0');
    setContractAddress(null);
    
    // Clear Circle wallet session if it was connected
    if (walletType === 'circle-social') {
      await circleUserWalletService.logout();
    }
  }, [walletType, handleAccountsChanged, handleChainChanged]);





  // Initialize with existing balance on mount
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        // Cast window.ethereum to any to avoid type issues
        const ethereum = window.ethereum as any;
        const provider = new ethers.providers.Web3Provider(ethereum);
        
        // Check if already connected
        try {
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            setAddress(address);
            setProvider(provider);
            setIsConnected(true);
            setWalletType('metamask');
            
            // Set up event listeners
            ethereum.on('accountsChanged', handleAccountsChanged);
            ethereum.on('chainChanged', handleChainChanged);
            
            // Refresh balances
            await refreshBalance();
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };
    
    init();
    
    // Clean up event listeners
    return () => {
      if (window.ethereum) {
        const ethereum = window.ethereum as any;
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [refreshBalance, handleAccountsChanged, handleChainChanged]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }, []);

  const sendTransaction = useCallback(async (tx: TransactionRequest): Promise<TransactionResponse> => {
    if (!address) {
      throw new Error('No connected account found');
    }

    if (!provider) {
      throw new Error('No provider available');
    }

    try {
      const signer = provider.getSigner();
      const txResponse = await signer.sendTransaction({
        ...tx,
        from: address
      });

      return {
        hash: txResponse.hash,
        wait: () => txResponse.wait()
      };
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }, [address, provider]);

  const handleSwitchNetwork = useCallback(async (chainId: string) => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId }]
        });
      } catch (error) {
        console.error('Error switching network:', error);
        throw error;
      }
    }
  }, []);

  const handleConnectWithGoogle = useCallback(async () => {
    try {
      console.log('Initiating Google login with Circle...');
      
      // Call the circleUserWalletService instance to handle Google OAuth
      const result = await circleUserWalletService.loginWithGoogle();
      
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

  // Add USDC token to MetaMask
  const addUSDCToWallet = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('No Ethereum provider found');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: [{
          type: 'ERC20',
          options: {
            address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
            symbol: 'USDC',
            decimals: 6,
            image: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
          },
        }],
      } as any);
    } catch (error) {
      console.error('Error adding USDC to wallet:', error);
      throw error;
    }
  }, []);

  // Check ETH balance for gas fees
  const checkEthBalance = useCallback(async () => {
    if (!provider || !address) {
      setEthBalance('0');
      return null;
    }
    
    try {
      const balance = await provider.getBalance(address);
      const ethBalanceString = ethers.utils.formatEther(balance);
      const roundedBalance = parseFloat(ethBalanceString).toFixed(4);
      
      console.log('ETH Balance:', roundedBalance);
      setEthBalance(roundedBalance);
      
      // Warn if balance is very low (less than 0.001 ETH)
      if (parseFloat(ethBalanceString) < 0.001) {
        console.warn('Low ETH balance - may not be enough for gas fees');
      }
      
      return roundedBalance;
    } catch (error) {
      console.error('Error checking ETH balance:', error);
      setEthBalance('0');
      return null;
    }
  }, [provider, address]);

  // Check if wallet connection is working properly
  const checkWalletConnection = useCallback(async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        alert('❌ MetaMask not detected!\n\nPlease install MetaMask extension to connect your wallet.');
        return false;
      }

      // Check if connected to the right network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') {
        alert(`❌ Wrong Network!\n\nPlease switch to Sepolia testnet.\nCurrent network: ${getNetworkName(chainId)}\nRequired: Ethereum Sepolia`);
        return false;
      }

      // Check if accounts are connected
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        alert('❌ No wallet connected!\n\nPlease connect your MetaMask wallet.');
        return false;
      }

      // Check if provider is working
      if (!provider) {
        alert('❌ Provider not available!\n\nThere seems to be an issue with the wallet connection. Please refresh the page and try again.');
        return false;
      }

      // Check ETH balance for gas
      const ethBal = await checkEthBalance();
      if (ethBal && parseFloat(ethBal) < 0.001) {
        alert('⚠️ Low ETH Balance!\n\nYou have very little Sepolia ETH. You may not be able to pay for transaction fees.\n\nGet free Sepolia ETH from: https://faucet.sepolia.dev/');
      }

      return true;
    } catch (error: any) {
      console.error('Wallet connection check failed:', error);
      alert(`❌ Wallet Connection Error!\n\n${error.message}\n\nPlease check your MetaMask extension and try again.`);
      return false;
    }
  }, [provider, getNetworkName, checkEthBalance]);

  // Debug function to check wallet status
  const debugWalletStatus = useCallback(async () => {
    console.log('=== Wallet Debug Info ===');
    console.log('IsConnected:', isConnected);
    console.log('Address:', address);
    console.log('WalletType:', walletType);
    console.log('Network:', network);
    console.log('Provider:', provider);
    console.log('USDC Balance:', usdcBalance);
    
    if (provider && address) {
      const ethBalance = await checkEthBalance();
      console.log('ETH Balance:', ethBalance);
      
      const networkInfo = await provider.getNetwork();
      console.log('Network Info:', networkInfo);
      console.log('Expected Sepolia Chain ID: 11155111');
      console.log('Current Chain ID:', networkInfo.chainId);
      
      // Test USDC contract
      try {
        const usdcAbi = [
          'function balanceOf(address owner) view returns (uint256)',
          'function decimals() view returns (uint8)',
          'function symbol() view returns (string)',
          'function name() view returns (string)'
        ];
        
        const usdcContract = new ethers.Contract(
          '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          usdcAbi,
          provider
        );
        
        const symbol = await usdcContract.symbol();
        const name = await usdcContract.name();
        const decimals = await usdcContract.decimals();
        
        console.log('USDC Contract Info:');
        console.log('- Symbol:', symbol);
        console.log('- Name:', name);
        console.log('- Decimals:', decimals);
        console.log('- Address:', '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238');
        
      } catch (contractError) {
        console.error('Error testing USDC contract:', contractError);
      }
    }
    console.log('=== End Debug Info ===');
  }, [isConnected, address, walletType, network, provider, usdcBalance, checkEthBalance]);

  const connectMetaMask = useCallback(async (): Promise<string | null> => {
    if (!window.ethereum) {
      throw new Error('No Ethereum provider found');
    }

    try {
      // Cast window.ethereum to any to avoid type issues
      const ethereum = window.ethereum as any;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];
      
      if (!address) {
        throw new Error('No accounts found');
      }
      
      setProvider(provider);
      setAddress(address);
      setWalletType('metamask');
      setIsConnected(true);
      
      // Set up event listeners
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);
      
      // Refresh balances
      await refreshBalance();
      
      return address;
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      return null;
    }
  }, [handleAccountsChanged, handleChainChanged, refreshBalance]);

  const connectWithGoogle = useCallback(async () => {
    // Implementation for Google OAuth login
    // This is a placeholder - you'll need to implement actual Google OAuth flow
    try {
      setLoading(true);
      // Your Google OAuth implementation here
      // For example:
      // const user = await signInWithGoogle();
      // setUserToken(user.token);
      // setLoginMethod('google');
      // setWalletType('circle-social');
      // setIsConnected(true);
    } catch (error) {
      console.error('Error connecting with Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadContractFromFile = useCallback(async (file: File): Promise<{ address: string }> => {
    try {
      setLoading(true);
      
      // Read the file content
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(new Error('Error reading file'));
        reader.readAsText(file);
      });
      
      // Parse the JSON content
      const data = JSON.parse(content);
      
      // Validate the contract address
      if (!data.address || !ethers.utils.isAddress(data.address)) {
        throw new Error('Invalid contract address in the file');
      }
      
      // If we have a provider, we can validate the contract
      if (provider) {
        try {
          // Here you would typically validate the contract
          // For example, check if it's a TopAcc contract by calling a method
          // const contract = new ethers.Contract(data.address, ['function isTopAcc() view returns (bool)'], provider);
          // const isValid = await contract.isTopAcc();
          // if (!isValid) {
          //   throw new Error('The provided contract is not a valid TopAcc contract');
          // }
          
          // For now, we'll just update the contract address and refresh the balance
          setContractAddress(data.address);
          await refreshBalance();
          
          return { address: data.address };
        } catch (error) {
          console.error('Error validating contract:', error);
          throw new Error('Failed to validate contract. Make sure it exists on the current network.');
        }
      }
      
      // If no provider, just set the address
      setContractAddress(data.address);
      return { address: data.address };
      
    } catch (error) {
      console.error('Error loading contract from file:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [provider, refreshBalance]);

  const contextValue: WalletContextType = {
    isConnected: !!address,
    address,
    network,
    walletType,
    userToken,
    loginMethod,
    balance,
    usdcBalance,
    ethBalance,
    contractBalance,
    contractAddress,
    provider,
    loading,
    connect,
    connectMetaMask,
    connectWithGoogle,
    disconnect,
    depositFunds,
    refreshBalance,
    addUSDCToWallet,
    checkEthBalance,
    debugWalletStatus,
    loadContractFromFile,
    checkWalletConnection: async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return accounts.length > 0;
      }
      return false;
    },
    copyToClipboard,
    sendTransaction,
    switchNetwork: handleSwitchNetwork,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Export the hook with proper null check
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export type { WalletContextType, TransactionRequest, TransactionResponse };
