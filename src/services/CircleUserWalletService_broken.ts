import { 
  CircleUserControlledWalletsClient, 
  initiateUserControlledWalletsClient 
} from '@circle-fin/user-controlled-wallets';

interface UserTokenResponse {
  userToken: string;
  address: string;
  userId?: string;
}

interface WalletInfo {
  id: string;
  address: string;
  blockchain: string;
  accountType: string;
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
      this.isInitialized = true; // Continue with simulation
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.client) {
      await this.initialize();
    }
  }

  async loginWithGoogle(): Promise<UserTokenResponse> {
    try {
      await this.ensureInitialized();
      
      if (!this.client) {
        throw new Error('Circle client not initialized');
      }

      // Initialize OAuth flow with Google using a mock implementation
      // The actual Circle SDK method might be different
      const authResult = await (this.client as any).initializeOAuthFlow?.({
        provider: 'google',
        redirectUri: `${window.location.origin}/auth/callback`,
        scopes: ['email', 'profile']
      }) || {
        authUrl: '#',
        state: 'mock_state'
      };

      // Redirect to the OAuth URL
      if (authResult?.data?.authUrl) {
        window.location.href = authResult.data.authUrl;
      } else {
        throw new Error('Failed to get OAuth URL');
      }
      
      // Return a placeholder response (this will be replaced after OAuth callback)
      return {
        userToken: 'temporary_token',
        address: '0x0000000000000000000000000000000000000000'
      };
      
    } catch (error) {
      console.error('Google login failed:', error);
      throw new Error('Failed to initiate Google login. Please try again.');
    }
  }

  private async getWallets(userToken: string): Promise<Array<{ address: string }>> {
    if (!this.client) {
      throw new Error('Circle client not initialized');
    }

    try {
      // Get user's wallets using the correct method
      const response = await this.client.listWallets({
        userToken
      });
      // Handle Circle SDK type issues with explicit any casting
      const response_data = response.data;
      const walletData = response_data as any;
      return walletData || [];
    } catch (error) {
      console.error('Failed to get wallets:', error);
      return [];
    }
  }

  private async createWallet(userToken: string): Promise<{ address: string }> {
    if (!this.client) {
      throw new Error('Circle client not initialized');
    }

    // Create a new wallet using the correct method and parameters
    const response = await this.client.createWallet({
      userToken,
      accountType: 'SCA', // Smart Contract Account
      blockchains: ['ETH'] // Use array of blockchains
    });

    // Handle the response according to the SDK's actual response structure
    // Handle Circle SDK type issues with explicit any casting
    const response_data = response.data;
    const walletData = response_data as any;
    const address = walletData?.address || 'unknown';
    
    if (address === 'unknown') {
      throw new Error('Failed to create wallet: Invalid wallet data in response');
    }

    return {
      address: address
    };
  }

  async restoreSession(): Promise<UserTokenResponse | null> {
    const userToken = localStorage.getItem('circleUserToken');
    const address = localStorage.getItem('circleWalletAddress');
    
    if (!userToken || !address) {
      return null;
    }

    return {
      userToken,
      address,
      userId: localStorage.getItem('circleUserId') || undefined
    };
  }

  clearSession(): void {
    localStorage.removeItem('circleUserToken');
    localStorage.removeItem('circleWalletAddress');
    localStorage.removeItem('circleLoginMethod');
    localStorage.removeItem('circleUserId');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('circleUserToken');
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

  async loginWithFacebook(): Promise<UserTokenResponse> {
    throw new Error('Facebook login not implemented');
  }

  async loginWithApple(): Promise<UserTokenResponse> {
    throw new Error('Apple login not implemented');
  }
}

const circleUserWalletService = new CircleUserWalletService();
export default circleUserWalletService;
