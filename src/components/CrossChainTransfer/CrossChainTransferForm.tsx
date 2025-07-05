import { useState, ChangeEvent, FormEvent } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export const NETWORKS = [
  { value: 'ethereum', label: 'Ethereum Sepolia', id: '0xaa36a7' },
  { value: 'avalanche', label: 'Avalanche Fuji', id: '0xa869' },
  { value: 'base', label: 'Base Sepolia', id: '0x14a34' }
];

interface CrossChainTransferFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: string;
    sourceChain: string;
    destinationChain: string;
    recipient: string;
  }) => Promise<void>;
  isProcessing: boolean;
  currentAddress?: string;
}

export default function CrossChainTransferForm({
  open,
  onClose,
  onSubmit,
  isProcessing,
  currentAddress = ''
}: CrossChainTransferFormProps) {
  const [formData, setFormData] = useState({
    amount: '',
    sourceChain: 'ethereum',
    destinationChain: 'avalanche',
    recipient: ''
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? value.replace(/[^0-9.]/g, '') : value
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.sourceChain === formData.destinationChain) {
      alert('Source and destination chains must be different');
      return;
    }
    onSubmit(formData);
  };

  const handleUseMyAddress = () => {
    if (currentAddress) {
      setFormData(prev => ({
        ...prev,
        recipient: currentAddress
      }));
    }
  };

  const copyToClipboard = () => {
    if (currentAddress) {
      navigator.clipboard.writeText(currentAddress);
    }
  };

  const getNetworkIcon = (network: string) => {
    switch (network) {
      case 'ethereum':
        return '🟢';
      case 'avalanche':
        return '🔺';
      case 'base':
        return '🔷';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cross-Chain Transfer</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box mb={3}>
            <TextField
              select
              fullWidth
              label="Source Chain"
              name="sourceChain"
              value={formData.sourceChain}
              onChange={handleChange}
              margin="normal"
              disabled={isProcessing}
              variant="outlined"
            >
              {NETWORKS.map((network) => (
                <MenuItem key={network.value} value={network.value}>
                  {getNetworkIcon(network.value)} {network.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Destination Chain"
              name="destinationChain"
              value={formData.destinationChain}
              onChange={handleChange}
              margin="normal"
              disabled={isProcessing}
              variant="outlined"
            >
              {NETWORKS.filter(n => n.value !== formData.sourceChain).map((network) => (
                <MenuItem key={network.value} value={network.value}>
                  {getNetworkIcon(network.value)} {network.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Amount"
              name="amount"
              type="text"
              value={formData.amount}
              onChange={handleChange}
              margin="normal"
              disabled={isProcessing}
              variant="outlined"
              InputProps={{
                endAdornment: <InputAdornment position="end">USDC</InputAdornment>,
              }}
              placeholder="0.00"
            />

            <TextField
              fullWidth
              label="Recipient Address"
              name="recipient"
              value={formData.recipient}
              onChange={handleChange}
              margin="normal"
              disabled={isProcessing}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {currentAddress && (
                      <>
                        <Tooltip title="Use my address">
                          <Button
                            size="small"
                            onClick={handleUseMyAddress}
                            disabled={isProcessing}
                          >
                            Me
                          </Button>
                        </Tooltip>
                        <Tooltip title="Copy my address">
                          <IconButton
                            onClick={copyToClipboard}
                            size="small"
                            disabled={isProcessing}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </InputAdornment>
                ),
              }}
              required
              placeholder="0x..."
            />

            {currentAddress && (
              <Typography variant="caption" color="textSecondary">
                Your address: {`${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}`}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isProcessing || !formData.amount || !formData.recipient}
          >
            {isProcessing ? (
              <>
                <CircularProgress size={20} style={{ marginRight: 8 }} />
                Processing...
              </>
            ) : (
              'Transfer'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
