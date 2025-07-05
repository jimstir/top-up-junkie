import { UserControlledWalletsClient, initiateUserControlledWalletsClient } from '@circle-fin/user-controlled-wallets';

export interface UserTokenResponse {
  userToken: string;
  address: string;
  userId?: string;
  email?: string;
}

export class CircleWalletService {
  private client: UserControlledWalletsClient | null = null;
  private isInitialized: boolean = false;
  private static instance: CircleWalletService;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): CircleWalletService {
    if (!CircleWalletService.instance) {
      CircleWalletService.instance = new CircleWalletService();
    }
    return CircleWalletService.instance;
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const apiKey = process.env.REACT_APP_CIRCLE_CLIENT_KEY;
      const apiUrl = process.env.REACT_APP_CIRCLE_CLIENT_URL;

      if (!apiKey || !apiUrl) {
        throw new Error('Missing Circle API configuration');
      }

      this.client = await initiateUserControlledWalletsClient({
        apiKey,
        baseUrl: apiUrl
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
    if (!this.client) {
      throw new Error('Circle client not initialized');
    }
  }

  public async loginWithGoogle(): Promise<UserTokenResponse> {
    try {
      await this.ensureInitialized();
      
      if (!this.client) {
        throw new Error('Circle client not initialized');
      }

      const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`;
      const authResult = await this.client.oauth.start({
        provider: 'GOOGLE',
        redirectUri,
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

  public async handleOAuthCallback(code: string, state: string): Promise<UserTokenResponse> {
    try {
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
      this.clearSession();
      throw new Error('Failed to complete OAuth flow');
    }
  }

  private async createWallet(userToken: string): Promise<{ address: string; id: string }> {
    await this.ensureInitialized();
    
    if (!this.client) {
      throw new Error('Circle client not initialized');
    }

    try {
      const response = await this.client.wallets.create({
        userToken,
        accountType: 'SCA', // Smart Contract Account
        blockchains: ['ETH']
      });

      if (!response.wallet) {
        throw new Error('Failed to create wallet');
      }

      return {
        address: response.wallet.address,
        id: response.wallet.id
      };
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw new Error('Failed to create wallet');
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

  public async restoreSession(): Promise<UserTokenResponse | null> {
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

  public clearSession(): void {
    localStorage.removeItem('circleUserToken');
    localStorage.removeItem('circleWalletAddress');
    localStorage.removeItem('oauthState');
  }

  public isAuthenticated(): boolean {
    return !!localStorage.getItem('circleUserToken');
  }

  public getStoredAddress(): string | null {
    return localStorage.getItem('circleWalletAddress');
  }

  public getStoredUserToken(): string | null {
    return localStorage.getItem('circleUserToken');
  }
}

export const circleWalletService = CircleWalletService.getInstance();
