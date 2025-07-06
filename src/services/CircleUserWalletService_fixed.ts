import { 
  CircleUserControlledWalletsClient, 
  initiateUserControlledWalletsClient
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
}

// Export singleton instance
export const circleUserWalletService = new CircleUserWalletService();
export default CircleUserWalletService;
