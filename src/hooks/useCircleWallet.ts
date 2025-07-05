import { useState, useEffect, useCallback } from 'react';
import { circleWalletService, UserTokenResponse } from '../services/CircleWalletService';

export const useCircleWallet = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        setIsLoading(true);
        const session = await circleWalletService.restoreSession();
        
        if (session) {
          setIsAuthenticated(true);
          setWalletAddress(session.address);
          setUserToken(session.userToken);
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
        setError('Failed to restore wallet session');
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<UserTokenResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await circleWalletService.loginWithGoogle();
      return result;
    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleOAuthCallback = useCallback(async (code: string, state: string): Promise<UserTokenResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await circleWalletService.handleOAuthCallback(code, state);
      
      setIsAuthenticated(true);
      setWalletAddress(result.address);
      setUserToken(result.userToken);
      
      return result;
    } catch (err) {
      console.error('OAuth callback failed:', err);
      setError('Failed to complete authentication');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    circleWalletService.clearSession();
    setIsAuthenticated(false);
    setWalletAddress(null);
    setUserToken(null);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    walletAddress,
    userToken,
    error,
    loginWithGoogle,
    handleOAuthCallback,
    logout,
  };
};

export default useCircleWallet;
