import { 
  CircleUserControlledWalletsClient, 
  initiateUserControlledWalletsClient
} from '@circle-fin/user-controlled-wallets';
import { ethers } from 'ethers';

interface UserTokenResponse {
  userToken: string;
  address: string;
  userId?: string;
  email?: string;
}

class CircleUserWalletService {
  private client: CircleUserControlledWalletsClient | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const hasRequiredConfig = !!(
        process.env.REACT_APP_CIRCLE_CLIENT_KEY && 
        process.env.REACT_APP_CIRCLE_CLIENT_URL
      );
      
      if (!hasRequiredConfig) {
        console.warn('Missing Circle configuration - using simulation mode');
        this.isInitialized = true;
        return;
      }

      this.client = await initiateUserControlledWalletsClient({
        apiKey: process.env.REACT_APP_CIRCLE_CLIENT_KEY!,
        baseUrl: process.env.REACT_APP_CIRCLE_CLIENT_URL!
      });
      
      this.isInitialized = true;
      console.log('Circle client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Circle service:', error);
      this.isInitialized = true; // Continue with simulation
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  async loginWithGoogle(): Promise<UserTokenResponse> {
    try {
      await this.ensureInitialized();
      
      // For now, use simulation until Circle API is properly configured
      console.log('Using Google login simulation');
      return this.simulateGoogleLogin();
    } catch (error: any) {
      console.error('Google login error:', error);
      return this.simulateGoogleLogin();
    }
  }

  private simulateGoogleLogin(): Promise<UserTokenResponse> {
    return new Promise((resolve) => {
      const mockUserToken = 'circle_sim_' + Math.random().toString(36).substring(2, 15);
      const mockAddress = this.generateMockAddress();
      
      // Store simulation data
      localStorage.setItem('circleUserToken', mockUserToken);
      localStorage.setItem('circleWalletAddress', mockAddress);
      localStorage.setItem('circleLoginMethod', 'google');
      localStorage.setItem('circleUserId', 'sim_user_' + Date.now());
      localStorage.setItem('circleUserEmail', 'user@gmail.com');
      
      resolve({
        userToken: mockUserToken,
        address: mockAddress,
        userId: 'sim_user_' + Date.now(),
        email: 'user@gmail.com'
      });
    });
  }

  private generateMockAddress(): string {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * 16)];
    }
    return address;
  }

  async restoreSession(): Promise<UserTokenResponse | null> {
    try {
      const storedToken = localStorage.getItem('circleUserToken');
      const storedAddress = localStorage.getItem('circleWalletAddress');
      const storedUserId = localStorage.getItem('circleUserId');
      const storedEmail = localStorage.getItem('circleUserEmail');

      if (!storedToken || !storedAddress) {
        return null;
      }

      return {
        userToken: storedToken,
        address: storedAddress,
        userId: storedUserId || undefined,
        email: storedEmail || undefined
      };
    } catch (error) {
      console.error('Failed to restore session:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      // Clear local storage
      localStorage.removeItem('circleUserToken');
      localStorage.removeItem('circleWalletAddress');
      localStorage.removeItem('circleLoginMethod');
      localStorage.removeItem('circleUserId');
      localStorage.removeItem('circleUserEmail');
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('circleUserToken') && !!localStorage.getItem('circleWalletAddress');
  }

  getWalletAddress(): string | null {
    return localStorage.getItem('circleWalletAddress');
  }

  getUserToken(): string | null {
    return localStorage.getItem('circleUserToken');
  }

  async getWalletBalance(provider?: ethers.providers.Provider): Promise<{
    tokenBalances: Array<{
      symbol: string;
      name: string;
      balance: string;        // Raw balance (wei/smallest unit)
      formattedBalance: string; // Formatted balance with correct decimals
      decimals: number;
    }>
  }> {
    try {
      const walletAddress = this.getWalletAddress();
      if (!walletAddress) {
        throw new Error('No wallet address found');
      }

      // USDC contract address on Sepolia - Verified from Circle's documentation
      const USDC_CONTRACT_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
      
      console.log('Fetching USDC balance for address:', walletAddress);
      console.log('Using USDC contract address:', USDC_CONTRACT_ADDRESS);
      
      // USDC ABI - Minimal ABI for balanceOf and decimals
      const usdcAbi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)'
      ];

      // Use the provided provider or fall back to window.ethereum
      let ethersProvider = provider;
      if (!ethersProvider && typeof window !== 'undefined' && (window as any).ethereum) {
        ethersProvider = new ethers.providers.Web3Provider((window as any).ethereum);
      }

      if (!ethersProvider) {
        throw new Error('No Ethereum provider available');
      }

      // Get network info for debugging
      const network = await ethersProvider.getNetwork();
      console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);

      // Create contract instance
      const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, usdcAbi, ethersProvider);

      // Verify contract
      const [symbol, decimals, balance] = await Promise.all([
        usdcContract.symbol().catch(() => 'UNKNOWN'),
        usdcContract.decimals().catch(() => 6), // Default to 6 if decimals call fails
        usdcContract.balanceOf(walletAddress)
      ]);
      
      console.log('Token Symbol:', symbol);
      console.log('Token Decimals:', decimals);
      console.log('Raw Balance:', balance.toString());
      
      // Format the balance using the token's decimals
      const formattedBalance = ethers.utils.formatUnits(balance, decimals);
      console.log('Formatted Balance:', formattedBalance);
      
      return {
        tokenBalances: [
          {
            symbol: symbol,
            name: 'USD Coin',
            balance: balance.toString(),
            formattedBalance: formattedBalance,
            decimals: Number(decimals)
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
      // Return zero balance on error
      return {
        tokenBalances: [
          {
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '0',
            formattedBalance: '0.00',
            decimals: 6
          }
        ]
      };
    }
  }
}

// Export singleton instance
export const circleUserWalletService = new CircleUserWalletService();
export default CircleUserWalletService;
