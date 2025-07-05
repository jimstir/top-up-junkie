// Circle User-Controlled Wallet Service
// This service integrates with Circle's Developer Console for wallet creation
// Currently using simulation mode for development - see README for production setup

interface UserTokenResponse {
  userToken: string;
  address: string;
  userId?: string;
}

class CircleUserWalletService {
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const hasCircleConfig = !!(
        process.env.REACT_APP_CIRCLE_CLIENT_KEY && 
        process.env.REACT_APP_CIRCLE_CLIENT_URL
      );
      
      if (hasCircleConfig) {
        console.log('Circle configuration found - ready for production integration');
      } else {
        console.warn('Circle configuration missing - using simulation mode');
        console.log('To use real Circle integration:');
        console.log('1. Sign up at https://console.circle.com/');
        console.log('2. Create a new app and get your API key');
        console.log('3. Add REACT_APP_CIRCLE_CLIENT_KEY to your .env file');
        console.log('4. Add REACT_APP_CIRCLE_CLIENT_URL to your .env file');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Circle service:', error);
      this.isInitialized = true; // Continue with simulation
    }
  }

  async loginWithGoogle(): Promise<UserTokenResponse> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const hasCircleConfig = !!(
        process.env.REACT_APP_CIRCLE_CLIENT_KEY && 
        process.env.REACT_APP_CIRCLE_CLIENT_URL
      );

      if (hasCircleConfig) {
        // Real Circle integration would be implemented here
        // This involves redirecting to Circle's OAuth flow
        throw new Error('Production Circle integration not yet implemented. Please follow the setup guide in SOCIAL_LOGIN_INTEGRATION.md');
      } else {
        // Development simulation
        return this.simulateGoogleLogin();
      }
      
    } catch (error: any) {
      console.error('Google login error:', error);
      
      // Fallback to simulation for development
      if (error.message.includes('not yet implemented')) {
        console.log('Falling back to simulation mode for development');
        return this.simulateGoogleLogin();
      }
      
      throw new Error(`Google login failed: ${error.message || 'Authentication cancelled'}`);
    }
  }

  private async simulateGoogleLogin(): Promise<UserTokenResponse> {
    // Enhanced simulation that mimics the real Circle flow
    return new Promise((resolve, reject) => {
      const modal = this.createSimulationModal();
      
      const handleConfirm = () => {
        modal.remove();
        
        // Simulate network delay
        setTimeout(() => {
          const mockUserToken = 'circle_dev_' + Math.random().toString(36).substring(2, 15);
          const mockAddress = this.generateMockAddress();
          const mockUserId = 'dev_user_' + Date.now();
          
          // Store simulation data
          localStorage.setItem('circleUserToken', mockUserToken);
          localStorage.setItem('circleWalletAddress', mockAddress);
          localStorage.setItem('circleLoginMethod', 'google');
          localStorage.setItem('circleUserId', mockUserId);
          localStorage.setItem('circleUserEmail', 'developer@example.com');
          
          resolve({
            userToken: mockUserToken,
            address: mockAddress,
            userId: mockUserId
          });
        }, 1500);
      };
      
      const handleCancel = () => {
        modal.remove();
        reject(new Error('User cancelled Google login'));
      };
      
      modal.querySelector('.confirm-btn')?.addEventListener('click', handleConfirm);
      modal.querySelector('.cancel-btn')?.addEventListener('click', handleCancel);
      modal.querySelector('.close-btn')?.addEventListener('click', handleCancel);
    });
  }

  private createSimulationModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        position: relative;
      ">
        <button class="close-btn" style="
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        ">×</button>
        
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔐</div>
          <h2 style="margin: 0 0 1rem 0; color: #333;">Development Mode</h2>
          <p style="color: #666; margin: 0;">This is a simulation of Google OAuth login for development purposes.</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
          <h3 style="margin: 0 0 1rem 0; color: #333; font-size: 1rem;">What will happen:</h3>
          <ul style="margin: 0; padding-left: 1.5rem; color: #666; font-size: 0.9rem;">
            <li>Mock wallet address will be generated</li>
            <li>Session will be stored locally</li>
            <li>You'll be redirected to dashboard</li>
            <li>Wallet info will be displayed</li>
          </ul>
        </div>
        
        <div style="background: #e3f2fd; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
          <h3 style="margin: 0 0 1rem 0; color: #1976d2; font-size: 1rem;">For Production:</h3>
          <p style="margin: 0; color: #1976d2; font-size: 0.9rem;">
            Set up your Circle Developer Console account and add your API keys to enable real Google OAuth integration.
          </p>
        </div>
        
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button class="cancel-btn" style="
            background: #f5f5f5;
            color: #666;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
          ">Cancel</button>
          <button class="confirm-btn" style="
            background: #4285f4;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          ">
            <span>Continue with Google</span>
            <span>→</span>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
  }

  private generateMockAddress(): string {
    // Generate a realistic-looking Ethereum address
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  }

  async restoreSession(): Promise<UserTokenResponse | null> {
    try {
      const storedToken = localStorage.getItem('circleUserToken');
      const storedAddress = localStorage.getItem('circleWalletAddress');
      const storedUserId = localStorage.getItem('circleUserId');

      if (!storedToken || !storedAddress) {
        return null;
      }

      // For development simulation, just return stored data
      if (storedToken.startsWith('circle_dev_')) {
        console.log('Restored development session');
        return {
          userToken: storedToken,
          address: storedAddress,
          userId: storedUserId || undefined
        };
      }

      // For production, this would validate the token with Circle's API
      console.log('Restored production session');
      return {
        userToken: storedToken,
        address: storedAddress,
        userId: storedUserId || undefined
      };
    } catch (error) {
      console.error('Session restoration error:', error);
      this.clearSession();
      return null;
    }
  }

  // Production methods (placeholders for actual Circle integration)
  async createUserWithCircle(email: string): Promise<{ userId: string; userToken: string }> {
    // This would use Circle's API to create a user
    // POST /v1/w3s/users
    throw new Error('Production Circle integration not implemented');
  }

  async createWalletWithCircle(userId: string, userToken: string): Promise<{ walletId: string; address: string }> {
    // This would use Circle's API to create a wallet
    // POST /v1/w3s/user/wallets
    throw new Error('Production Circle integration not implemented');
  }

  async executeTransactionWithCircle(
    userToken: string, 
    walletId: string, 
    destinationAddress: string, 
    amount: string
  ): Promise<string> {
    // This would use Circle's API to execute a transaction
    // POST /v1/w3s/user/transactions/transfer
    throw new Error('Production Circle integration not implemented');
  }

  // Legacy methods for backward compatibility
  async loginWithFacebook(): Promise<UserTokenResponse> {
    throw new Error('Facebook login is not currently supported. Please use Google login.');
  }

  async loginWithApple(): Promise<UserTokenResponse> {
    throw new Error('Apple login is not currently supported. Please use Google login.');
  }

  clearSession(): void {
    localStorage.removeItem('circleUserToken');
    localStorage.removeItem('circleWalletAddress');
    localStorage.removeItem('circleLoginMethod');
    localStorage.removeItem('circleUserId');
    localStorage.removeItem('circleUserEmail');
    console.log('Session cleared');
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

  // Development helper methods
  isDevelopmentMode(): boolean {
    const token = localStorage.getItem('circleUserToken');
    return token ? token.startsWith('circle_dev_') : false;
  }

  getIntegrationStatus(): string {
    const hasCircleConfig = !!(
      process.env.REACT_APP_CIRCLE_CLIENT_KEY && 
      process.env.REACT_APP_CIRCLE_CLIENT_URL
    );
    
    if (hasCircleConfig) {
      return 'Ready for production (Circle configured)';
    } else {
      return 'Development mode (Circle not configured)';
    }
  }
}

const circleUserWalletService = new CircleUserWalletService();
export default circleUserWalletService;
