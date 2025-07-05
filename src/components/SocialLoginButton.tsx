import React from 'react';
import { circleWalletService } from '../services/CircleWalletService';

interface SocialLoginButtonProps {
  provider: 'google' | 'facebook' | 'apple';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const providerConfig = {
  google: {
    text: 'Continue with Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
  facebook: {
    text: 'Continue with Facebook',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  apple: {
    text: 'Continue with Apple',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000000">
        <path d="M18.71 19.5c-.83 1.24-1.85 1.5-2.48 1.5-1.14 0-2.52-.93-4.2-.93-1.8 0-3.27.95-4.23.95-.92 0-2.27-1.23-3.13-3.03C3.93 15.15 3 11.97 3 9.25 3 7.5 3.5 6.08 4.5 5.04c.67-.75 1.5-1.14 2.25-1.14 1.08 0 2.04.73 2.94.73.9 0 2.4-.75 3.98-.61.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.82.03 3.02 2.65 4.03 2.68 4.04-.03.1-.5 1.76-1.67 3.48zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.5-2.95 1.35h-.03c-.11-.06-.14-.1-.25-.1-.25.04-.5.08-.76.08-.2 0-.39-.02-.56-.05.06-.01.11-.03.17-.04 1.2-.3 2.05-1.54 2.37-2.15.08-.15.15-.3.21-.45.03-.04.05-.09.08-.13.02-.03.04-.06.06-.09z' />
      </svg>
    ),
  },
};

const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onClick,
  disabled = false,
  className = '',
}) => {
  const handleClick = async () => {
    if (onClick) {
      onClick();
    }

    try {
      if (provider === 'google') {
        await circleWalletService.loginWithGoogle();
      } else {
        console.warn(`${provider} login not implemented yet`);
      }
    } catch (error) {
      console.error(`${provider} login failed:`, error);
    }
  };

  const config = providerConfig[provider];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center justify-center w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
    >
      <span className="mr-2">{config.icon}</span>
      <span>{config.text}</span>
    </button>
  );
};

export default SocialLoginButton;
