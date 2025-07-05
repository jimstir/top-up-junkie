import React, { useState } from 'react';
import './SocialLoginModal.css';

interface SocialLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleLogin: () => Promise<void>;
}

const SocialLoginModal: React.FC<SocialLoginModalProps> = ({
  isOpen,
  onClose,
  onGoogleLogin,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSocialLogin = async (provider: string, loginFn: () => Promise<void>) => {
    setLoadingProvider(provider);
    setIsLoading(true);
    try {
      await loginFn();
      onClose();
    } catch (error: any) {
      console.error(`${provider} login failed:`, error);
      const errorMessage = error.message || `${provider} login failed. Please try again.`;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  // Placeholder functions for other providers
  const onFacebookLogin = async () => {
    throw new Error('Facebook login not implemented');
  };

  const onAppleLogin = async () => {
    throw new Error('Apple login not implemented');
  };

  return (
    <div className="social-login-modal-overlay" onClick={onClose}>
      <div className="social-login-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="social-login-modal-header">
          <h2>Create Smart Wallet</h2>
          <button className="social-login-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="social-login-modal-body">
          <div className="social-login-info">
            <h4>🌟 Social Login Wallet</h4>
            <p>Create a secure wallet using your existing social media accounts. No passwords or seed phrases to remember!</p>
            <div className="benefits">
              <ul>
                <li>✅ <strong>Easy setup</strong> - Use your existing accounts</li>
                <li>✅ <strong>Secure</strong> - Powered by Circle's technology</li>
                <li>✅ <strong>No seed phrases</strong> - Recover with social login</li>
                <li>✅ <strong>Gasless transactions</strong> - No crypto needed for fees</li>
              </ul>
            </div>
          </div>

          <div className="social-login-options">
            <button
              className="social-login-option google"
              onClick={() => handleSocialLogin('google', onGoogleLogin)}
              disabled={isLoading}
            >
              <div className="social-login-icon">
                <div className="google-icon">G</div>
              </div>
              <div className="social-login-info-text">
                <h3>Continue with Google</h3>
                <p>Use your Google account to create wallet</p>
              </div>
              {isLoading && loadingProvider === 'google' && (
                <div className="social-login-spinner">⏳</div>
              )}
            </button>

            <button
              className="social-login-option facebook"
              onClick={() => handleSocialLogin('facebook', onFacebookLogin)}
              disabled={isLoading}
            >
              <div className="social-login-icon">
                <div className="facebook-icon">f</div>
              </div>
              <div className="social-login-info-text">
                <h3>Continue with Facebook</h3>
                <p>Use your Facebook account to create wallet</p>
              </div>
              {isLoading && loadingProvider === 'facebook' && (
                <div className="social-login-spinner">⏳</div>
              )}
            </button>

            <button
              className="social-login-option apple"
              onClick={() => handleSocialLogin('apple', onAppleLogin)}
              disabled={isLoading}
            >
              <div className="social-login-icon">
                <div className="apple-icon">🍎</div>
              </div>
              <div className="social-login-info-text">
                <h3>Continue with Apple</h3>
                <p>Use your Apple ID to create wallet</p>
              </div>
              {isLoading && loadingProvider === 'apple' && (
                <div className="social-login-spinner">⏳</div>
              )}
            </button>
          </div>

          <div className="social-login-disclaimer">
            <p><small>By continuing, you agree to create a wallet managed by Circle. Your social login is only used for authentication and wallet recovery.</small></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialLoginModal;
