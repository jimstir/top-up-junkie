import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';
import { 
  Box, 
  Button, 
  Typography, 
  Snackbar, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import './Dashboard.css';
import CrossChainTransferForm from '../components/CrossChainTransfer/CrossChainTransferForm';
import CrossChainService from '../services/CrossChainService';

const Dashboard = () => {
  const { isConnected, address, walletType, userToken, refreshBalance, provider } = useWallet();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newService, setNewService] = useState<{
    name: string;
    symbol: string;
    amount: string;
    interval: string;
  }>({
    name: '',
    symbol: '',
    amount: '',
    interval: '30', // Default to 30 days
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewService(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !provider) {
      showNotification('Please connect your wallet first', 'error');
      return;
    }

    try {
      setIsRegistering(true);
      
      // Get the signer from the provider
      const signer = await provider.getSigner();
      
      // Get the AddService contract instance
      const addServiceAddress = process.env.REACT_APP_ADD_SERVICE_CONTRACT_ADDRESS;
      if (!addServiceAddress) {
        throw new Error('AddService contract address not configured');
      }
      
      const addService = new ethers.Contract(
        addServiceAddress,
        ['function registerService(uint256 cost, uint256 interval) external returns (uint256)'],
        signer
      );
      
      // Convert amount to wei (assuming 6 decimals for USDC)
      const cost = ethers.utils.parseUnits(newService.amount, 6);
      const interval = parseInt(newService.interval) * 24 * 60 * 60; // Convert days to seconds
      
      // Call the registerService function
      const tx = await addService.registerService(cost, interval);
      await tx.wait();
      
      // Reset form and close modal
      setNewService({
        name: '',
        symbol: '',
        amount: '',
        interval: '30',
      });
      setIsServiceModalOpen(false);
      
      showNotification('Service registered successfully!', 'success');
      
    } catch (error: any) {
      console.error('Error registering service:', error);
      showNotification(
        error.message || 'Failed to register service',
        'error'
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handleTransferSubmit = async (transferData: {
    amount: string;
    sourceChain: string;
    destinationChain: string;
    recipient: string;
  }) => {
    if (!isConnected) {
      showNotification('Please connect your wallet first', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      
      console.log('Initiating cross-chain transfer:', transferData);
      
      // Execute the cross-chain transfer
      const result = await CrossChainService.transferUSDC(
        transferData.amount,
        transferData.sourceChain,
        transferData.destinationChain,
        transferData.recipient
      );
      
      console.log('Transfer successful:', result);
      showNotification(
        `Successfully transferred ${transferData.amount} USDC from ${transferData.sourceChain} to ${transferData.destinationChain}`,
        'success'
      );
      
      // Refresh balances after successful transfer
      await refreshBalance();
      
      // Close the modal
      setIsTransferModalOpen(false);
      
    } catch (error: any) {
      console.error('Error in cross-chain transfer:', error);
      showNotification(
        error.message || 'Failed to complete cross-chain transfer',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Initialize CrossChainService with provider
  useEffect(() => {
    if (provider) {
      CrossChainService.setProvider(provider);
    }
  }, [provider]);

  // Mock data for services
  const services = [
    {
      id: 1,
      name: 'Streaming Service',
      description: 'Monthly subscription for premium content',
      amount: '9.99',
      currency: 'USDC',
      billingCycle: 'Monthly',
      nextBilling: '2023-08-01',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Cloud Storage',
      description: '2TB cloud storage plan',
      amount: '19.99',
      currency: 'USDC',
      billingCycle: 'Monthly',
      nextBilling: '2023-08-05',
      status: 'Active'
    },
    {
      id: 3,
      name: 'VPN Service',
      description: 'Annual VPN subscription',
      amount: '99.99',
      currency: 'USDC',
      billingCycle: 'Yearly',
      nextBilling: '2024-01-15',
      status: 'Active'
    },
    {
      id: 4,
      name: 'Music Platform',
      description: 'Premium music streaming',
      amount: '14.99',
      currency: 'USDC',
      billingCycle: 'Monthly',
      nextBilling: '2023-07-28',
      status: 'Active'
    },
    {
      id: 5,
      name: 'Fitness App',
      description: 'Premium workout plans',
      amount: '29.99',
      currency: 'USDC',
      billingCycle: 'Monthly',
      nextBilling: '2023-07-30',
      status: 'Active'
    }
  ];

  return (
    <Box className="dashboard-container" sx={{ p: 3 }}>
      <Box className="dashboard-header">
        <Typography variant="h4" component="h1">
          Services List
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsTransferModalOpen(true)}
            disabled={!isConnected}
            sx={{ minWidth: 180 }}
          >
            Add Funds
          </Button>
          <Button 
            variant="outlined"
            onClick={() => setIsServiceModalOpen(true)}
          >
            Add Service
          </Button>
        </Box>
      </Box>

      <Box className="dashboard-content" sx={{ mt: 4 }}>
        <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
          <TableContainer>
            <Table stickyHeader aria-label="services table">
              <TableHead>
                <TableRow>
                  <TableCell>Service Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Billing Cycle</TableCell>
                  <TableCell>Next Billing</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.map((service) => (
                  <TableRow
                    key={service.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {service.name}
                    </TableCell>
                    <TableCell>{service.description}</TableCell>
                    <TableCell align="right">{service.amount} {service.currency}</TableCell>
                    <TableCell>{service.billingCycle}</TableCell>
                    <TableCell>{service.nextBilling}</TableCell>
                    <TableCell>
                      <Box 
                        component="span" 
                        sx={{
                          color: 'success.main',
                          bgcolor: 'success.light',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'medium'
                        }}
                      >
                        {service.status}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                          // Handle info button click
                          showNotification(`Details for ${service.name}`, 'info');
                        }}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          py: 0.5,
                          px: 1.5
                        }}
                      >
                        Info
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Cross-Chain Transfer Modal */}
      <CrossChainTransferForm
        open={isTransferModalOpen}
        onClose={() => !isProcessing && setIsTransferModalOpen(false)}
        onSubmit={handleTransferSubmit}
        isProcessing={isProcessing}
        currentAddress={address || undefined}
      />

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Add Service Modal */}
      <Dialog 
        open={isServiceModalOpen} 
        onClose={() => setIsServiceModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Service</DialogTitle>
        <form onSubmit={handleAddService}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
              <TextField
                name="name"
                label="Service Name"
                value={newService.name}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
              />
              <TextField
                name="symbol"
                label="Symbol"
                value={newService.symbol}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
              />
              <TextField
                name="amount"
                label="Service Cost (USDC)"
                type="number"
                value={newService.amount}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
                inputProps={{
                  step: '0.01',
                  min: '0.01',
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
              <TextField
                name="interval"
                label="Billing Interval (days)"
                type="number"
                value={newService.interval}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
                inputProps={{
                  min: '1',
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setIsServiceModalOpen(false)}
              disabled={isRegistering}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={isRegistering || !newService.name || !newService.amount || !newService.interval}
            >
              {isRegistering ? 'Registering...' : 'Register Service'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
