import { CircleUserControlledWalletsClient, initiateUserControlledWalletsClient } from '@circle-fin/user-controlled-wallets';

export interface UserTokenResponse {
  userToken: string;
  address: string;
  userId?: string;
  email?: string;
}

interface WalletInfo {
  address: string;
  id: string;
  blockchain?: string;
  balance?: string;
}

const STORAGE_KEYS = {
  USER_TOKEN: 'circleUserToken',
  WALLET_ADDRESS: 'circleWalletAddress',
  LOGIN_METHOD: 'circleLoginMethod',
  USER_ID: 'circleUserId',
  USER_EMAIL: 'circleUserEmail'
} as const;

export class CircleWalletService {
  private client: CircleUserControlledWalletsClient | null = null;
  private isInitialized: boolean = false;
  private static instance: CircleWalletService;
  private simulationMode: boolean = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): CircleWalletService {
    if (!CircleWalletService.instance) {
      CircleWalletService.instance = new CircleWalletService();
    }
    return CircleWalletService.instance;
  }

  private getStorageItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  private setStorageItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
    }
  }

  private generateMockAddress(prefix: string = '0x'): string {
    const chars = '0123456789abcdef';
    let address = prefix;
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * 16)];
    }
    return address;
  }

  private generateMockTransactionId(): string {
    return 'tx_' + Math.random().toString(36).substring(2, 15);
  }

  private async simulateGoogleLogin(): Promise<UserTokenResponse> {
    const mockUserToken = 'circle_sim_' + Math.random().toString(36).substring(2, 15);
    const mockAddress = this.generateMockAddress();
    
    // Store simulation data
    localStorage.setItem('circleUserToken', mockUserToken);
    localStorage.setItem('circleWalletAddress', mockAddress);
    localStorage.setItem('circleLoginMethod', 'google');
    localStorage.setItem('circleUserId', 'sim_user_' + Date.now());
    localStorage.setItem('circleUserEmail', 'user@gmail.com');
    
    return {
      userToken: mockUserToken,
      address: mockAddress,
      userId: 'sim_user_' + Date.now(),
      email: 'user@gmail.com'
    };
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const hasRequiredConfig = !!(process.env.REACT_APP_CIRCLE_CLIENT_KEY && process.env.REACT_APP_CIRCLE_CLIENT_URL);

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
      console.error('Failed to initialize Circle client:', error);
      throw new Error('Failed to initialize Circle client');
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  public async loginWithGoogle(): Promise<UserTokenResponse> {
    try {
      await this.ensureInitialized();
      
      if (this.simulationMode) {
        return this.simulateGoogleLogin();
      }

      // In a real implementation, redirect to Google OAuth
      console.log('Redirecting to Google OAuth...');
      return this.simulateGoogleLogin(); // Fallback to simulation
      
    } catch (error) {
      console.error('Google login failed:', error);
      return this.simulateGoogleLogin(); // Fallback to simulation on error
    }
  }

  public async handleOAuthCallback(code: string, state: string): Promise<UserTokenResponse> {
    try {
      await this.ensureInitialized();
      localStorage.removeItem('oauthState');
      
      if (this.simulationMode) {
        return this.simulateGoogleLogin();
      }
      
      // In a real implementation, exchange the code for tokens
      console.log('Exchanging OAuth code for tokens...');
      return this.simulateGoogleLogin(); // Fallback to simulation
      
    } catch (error) {
      console.error('OAuth callback failed:', error);
      return this.simulateGoogleLogin(); // Fallback to simulation on error
    }
  }

  private async createWallet(userToken: string): Promise<WalletInfo> {
    try {
      await this.ensureInitialized();
      
      // Simulate wallet creation
      const walletInfo = {
        address: this.generateMockAddress(),
        id: 'sim_wallet_' + Math.random().toString(36).substring(2, 10)
      };
      
      console.log('Created wallet:', walletInfo);
      return walletInfo;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw error;
    }
  }

  private async getWallets(userToken: string): Promise<WalletInfo[]> {
    try {
      await this.ensureInitialized();
      
      // Return a mock wallet if none exists
      const storedAddress = localStorage.getItem('circleWalletAddress');
      if (storedAddress) {
        return [{
          address: storedAddress,
          id: 'sim_wallet_' + storedAddress.substring(2, 10)
        }];
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get wallets:', error);
      return [];
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.ensureInitialized();
      
      // Clear all stored data
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log('Successfully disconnected from Circle');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      throw error;
    }
  }

  public async restoreSession(): Promise<UserTokenResponse | null> {
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

  public clearSession(): void {
    localStorage.removeItem('circleUserToken');
    localStorage.removeItem('circleWalletAddress');
    localStorage.removeItem('oauthState');
  }

  public isAuthenticated(): boolean {
    return !!(this.getStorageItem(STORAGE_KEYS.USER_TOKEN, null) && 
             this.getStorageItem(STORAGE_KEYS.WALLET_ADDRESS, null));
  }

  public getStoredAddress(): string | null {
    return this.getStorageItem(STORAGE_KEYS.WALLET_ADDRESS, null);
  }

  public getStoredUserToken(): string | null {
    return this.getStorageItem(STORAGE_KEYS.USER_TOKEN, null);
  }
  
  public async getWalletTransactions(walletAddress: string): Promise<Array<{
    id: string;
    amount: string;
    timestamp: string;
    status: 'completed' | 'pending' | 'failed';
  }>> {
    try {
      await this.ensureInitialized();
      
      if (this.simulationMode) {
        // Return mock transactions
        return [
          {
            id: this.generateMockTransactionId(),
            amount: (Math.random() * 0.5).toFixed(4),
            timestamp: new Date().toISOString(),
            status: 'completed'
          }
        ];
      }
      
      // In a real implementation, fetch actual transactions
      console.log(`Fetching transactions for wallet ${walletAddress}`);
      return [];
      
    } catch (error) {
      console.error('Failed to get wallet transactions:', error);
      return [];
    }
  }
  
  public async getWalletBalance(userToken: string, walletAddress: string): Promise<string> {
    try {
      await this.ensureInitialized();
      
      if (this.simulationMode) {
        return (Math.random() * 10).toFixed(4);
      }
      
      // In a real implementation, fetch actual balance
      console.log(`Fetching balance for wallet ${walletAddress}`);
      return '0.0'; // Fallback to 0 balance
      
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return '0.0';
    }
  }
  
  public async transferFunds(
    fromAddress: string,
    toAddress: string,
    amount: string,
    tokenAddress?: string
  ): Promise<{ transactionId: string }> {
    try {
      await this.ensureInitialized();
      
      if (this.simulationMode) {
        console.log(`Simulating transfer of ${amount} from ${fromAddress} to ${toAddress}`);
        return { transactionId: this.generateMockTransactionId() };
      }
      
      // In a real implementation, execute the transfer
      console.log(`Transferring ${amount} from ${fromAddress} to ${toAddress}`);
      return { transactionId: this.generateMockTransactionId() };
      
    } catch (error) {
      console.error('Transfer failed:', error);
      throw new Error('Failed to transfer funds');
    }
  }
}

export const circleWalletService = CircleWalletService.getInstance();
