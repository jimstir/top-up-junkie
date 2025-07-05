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

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await onGoogleLogin();
      onClose();
    } catch (error: any) {
      console.error('Google login failed:', error);
      const errorMessage = error.message || 'Google login failed. Please try again.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
            <h4>🌟 Circle Smart Wallet</h4>
            <p>Create a secure wallet using your Google account. No passwords or seed phrases to remember!</p>
            <div className="benefits">
              <ul>
                <li>✅ <strong>Easy setup</strong> - Use your Google account</li>
                <li>✅ <strong>Secure</strong> - Powered by Circle's infrastructure</li>
                <li>✅ <strong>No seed phrases</strong> - Recover with Google login</li>
                <li>✅ <strong>Smart contracts</strong> - Advanced transaction capabilities</li>
              </ul>
            </div>
          </div>

          <div className="social-login-options">
            <button
              className="social-login-option google"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <div className="social-login-icon">
                <div className="google-icon">G</div>
              </div>
              <div className="social-login-info-text">
                <h3>Continue with Google</h3>
                <p>Use your Google account to create wallet</p>
              </div>
              {isLoading && (
                <div className="social-login-spinner">⏳</div>
              )}
            </button>

            <div className="development-info">
              <p><small>💡 <strong>Development Mode:</strong> This will simulate Google OAuth for testing. In production, this would redirect to Google's OAuth flow.</small></p>
            </div>
          </div>

          <div className="social-login-disclaimer">
            <p><small>By continuing, you agree to create a wallet managed by Circle. Your Google login is only used for authentication and wallet recovery.</small></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialLoginModal;
