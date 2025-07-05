import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, IconButton, Button, Typography, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useWallet } from '../contexts/WalletContext';
import WalletDropdown from './WalletDropdown';
import WalletModal from './WalletModal';
import SocialLoginModal from './SocialLoginModal';
import '../styles/TopBar.css';

const TopBar = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSocialLoginModalOpen, setIsSocialLoginModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get wallet state and methods from context
  const wallet = useWallet();
  const { 
    isConnected, 
    address, 
    network,
    usdcBalance,
    connect: connectWallet, 
    disconnect: disconnectWallet, 
    connectMetaMask, 
    connectWithGoogle, 
    copyToClipboard, 
    refreshBalance 
  } = wallet;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWalletDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const handleConnect = async (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event bubbling
    
    if (isConnected) {
      // Toggle dropdown visibility when wallet is connected
      setShowWalletDropdown(!showWalletDropdown);
      return;
    }
    
    // Show wallet modal if not connected
    setIsWalletModalOpen(true);
  };

  const handleMetaMaskConnect = async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        window.open('https://metamask.io/download.html', '_blank', 'noopener,noreferrer');
        throw new Error('Please install MetaMask to connect your wallet');
      }
      
      // Request account access if needed
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error('No account selected');
      }
      
      // Connect using the context's connect function
      await connectMetaMask();
      setIsWalletModalOpen(false);
      
      // Navigate to dashboard if not already there
      if (!location.pathname.includes('/dashboard')) {
        navigate('/dashboard');
      }
      
    } catch (error: any) {
      console.error('Failed to connect MetaMask:', error);
      // Show error message to user
      alert(`Failed to connect MetaMask: ${error.message || 'Please check the browser console for details'}`);
      
      // If the error indicates that the user rejected the request, we can handle it specifically
      if (error.code === 4001) {
        console.log('User rejected the connection request');
      }
    }
  };

  const handleSocialWalletConnect = async () => {
    setIsWalletModalOpen(false);
    setIsSocialLoginModalOpen(true);
  };

  const handleGoogleLogin = async () => {
    try {
      await connectWithGoogle();
      setIsSocialLoginModalOpen(false);
      if (!location.pathname.includes('/dashboard')) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Failed to connect with Google:', error);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowWalletDropdown(false);
  };

  const handleCopyAddress = () => {
    if (address) {
      copyToClipboard(address);
      // Could show a toast notification here
    }
  };

  const handleSwitchWallet = () => {
    setShowWalletDropdown(false);
    setIsWalletModalOpen(true);
  };

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 3 }, minHeight: '64px' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              mr: 4,
            }}
          >
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              TOP-UP JUNKIE
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, flexGrow: 1 }}>
            <Button
              component={Link}
              to="/dashboard"
              color={location.pathname === '/dashboard' ? 'primary' : 'inherit'}
              sx={{
                fontWeight: location.pathname === '/dashboard' ? 600 : 400,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              Dashboard
            </Button>
            <Button
              component={Link}
              to="/services"
              color={location.pathname === '/services' ? 'primary' : 'inherit'}
              sx={{
                fontWeight: location.pathname === '/services' ? 600 : 400,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              Services
            </Button>
          </Box>

          <Box position="relative" ref={dropdownRef}>
            <Button
              variant={isConnected ? 'outlined' : 'contained'}
              color="primary"
              onClick={handleConnect}
              startIcon={isConnected ? <AccountBalanceWalletIcon /> : null}
              endIcon={isConnected ? <ExpandMoreIcon /> : null}
              sx={{
                textTransform: 'none',
                borderRadius: '12px',
                px: 2,
                py: 1,
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                fontWeight: 500,
                position: 'relative',
                zIndex: 1,
                ...(isConnected && {
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                  },
                }),
              }}
            >
              {isConnected ? (
                <Box>
                  <Box component="span" sx={{ mr: 1 }}>
                    {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : ''}
                  </Box>
                  <Box 
                    component="span" 
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      bgcolor: 'success.light',
                      color: 'success.dark',
                      fontSize: '0.75rem',
                      px: 1,
                      py: 0.25,
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}
                  >
                    {network || 'Unknown'}
                  </Box>
                </Box>
              ) : (
                'Connect Wallet'
              )}
            </Button>
            
            {/* Wallet Dropdown */}
            {isConnected && showWalletDropdown && address && (
              <WalletDropdown
                address={address}
                network={network || 'Ethereum Sepolia'}
                balance={usdcBalance || '0.00'}
                onDisconnect={handleDisconnect}
                onCopyAddress={handleCopyAddress}
                onSwitchWallet={handleSwitchWallet}
              />
            )}
          </Box>
        </Toolbar>
      </AppBar>

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
    </>
  );
};

export default TopBar;
