import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import { useWallet } from '../contexts/WalletContext';
import AddServiceArtifact from '../contracts/services/AddService.sol/AddService.json';
import './Dashboard.css';
import CrossChainTransferForm from '../components/CrossChainTransfer/CrossChainTransferForm';
import CrossChainService from '../services/CrossChainService';

// Type for the AddService artifact
type AddServiceArtifactType = {
  abi: any[];
  bytecode: string;
  [key: string]: any;
};

// Type assertion for the imported artifact
const typedAddServiceArtifact = AddServiceArtifact as unknown as AddServiceArtifactType;

const Dashboard = () => {
  const { 
    isConnected, 
    address, 
    refreshBalance, 
    provider, 
    contractBalance,
    contractAddress,
    debugWalletStatus,
    loadContractFromFile
  } = useWallet();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingContract, setIsLoadingContract] = useState(false);
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

    // Validate form inputs
    if (!newService.name || !newService.amount || !newService.interval) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      setIsRegistering(true);
      
      // Get the signer from the provider
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Check if we have a local JSON with the contract address
      let storedContract = localStorage.getItem('addServiceContract');
      let addServiceAddress: string = '';
      let isNewDeployment = false;
      let useStoredContract = false;
      
      if (storedContract) {
        try {
          // Use the existing contract
          const contractData = JSON.parse(storedContract);
          
          // Verify the contract is on the current network
          const currentNetwork = await provider.getNetwork();
          if (contractData.network !== currentNetwork.chainId) {
            throw new Error('Contract is on a different network');
          }
          
          addServiceAddress = contractData.address;
          useStoredContract = true;
          showNotification('Using existing AddService contract', 'info');
        } catch (error) {
          console.warn('Error using stored contract, deploying new one', error);
          // If there's an issue with the stored contract, we'll deploy a new one
          useStoredContract = false;
        }
      }
      
      if (!useStoredContract) {
        // Deploy a new AddService contract
        showNotification('Deploying new AddService contract...', 'info');
        
        const AddServiceFactory = new ethers.ContractFactory(
          typedAddServiceArtifact.abi,
          typedAddServiceArtifact.bytecode,
          signer
        );
        
        const addService = await AddServiceFactory.deploy();
        await addService.deployed();
        addServiceAddress = addService.address;
        isNewDeployment = true;
        
        // Store the contract address in localStorage
        const network = await provider.getNetwork();
        const contractData = {
          address: addServiceAddress,
          network: network.chainId,
          owner: userAddress,
          timestamp: new Date().toISOString(),
          name: 'AddService',
          version: '1.0.0'
        };
        localStorage.setItem('addServiceContract', JSON.stringify(contractData, null, 2));
        
        showNotification('New AddService contract deployed successfully!', 'success');
      }
      
      // Get the contract instance
      const addService = new ethers.Contract(
        addServiceAddress,
        typedAddServiceArtifact.abi,
        signer
      );
      
      // Convert amount to wei (assuming 6 decimals for USDC)
      const cost = ethers.utils.parseUnits(newService.amount, 6);
      const intervalInSeconds = parseInt(newService.interval) * 24 * 60 * 60; // Convert days to seconds
      
      // Call the registerService function
      showNotification('Registering service on the blockchain...', 'info');
      
      // Estimate gas first
      const gasEstimate = await addService.estimateGas.registerService(cost, intervalInSeconds);
      
      // Execute with a buffer for gas
      const tx = await addService.registerService(cost, intervalInSeconds, {
        gasLimit: gasEstimate.mul(120).div(100) // 20% buffer
      });
      
      showNotification('Transaction sent, waiting for confirmation...', 'info');
      
      const receipt = await tx.wait();
      
      // Find the ServiceRegistered event in the transaction receipt
      const event = receipt.events?.find((e: any) => e.event === 'ServiceRegistered');
      const serviceId = event?.args?.serviceId?.toString();
      
      if (!serviceId) {
        throw new Error('Failed to get service ID from transaction');
      }
      
      // Reset form and close modal
      setNewService({
        name: '',
        symbol: '',
        amount: '',
        interval: '30',
      });
      setIsServiceModalOpen(false);
      
      showNotification(
        `Service #${serviceId} registered successfully! ${isNewDeployment ? '(New contract deployed)' : ''}`,
        'success'
      );
      
      // Refresh any service lists or UI elements that might be affected
      // refreshServicesList(); // Uncomment if you have a function to refresh services list
      
    } catch (error: any) {
      console.error('Error in handleAddService:', error);
      
      let errorMessage = 'Failed to register service';
      
      // Handle common errors
      if (error.code === 4001) {
        errorMessage = 'Transaction was rejected by user';
      } else if (error.code === -32603) {
        // Try to extract a better error message if possible
        const reason = error.reason || error.data?.message || error.message;
        errorMessage = `Transaction failed: ${reason}`;
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, 'error');
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

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoadingContract(true);
      
      // Use the loadContractFromFile function from the wallet context
      const result = await loadContractFromFile(file);
      
      if (result && result.address) {
        showNotification('Contract loaded successfully!', 'success');
        
        // The contract address has been updated in the context
        // and the balance has been refreshed automatically
      }
      
    } catch (error: any) {
      console.error('Error loading contract:', error);
      showNotification(
        error.message || 'Failed to load contract from file',
        'error'
      );
    } finally {
      setIsLoadingContract(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
      {/* Contract Balance Card */}
      {isConnected && (
        <Box sx={{ mb: 4 }}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Contract Balance</Typography>
              <Box>
                <Tooltip title="Load contract from JSON file">
                  <IconButton 
                    component="label"
                    disabled={isLoadingContract}
                    sx={{ mr: 1 }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      hidden
                      accept=".json"
                      onChange={handleFileUpload}
                    />
                    📁
                  </IconButton>
                </Tooltip>
                <Tooltip title="Debug wallet status">
                  <IconButton 
                    onClick={debugWalletStatus}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    🐞
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  TopAcc Contract Balance
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {contractBalance || '0.00'}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    USDC
                  </Typography>
                </Box>
                
                {contractAddress && (
                  <Tooltip title={contractAddress} placement="bottom-start">
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mt: 1, 
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={() => {
                        navigator.clipboard.writeText(contractAddress);
                        showNotification('Contract address copied to clipboard', 'info');
                      }}
                    >
                      {`${contractAddress.substring(0, 6)}...${contractAddress.substring(38)}`}
                    </Typography>
                  </Tooltip>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, mt: { xs: 2, sm: 0 } }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => setIsTransferModalOpen(true)}
                  sx={{ height: 'fit-content' }}
                >
                  Add Funds
                </Button>
                <Button 
                  variant="outlined"
                  onClick={refreshBalance}
                  disabled={isLoadingContract}
                  sx={{ height: 'fit-content' }}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

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
