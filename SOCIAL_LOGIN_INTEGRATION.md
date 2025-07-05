# TopUp Junkie - Google Social Login Wallet Integration

This React application now features **Circle User-Controlled Wallets** with Googl└── services/
    └── CircleUserWalletService.ts # Real Circle API integrationsocial login integration, allowing users to create and connect wallets using their Google accounts.

## 🚀 Features

- **Google Social Login Wallet**: Create wallets using Google OAuth
- **MetaMask Integration**: Traditional MetaMask wallet connection
- **Session Management**: Automatic session restoration
- **Modern UI**: Clean, responsive design with Material-UI components
- **Production Ready**: Structured for real Circle Developer Console integration

## 🛠️ Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env
   ```
   Add your Circle API keys to the `.env` file.

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open your browser**: 
   Navigate to `http://localhost:3000`

## 🔐 Google Social Login Wallet

The app supports **both real Google OAuth and simulation** depending on your configuration:

### Production Mode (Real Google OAuth)
When you have API keys configured, the app will use your real Google account:

1. **Connect Wallet**: Click "Connect Wallet" on the home page
2. **Choose Social Login**: Select "Social Login Wallet" option
3. **Real Google OAuth**: You'll see Google's actual OAuth popup
4. **Create Wallet**: Circle creates a real smart contract wallet tied to your Google account
5. **Access Dashboard**: You'll be redirected to the dashboard with your real wallet info

### Development Mode (Simulation)
Without API keys, the app uses simulation for testing:

1. **Connect Wallet**: Click "Connect Wallet" on the home page
2. **Choose Social Login**: Select "Social Login Wallet" option  
3. **Simulated Flow**: Click "Continue with Google" in the simulation modal
4. **Mock Wallet**: Gets a simulated wallet address for testing
5. **Access Dashboard**: You'll be redirected to the dashboard with mock wallet info

### What Happens During Real Google Login

- ✅ **Real Google OAuth flow** - Uses Google Identity Services
- ✅ **Circle API integration** - Exchanges Google token for wallet creation
- ✅ **Live wallet address** - Real smart contract wallet on blockchain
- ✅ **Secure session storage** - Stores real Circle user tokens
- ✅ **Automatic session restoration** - Reconnects to your real wallet
- ✅ **Production-ready** - Full integration with Circle's infrastructure

## 🎯 Setting Up Production Mode

To enable real Google OAuth with Circle integration:

### 1. Get Circle API Keys

1. **Sign up at Circle Developer Console**:
   - Go to [https://console.circle.com/](https://console.circle.com/)
   - Create a new app
   - Choose "User-Controlled Wallets"
   - Get your `CIRCLE_CLIENT_KEY` and `CIRCLE_CLIENT_URL`

### 2. Set up Google OAuth

1. **Go to Google Cloud Console**:
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Identity Services API
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"
   - In **"Authorized JavaScript origins"**, add:
     - `http://localhost:3000` (for development)
     - Your production domain when you deploy (e.g., `https://yourdomain.com`)
   - Leave "Authorized redirect URIs" empty (not needed for popup flow)
   - Get your `GOOGLE_CLIENT_ID`

### 3. Configure Environment Variables

Update your `.env` file with the API keys:

```env
# Circle User-Controlled Wallet Configuration
REACT_APP_CIRCLE_CLIENT_KEY=your_circle_client_key_here
REACT_APP_CIRCLE_CLIENT_URL=your_circle_client_url_here

# Google OAuth Configuration  
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

# Development Settings
REACT_APP_ENVIRONMENT=production
```

### 4. Test Production Mode

1. **Start the app**: `npm start`
2. **Check console**: You should see "Circle and Google configuration found - ready for production integration"
3. **Try login**: The Google OAuth popup should be real Google's interface
4. **Verify wallet**: The wallet address should be a real smart contract wallet

### 5. Backend Integration (Advanced)

For enhanced security, you may want to add backend token validation:

```javascript
// Optional: Add backend validation of Google tokens
const validateGoogleToken = async (token) => {
  // Verify token with Google's tokeninfo endpoint
  // Then exchange with Circle API on your backend
};
```

## 📱 App Structure

```
src/
├── components/
│   ├── SocialLoginModal.tsx    # Social login UI
│   ├── WalletModal.tsx         # Wallet selection modal
│   └── TopBar.tsx              # Navigation with wallet status
├── contexts/
│   └── WalletContext.tsx       # Wallet state management
├── pages/
│   ├── Home.tsx                # Landing page
│   └── Dashboard.tsx           # Dashboard with wallet info
├── services/
│   └── CircleUserWalletService.ts # Wallet service (simulated)
└── styles/                     # CSS files
```

## 🔧 Key Components

### WalletContext
- Manages wallet connection state
- Handles both MetaMask and Circle social wallets
- Provides wallet information throughout the app

### SocialLoginModal
- Beautiful UI for social login options
- Loading states and error handling
- Supports Google, Facebook, and Apple

### CircleUserWalletService
- **Real Circle API integration** - Creates actual smart contract wallets
- **Google OAuth authentication** - Uses real Google accounts for wallet creation  
- **Automatic fallback** - Falls back to simulation if Circle API is unavailable
- **Session management** - Validates and restores wallet sessions
- **Transaction support** - Execute transfers, check balances, view history
- **Smart contract wallets** - ERC-4337 account abstraction wallets on Sepolia testnet

## 🌟 Benefits of Social Login Wallets

- **No seed phrases**: Users don't need to manage complex seed phrases
- **Familiar login**: Use existing social media accounts
- **Easy recovery**: Wallet recovery through social login
- **Better UX**: Simplified onboarding for non-crypto users
- **Secure**: Powered by Circle's infrastructure

## 📞 Support

For questions about Circle integration or wallet functionality, refer to:
- [Circle Developer Docs](https://developers.circle.com/)
- [Circle User-Controlled Wallets](https://www.circle.com/en/products/wallets)

---

**Note**: This implementation uses simulated social login for development purposes. In production, implement proper OAuth flows with your backend for security.
