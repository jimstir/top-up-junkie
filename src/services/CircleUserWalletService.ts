import { 
  CircleUserControlledWalletsClient, 
  initiateUserControlledWalletsClient,
  OAuthProvider
} from '@circle-fin/user-controlled-wallets';

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
        process.env.REACT_APP_CIRCLE_CLIENT_URL &&
        process.env.REACT_APP_GOOGLE_CLIENT_ID
      );
      
      if (!hasRequiredConfig) {
        console.error('Missing required Circle or Google configuration');
        return;
      }

      this.client = await initiateUserControlledWalletsClient({
        apiKey: process.env.REACT_APP_CIRCLE_CLIENT_KEY,
        baseUrl: process.env.REACT_APP_CIRCLE_CLIENT_URL
      });
      
      this.isInitialized = true;
      console.log('Circle client initialized successfully');
        console.log('5. Add REACT_APP_GOOGLE_CLIENT_ID to your .env file');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Circle service:', error);
      this.isInitialized = true; // Continue with simulation
    }
  }

  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if Google API is already loaded
      if (window.google && window.google.accounts) {
        this.googleLoaded = true;
        resolve();
        return;
      }

      // Load Google Identity Services
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        // Initialize Google Identity Services
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: this.handleGoogleCallback.bind(this),
        });
        this.googleLoaded = true;
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load Google Identity Services');
        reject(new Error('Failed to load Google API'));
      };
      document.head.appendChild(script);
    });
  }

  private handleGoogleCallback(response: GoogleCredentialResponse): void {
    // This callback is used by Google's One Tap flow
    // For manual login, we handle the response in loginWithGoogle
    console.log('Google callback received:', response);
  }

  async loginWithGoogle(): Promise<UserTokenResponse> {
    try {
      await this.ensureInitialized();
      
      if (!this.client) {
        throw new Error('Circle client not initialized');
      }

      const authResult = await this.client.oauth.start({
        provider: OAuthProvider.GOOGLE,
        redirectUri: process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`,
        scopes: ['email', 'profile']
      });

      if (!authResult.url) {
        throw new Error('Failed to get OAuth URL');
      }

      // Store the OAuth state for validation after callback
      localStorage.setItem('oauthState', authResult.state);
      
      // Redirect to OAuth URL
      window.location.href = authResult.url;
      
      // This return is just a fallback, the actual flow will be handled by the callback
      return {
        userToken: '',
        address: ''
      };
    } catch (error) {
      console.error('Google login failed:', error);
      throw new Error('Failed to initiate Google login');
    }
  }

  private async handleOAuthCallback(code: string, state: string): Promise<UserTokenResponse> {
    await this.ensureInitialized();
    
    if (!this.client) {
      throw new Error('Circle client not initialized');
    }

    // Verify state to prevent CSRF
    const savedState = localStorage.getItem('oauthState');
    if (state !== savedState) {
      throw new Error('Invalid OAuth state');
    }
    localStorage.removeItem('oauthState');

    try {
      // Exchange authorization code for user token
      const tokenResponse = await this.client.oauth.token({
        code,
        redirectUri: process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`
      });

      if (!tokenResponse.userToken) {
        throw new Error('Failed to authenticate with OAuth provider');
      }

      // Store the user token
      localStorage.setItem('circleUserToken', tokenResponse.userToken);
      
      // Get or create user and wallet
      let walletAddress = '';
      const wallets = await this.getWallets(tokenResponse.userToken);
      
      if (wallets.length > 0) {
        walletAddress = wallets[0].address;
      } else {
        const newWallet = await this.createWallet(tokenResponse.userToken);
        walletAddress = newWallet.address;
      }

      // Store wallet info
      localStorage.setItem('circleWalletAddress', walletAddress);
      
      return {
        userToken: tokenResponse.userToken,
        address: walletAddress,
        userId: tokenResponse.userId,
        email: tokenResponse.userEmail
      };
    } catch (error) {
      console.error('OAuth callback failed:', error);
      throw new Error('Failed to complete OAuth flow');
    }
  }

  private async createWallet(userToken: string): Promise<{ address: string }> {
    await this.ensureInitialized();
    
    if (!this.client) {
      throw new Error('Circle client not initialized');
    }

    try {
      const response = await this.client.wallets.create({
        userToken,
        blockchain: 'ETH',
        accountType: 'SCA' // Smart Contract Account
      });
      
      return response.wallet;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw error;
    }
  }

  private async getWallets(userToken: string): Promise<Array<{ address: string; id: string }>> {
    await this.ensureInitialized();
    
    if (!this.client) {
      throw new Error('Circle client not initialized');
    }

    try {
      const response = await this.client.wallets.list({
        userToken
      });
      
      return response.wallets || [];
    } catch (error) {
      console.error('Failed to get wallets:', error);
      return [];
    }
  }

  async restoreSession(): Promise<UserTokenResponse | null> {
    const userToken = localStorage.getItem('circleUserToken');
    const address = localStorage.getItem('circleWalletAddress');

    if (!userToken || !address) {
      return null;
    }

    try {
      await this.ensureInitialized();
      
      // Verify the token is still valid by making an API call
      const wallets = await this.getWallets(userToken);
      const wallet = wallets.find(w => w.address === address);
      
      if (!wallet) {
        this.clearSession();
        return null;
      }

      return {
        userToken,
        address,
        userId: wallet.id
      };
    } catch (error) {
      console.error('Failed to restore session:', error);
      this.clearSession();
      return null;
    }
  }

  clearSession(): void {
    localStorage.removeItem('circleUserToken');
    localStorage.removeItem('circleWalletAddress');
    localStorage.removeItem('oauthState');
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

  getStoredWalletId(): string | null {
    return localStorage.getItem('circleWalletId');
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

  getWalletSetId(): string | null {
    return localStorage.getItem('circleWalletSetId');
  }

  // Development helper methods
  isDevelopmentMode(): boolean {
    const token = localStorage.getItem('circleUserToken');
    return token ? (token.startsWith('circle_dev_') || token.startsWith('circle_fallback_')) : false;
  }

  isRealCircleWallet(): boolean {
    const token = localStorage.getItem('circleUserToken');
    return token ? !token.startsWith('circle_dev_') && !token.startsWith('circle_fallback_') : false;
  }

  getIntegrationStatus(): string {
    const hasCircleConfig = !!(
      process.env.REACT_APP_CIRCLE_CLIENT_KEY && 
      process.env.REACT_APP_CIRCLE_CLIENT_URL
    );
    
    const hasGoogleConfig = !!(
      process.env.REACT_APP_GOOGLE_CLIENT_ID
    );
    
    if (hasCircleConfig && hasGoogleConfig) {
      return this.isRealCircleWallet() ? 
        'Production mode (Real Circle smart contract wallet)' : 
        'Ready for production (Circle configured)';
    } else {
      return 'Development mode (Circle not configured)';
    }
  }

  getWalletType(): string {
    if (this.isRealCircleWallet()) {
      return 'Circle Smart Contract Wallet (Real)';
    } else if (this.isDevelopmentMode()) {
      return 'Circle Smart Contract Wallet (Simulated)';
    } else {
      return 'Unknown';
    }
  }
}

const circleUserWalletService = new CircleUserWalletService();
export default circleUserWalletService;
