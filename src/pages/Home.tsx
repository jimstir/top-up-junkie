import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import WalletModal from '../components/WalletModal';
import SocialLoginModal from '../components/SocialLoginModal';
import '../styles/Home.css';

const Home = () => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSocialLoginModalOpen, setIsSocialLoginModalOpen] = useState(false);
  const navigate = useNavigate();
  const { 
    connectMetaMask, 
    connectWithGoogle, 
    isConnected 
  } = useWallet();

  const handleConnectWallet = () => {
    if (isConnected) {
      navigate('/dashboard');
    } else {
      setIsWalletModalOpen(true);
    }
  };

  const handleMetaMaskConnect = async () => {
    await connectMetaMask();
    navigate('/dashboard');
  };

  const handleSocialWalletConnect = async () => {
    setIsWalletModalOpen(false);
    setIsSocialLoginModalOpen(true);
  };

  const handleGoogleLogin = async () => {
    await connectWithGoogle();
    navigate('/dashboard');
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>TopUp Junkie</h1>
        <p className="description">A topUp service using USDC</p>
        <button 
          className="connect-button" 
          onClick={handleConnectWallet}
        >
          {isConnected ? 'Go to Dashboard' : 'Connect Wallet'}
        </button>
      </div>
      
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnectMetaMask={handleMetaMaskConnect}
        onConnectSmartAccount={handleSocialWalletConnect}
      />
      
      <SocialLoginModal
        isOpen={isSocialLoginModalOpen}
        onClose={() => setIsSocialLoginModalOpen(false)}
        onGoogleLogin={handleGoogleLogin}
      />
    </div>
  );
};

export default Home;
