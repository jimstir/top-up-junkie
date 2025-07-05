import React, { createContext, useContext, ReactNode } from 'react';
import { useCircleWallet } from '../hooks/useCircleWallet';

interface CircleWalletContextType {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  walletAddress: string | null;
  userToken: string | null;
  error: string | null;
  
  // Methods
  loginWithGoogle: () => Promise<void>;
  handleOAuthCallback: (code: string, state: string) => Promise<void>;
  logout: () => void;
}

const CircleWalletContext = createContext<CircleWalletContextType | undefined>(undefined);

interface CircleWalletProviderProps {
  children: ReactNode;
}

export const CircleWalletProvider: React.FC<CircleWalletProviderProps> = ({ children }) => {
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

  return (
    <CircleWalletContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        walletAddress,
        userToken,
        error,
        loginWithGoogle,
        handleOAuthCallback,
        logout,
      }}
    >
      {children}
    </CircleWalletContext.Provider>
  );
};

export const useCircleWalletContext = (): CircleWalletContextType => {
  const context = useContext(CircleWalletContext);
  if (context === undefined) {
    throw new Error('useCircleWalletContext must be used within a CircleWalletProvider');
  }
  return context;
};

export default CircleWalletContext;
