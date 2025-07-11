import React from 'react';
import { Box, Typography, Button, Divider, IconButton } from '@mui/material';
import { ContentCopy, Logout, SwapHoriz } from '@mui/icons-material';

interface WalletDropdownProps {
  address: string | null;
  network: string;
  balance: string;
  ethBalance: string;
  onDisconnect: () => void;
  onCopyAddress: () => void;
  onSwitchWallet: () => void;
  onAddUSDC?: () => void;
  onDebugWallet?: () => void;
}

const WalletDropdown: React.FC<WalletDropdownProps> = ({
  address,
  network,
  balance,
  ethBalance,
  onDisconnect,
  onCopyAddress,
  onSwitchWallet,
  onAddUSDC,
  onDebugWallet,
}) => {
  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: '320px',
        backgroundColor: 'background.paper',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        zIndex: 1300,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Wallet Info Section */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Connected with {network}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body1" fontWeight={500}>
            {formatAddress(address)}
          </Typography>
          <IconButton size="small" onClick={onCopyAddress}>
            <ContentCopy fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      {/* Balance Section */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Balances
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Sepolia ETH
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {ethBalance} ETH
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              USDC
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {balance} USDC
            </Typography>
          </Box>
          {parseFloat(ethBalance) < 0.001 && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
              ⚠️ Low ETH balance - may not cover gas fees
            </Typography>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Network Section */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Network
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1.5,
            borderRadius: '8px',
            bgcolor: 'action.hover',
          }}
        >
          <Box
            sx={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              bgcolor: network === 'Ethereum Sepolia' ? 'success.main' : 'warning.main',
              mr: 1.5,
            }}
          />
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {network}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {network === 'Ethereum Sepolia' ? 'Testnet' : 'Unsupported Network'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Actions */}
      <Box sx={{ p: 1 }}>
        {onAddUSDC && (
          <Button
            fullWidth
            onClick={onAddUSDC}
            sx={{
              justifyContent: 'flex-start',
              py: 1.5,
              px: 2,
              color: 'text.primary',
              textTransform: 'none',
              fontWeight: 400,
              fontSize: '0.875rem',
              mb: 0.5,
            }}
          >
            Add USDC Token to Wallet
          </Button>
        )}
        <Button
          fullWidth
          startIcon={<SwapHoriz />}
          onClick={onSwitchWallet}
          sx={{
            justifyContent: 'flex-start',
            py: 1.5,
            px: 2,
            color: 'text.primary',
            textTransform: 'none',
            fontWeight: 400,
            fontSize: '0.9375rem',
            mb: 0.5,
          }}
        >
          Switch Wallet
        </Button>
        {onDebugWallet && (
          <Button
            fullWidth
            onClick={onDebugWallet}
            sx={{
              justifyContent: 'flex-start',
              py: 1.5,
              px: 2,
              color: 'text.secondary',
              textTransform: 'none',
              fontWeight: 400,
              fontSize: '0.875rem',
              mb: 0.5,
            }}
          >
            Debug Wallet (Console)
          </Button>
        )}
        <Button
          fullWidth
          startIcon={<Logout />}
          onClick={onDisconnect}
          sx={{
            justifyContent: 'flex-start',
            py: 1.5,
            px: 2,
            color: 'error.main',
            textTransform: 'none',
            fontWeight: 400,
            fontSize: '0.9375rem',
          }}
        >
          Disconnect
        </Button>
      </Box>
    </Box>
  );
};

export default WalletDropdown;
