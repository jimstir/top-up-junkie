# Circle Social Wallet Integration

This document outlines the Circle social wallet integration in the application, including setup instructions and usage examples.

## Setup

1. **Environment Variables**
   Copy the `.env.example` file to `.env.local` and fill in your Circle and Google OAuth credentials:
   ```bash
   cp .env.example .env.local
   ```

2. **Required Environment Variables**
   ```
   # Circle API Configuration
   REACT_APP_CIRCLE_CLIENT_KEY=your_circle_client_key_here
   REACT_APP_CIRCLE_CLIENT_URL=your_circle_client_url_here
   
   # Google OAuth Configuration
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
   REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
   ```

## Components

### 1. CircleWalletService

The main service that handles all Circle wallet operations:

```typescript
import { circleWalletService } from './services/CircleWalletService';

// Login with Google
await circleWalletService.loginWithGoogle();

// Handle OAuth callback (in your callback component)
await circleWalletService.handleOAuthCallback(code, state);

// Check authentication status
const isAuthenticated = circleWalletService.isAuthenticated();

// Get wallet address
const address = circleWalletService.getStoredAddress();

// Logout
circleWalletService.clearSession();
```

### 2. useCircleWallet Hook

A custom React hook for managing wallet state:

```typescript
import { useCircleWallet } from './hooks/useCircleWallet';

function MyComponent() {
  const {
    isAuthenticated,
    isLoading,
    walletAddress,
    userToken,
    error,
    loginWithGoogle,
    handleOAuthCallback,
    logout,
  } = useCircleWallet();
  
  // ...
}
```

### 3. CircleWalletProvider

A context provider for wallet state management:

```tsx
import { CircleWalletProvider } from './contexts/CircleWalletContext';

function App() {
  return (
    <CircleWalletProvider>
      <YourApp />
    </CircleWalletProvider>
  );
}
```

### 4. SocialLoginButton

A reusable button component for social login:

```tsx
import SocialLoginButton from './components/SocialLoginButton';

function LoginPage() {
  return (
    <div>
      <SocialLoginButton 
        provider="google" 
        onClick={() => console.log('Login clicked')}
      />
    </div>
  );
}
```

## Authentication Flow

1. User clicks the Google login button
2. User is redirected to Google OAuth consent screen
3. After authentication, user is redirected back to `/auth/callback`
4. The `AuthCallback` component handles the OAuth callback
5. User is redirected to the dashboard on success

## Error Handling

All methods throw errors that can be caught and handled appropriately:

```typescript
try {
  await loginWithGoogle();
} catch (error) {
  console.error('Login failed:', error);
  // Show error message to user
}
```

## Session Management

- User sessions are stored in `localStorage`
- Sessions are automatically restored when the app loads
- Call `logout()` to clear the session

## Security Considerations

- Always use HTTPS in production
- Validate OAuth state parameter to prevent CSRF attacks
- Handle token expiration and refresh tokens appropriately
- Never expose API keys in client-side code (use environment variables)

## Testing

1. Set `REACT_APP_ENVIRONMENT=development` for development mode
2. Use the test credentials provided by Circle
3. Test the complete OAuth flow end-to-end

## Troubleshooting

- Check the browser console for errors
- Verify that all environment variables are set correctly
- Ensure the redirect URI is whitelisted in your Circle dashboard
- Check network requests in the browser's developer tools
