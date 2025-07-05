import React, { useState } from 'react';
import './WalletModal.css';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectMetaMask: () => Promise<void>;
  onConnectSmartAccount: () => Promise<void>;
}

const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onConnectMetaMask,
  onConnectSmartAccount,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingType, setConnectingType] = useState<'metamask' | 'smart' | null>(null);

  if (!isOpen) return null;

  const handleMetaMaskConnect = async () => {
    setIsConnecting(true);
    setConnectingType('metamask');
    try {
      await onConnectMetaMask();
      onClose();
    } catch (error) {
      console.error('MetaMask connection failed:', error);
    } finally {
      setIsConnecting(false);
      setConnectingType(null);
    }
  };

  const handleSmartAccountConnect = async () => {
    setIsConnecting(true);
    setConnectingType('smart');
    try {
      await onConnectSmartAccount();
      onClose();
    } catch (error) {
      console.error('Smart Account connection failed:', error);
    } finally {
      setIsConnecting(false);
      setConnectingType(null);
    }
  };

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="wallet-modal-header">
          <h2>Connect Wallet</h2>
          <button className="wallet-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="wallet-modal-body">
          <div className="wallet-options">
            <button
              className="wallet-option"
              onClick={handleMetaMaskConnect}
              disabled={isConnecting}
            >
              <div className="wallet-option-icon">
                <div className="metamask-icon">🦊</div>
              </div>
              <div className="wallet-option-info">
                <h3>MetaMask</h3>
                <p>Connect using MetaMask wallet</p>
              </div>
              {isConnecting && connectingType === 'metamask' && (
                <div className="wallet-option-spinner">⏳</div>
              )}
            </button>

            <button
              className="wallet-option"
              onClick={handleSmartAccountConnect}
              disabled={isConnecting}
            >
              <div className="wallet-option-icon">
                <div className="smart-account-icon">👤</div>
              </div>
              <div className="wallet-option-info">
                <h3>Social Login Wallet</h3>
                <p>Connect using Google, Facebook, or Apple</p>
              </div>
              {isConnecting && connectingType === 'smart' && (
                <div className="wallet-option-spinner">⏳</div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
