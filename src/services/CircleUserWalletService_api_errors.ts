import { 
  CircleUserControlledWalletsClient, 
  initiateUserControlledWalletsClient 
} from '@circle-fin/user-controlled-wallets';

interface UserTokenResponse {
  userToken: string;
  address: string;
  userId?: string;
}

class CircleUserWalletService {
  private client: CircleUserControlledWalletsClient | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      if (!process.env.REACT_APP_CIRCLE_CLIENT_KEY) {
        console.warn('Circle client key not found. Using simulation mode.');
        this.isInitialized = true;
        return;
      }

      // Initialize Circle SDK
      this.client = initiateUserControlledWalletsClient({
        apiKey: process.env.REACT_APP_CIRCLE_CLIENT_KEY,
        baseUrl: process.env.REACT_APP_CIRCLE_CLIENT_URL || 'https://api.circle.com'
      });

      this.isInitialized = true;
      console.log('Circle SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Circle SDK:', error);
      // Fall back to simulation mode
      this.isInitialized = true;
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
      
      if (!this.client || !process.env.REACT_APP_CIRCLE_CLIENT_KEY) {
        // Fallback to simulation for development
        return this.simulateGoogleLogin();
      }

      // For real implementation, Circle handles OAuth through their hosted flow
      // The actual integration would involve:
      // 1. Redirecting to Circle's OAuth endpoint
      // 2. Handling the callback
      // 3. Creating user and wallet through Circle's API
      
      console.log('Real Circle OAuth integration would be implemented here');
      throw new Error('Real Circle OAuth integration not yet implemented. Please set up your Circle developer account and configure OAuth settings.');
      
    } catch (error: any) {
      console.error('Google login error:', error);
      
      // Fallback to simulation for development
      if (error.message.includes('not yet implemented')) {
        return this.simulateGoogleLogin();
      }
      
      throw new Error(`Google login failed: ${error.message || 'Authentication cancelled'}`);
    }
  }

  private async simulateGoogleLogin(): Promise<UserTokenResponse> {
    // Simulation for development purposes
    return new Promise((resolve, reject) => {
      const confirmed = window.confirm('🚀 Google Login Simulation\n\nThis is a development simulation of Google OAuth.\nIn production, this would redirect to Google\'s OAuth flow.\n\nClick OK to simulate successful login.');
      
      setTimeout(() => {
        if (confirmed) {
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
            userId: 'sim_user_' + Date.now()
          });
        } else {
          reject(new Error('User cancelled Google login'));
        }
      }, 1000);
    });
  }

  private generateMockAddress(): string {
    // Generate a mock Ethereum address for simulation
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  }

  async createUserAndWallet(userToken: string): Promise<{ userId: string; walletId: string; address: string }> {
    try {
      await this.ensureInitialized();
      
      if (!this.client) {
        throw new Error('Circle client not initialized');
      }

      // Create user through Circle's API
      const userResponse = await this.client.createUser({
        userId: 'user_' + Date.now() // In production, this would come from your auth system
      });

      // The response structure might be different in the actual SDK
      const userId = userResponse.data?.id;
      if (!userId) {
        throw new Error('Failed to create user: No user ID in response');
      }

      // Create wallet for the user
      const walletResponse = await this.client.createWallet({
        userId,
        accountType: 'SCA', // Smart Contract Account
        blockchains: ['ETH'] // Use array of blockchains
      });

      // The wallet data might be in a different property in the response
      // Handle Circle SDK type issues with explicit any casting
      const walletResponse_data = walletResponse.data;
      const walletData = walletResponse_data as any;
      if (!walletData) {
        throw new Error('Failed to create wallet: No wallet data in response');
      }

      const walletId = walletData?.id || 'unknown';
      const address = walletData?.address || 'unknown';
      
      if (walletId === 'unknown' || address === 'unknown') {
        throw new Error('Failed to create wallet: Invalid wallet data in response');
      }

      return {
        userId,
        walletId: walletId,
        address: address
      };
    } catch (error: any) {
      console.error('User and wallet creation error:', error);
      throw new Error(`Failed to create user and wallet: ${error.message}`);
    }
  }

  async restoreSession(): Promise<UserTokenResponse | null> {
    try {
      const storedToken = localStorage.getItem('circleUserToken');
      const storedAddress = localStorage.getItem('circleWalletAddress');
      const storedUserId = localStorage.getItem('circleUserId');

      if (!storedToken || !storedAddress) {
        return null;
      }

      // For simulation, just return stored data
      if (storedToken.startsWith('circle_sim_')) {
        return {
          userToken: storedToken,
          address: storedAddress,
          userId: storedUserId || undefined
        };
      }

      // For real implementation, validate token with Circle's API
      await this.ensureInitialized();
      
      if (!this.client) {
        return {
          userToken: storedToken,
          address: storedAddress,
          userId: storedUserId || undefined
        };
      }

      // Validate with Circle's API (implementation depends on Circle's validation endpoint)
      try {
        // This would be the actual validation call
        // const validation = await this.client.validateUserToken(storedToken);
        
        return {
          userToken: storedToken,
          address: storedAddress,
          userId: storedUserId || undefined
        };
      } catch (error) {
        console.error('Token validation failed:', error);
        this.clearSession();
        return null;
      }
    } catch (error) {
      console.error('Session restoration error:', error);
      this.clearSession();
      return null;
    }
  }

  async getWalletInfo(): Promise<any[]> {
    try {
      const userToken = localStorage.getItem('circleUserToken');
      const userId = localStorage.getItem('circleUserId');
      
      if (!userToken || !userId) {
        throw new Error('No user token or ID found');
      }

      await this.ensureInitialized();
      
      if (!this.client) {
        // Return mock data for simulation
        return [{
          id: 'mock_wallet_id',
          address: localStorage.getItem('circleWalletAddress'),
          blockchain: 'ETH',
          accountType: 'SCA',
          custodyType: 'DEVELOPER',
          userId: userId
        }];
      }

      // Get user's wallets through Circle's API
      const walletsResponse = await this.client.listWallets({
        userId: userId
      });

      return walletsResponse.data?.wallets || [];
    } catch (error: any) {
      console.error('Get wallet info error:', error);
      throw new Error(`Failed to get wallet info: ${error.message}`);
    }
  }

  // Legacy methods for backward compatibility
  async loginWithFacebook(): Promise<UserTokenResponse> {
    throw new Error('Facebook login is not supported. Please use Google login instead.');
  }

  async loginWithApple(): Promise<UserTokenResponse> {
    throw new Error('Apple login is not supported. Please use Google login instead.');
  }

  clearSession(): void {
    localStorage.removeItem('circleUserToken');
    localStorage.removeItem('circleWalletAddress');
    localStorage.removeItem('circleLoginMethod');
    localStorage.removeItem('circleUserId');
    localStorage.removeItem('circleUserEmail');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('circleUserToken') && !!localStorage.getItem('circleWalletAddress');
  }

  getStoredAddress(): string | null {
    return localStorage.getItem('circleWalletAddress');
  }

  getStoredUserToken(): string | null {
    return localStorage.getItem('circleUserToken');
  }

  getLoginMethod(): string | null {
    return localStorage.getItem('circleLoginMethod');
  }

  getUserId(): string | null {
    return localStorage.getItem('circleUserId');
  }

  getUserEmail(): string | null {
    return localStorage.getItem('circleUserEmail');
  }
}

const circleUserWalletService = new CircleUserWalletService();
export default circleUserWalletService;
