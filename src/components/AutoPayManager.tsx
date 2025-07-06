import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Service, ServiceStorage } from '../services/ServiceStorage';
import ServiceList from './ServiceList';
import './AutoPayManager.css';
import './ServiceList.css';

interface AutoPayConfig {
  isActive: boolean;
  amount: string;
  interval: number;
  lastPayment: Date;
  serviceProvider: string;
}

interface AutoPayManagerProps {
  contractAddress: string;
  provider: ethers.providers.Web3Provider;
  signer: ethers.Signer;
}

const TOP_ACC_ABI = [
  "function depositFunds() external payable",
  "function withdrawFunds(uint256 amount) external",
  "function setAutopay(uint256 amount, uint256 interval, address serviceProvider) external",
  "function disapproveService() external",
  "function getBalance(address user) external view returns (uint256)",
  "function getAutoPayConfig(address user) external view returns (tuple(bool isActive, uint256 amount, uint256 interval, uint256 lastPayment, address serviceProvider))",
  "event AutoPayRegistered(address indexed user, uint256 amount, uint256 interval, address serviceProvider)",
  "event AutoPayExecuted(address indexed user, uint256 amount, address serviceProvider)",
  "event AutoPayDisabled(address indexed user)",
  "event FundsDeposited(address indexed user, uint256 amount)",
  "event FundsWithdrawn(address indexed user, uint256 amount)"
];

const AutoPayManager: React.FC<AutoPayManagerProps> = ({ contractAddress, provider, signer }) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [autoPayConfig, setAutoPayConfig] = useState<AutoPayConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Form states
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [autopayAmount, setAutopayAmount] = useState<string>('');
  const [autopayInterval, setAutopayInterval] = useState<number>(30);
  const [serviceProvider, setServiceProvider] = useState<string>('');
  const [serviceName, setServiceName] = useState<string>('');
  const [serviceDescription, setServiceDescription] = useState<string>('');
  const [useOneNetwork, setUseOneNetwork] = useState<boolean>(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    const initializeContract = async () => {
      try {
        const contractInstance = new ethers.Contract(contractAddress, TOP_ACC_ABI, signer);
        setContract(contractInstance);
        
        const address = await signer.getAddress();
        setUserAddress(address);
        
        // Set up event listeners
        contractInstance.on("AutoPayRegistered", (user, amount, interval, serviceProvider) => {
          if (user.toLowerCase() === address.toLowerCase()) {
            console.log("AutoPay registered successfully!");
            refreshData();
          }
        });

        contractInstance.on("AutoPayExecuted", (user, amount, serviceProvider) => {
          if (user.toLowerCase() === address.toLowerCase()) {
            console.log("AutoPay executed!");
            refreshData();
          }
        });

        contractInstance.on("AutoPayDisabled", (user) => {
          if (user.toLowerCase() === address.toLowerCase()) {
            console.log("AutoPay disabled!");
            refreshData();
          }
        });

        contractInstance.on("FundsDeposited", (user, amount) => {
          if (user.toLowerCase() === address.toLowerCase()) {
            console.log("Funds deposited!");
            refreshData();
          }
        });

        contractInstance.on("FundsWithdrawn", (user, amount) => {
          if (user.toLowerCase() === address.toLowerCase()) {
            console.log("Funds withdrawn!");
            refreshData();
          }
        });

        // Initial data load
        refreshData();
      } catch (err) {
        console.error("Error initializing contract:", err);
        setError("Failed to initialize contract");
      }
    };

    if (contractAddress && provider && signer) {
      initializeContract();
    }

    // Cleanup event listeners on unmount
    return () => {
      if (contract) {
        contract.removeAllListeners();
      }
    };
  }, [contractAddress, provider, signer]);

  const refreshData = async () => {
    if (!contract || !userAddress) return;

    try {
      setLoading(true);
      
      // Get user balance
      const balanceWei = await contract.getBalance(userAddress);
      setBalance(ethers.utils.formatEther(balanceWei));

      // Get autopay configuration
      const config = await contract.getAutoPayConfig(userAddress);
      if (config.isActive) {
        setAutoPayConfig({
          isActive: config.isActive,
          amount: ethers.utils.formatEther(config.amount),
          interval: config.interval,
          lastPayment: new Date(config.lastPayment * 1000),
          serviceProvider: config.serviceProvider
        });
      } else {
        setAutoPayConfig(null);
      }

      setError('');
    } catch (err) {
      console.error("Error refreshing data:", err);
      setError("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!contract || !depositAmount) return;

    try {
      setLoading(true);
      
      console.log('Using one network for deposit:', useOneNetwork);
      
      const tx = await contract.depositFunds({
        value: ethers.utils.parseEther(depositAmount)
      });
      
      await tx.wait();
      setDepositAmount('');
      refreshData();
    } catch (err) {
      console.error("Error depositing funds:", err);
      setError("Failed to deposit funds");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !withdrawAmount) return;

    try {
      setLoading(true);
      const tx = await contract.withdrawFunds(ethers.utils.parseEther(withdrawAmount));
      await tx.wait();
      setWithdrawAmount('');
      refreshData();
    } catch (err) {
      console.error("Error withdrawing funds:", err);
      setError("Failed to withdraw funds");
    } finally {
      setLoading(false);
    }
  };

  const handleSetAutopay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !autopayAmount || !autopayInterval || !serviceProvider || !serviceName) return;

    try {
      setLoading(true);
      setError('');
      
      // First, save the service details to local storage
      const newService: Omit<Service, 'id' | 'createdAt'> = {
        name: serviceName,
        description: serviceDescription,
        amount: ethers.utils.parseUnits(autopayAmount, 6).toString(),
        frequency: autopayInterval === 1 ? 'daily' : 
                  autopayInterval === 7 ? 'weekly' :
                  autopayInterval === 30 ? 'monthly' : 'yearly',
        nextPayment: new Date(Date.now() + autopayInterval * 86400 * 1000).toISOString(),
        tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC on Sepolia
        recipient: serviceProvider
      };
      
      // Save to local storage
      ServiceStorage.addService(newService);
      
      // Then set up the autopay on-chain
      const tx = await contract.setAutopay(
        ethers.utils.parseUnits(autopayAmount, 6), // Assuming 6 decimals for USDC
        autopayInterval * 86400, // Convert days to seconds
        serviceProvider
      );
      
      await tx.wait();
      await refreshData();
      
      // Reset form
      setAutopayAmount('');
      setAutopayInterval(30);
      setServiceProvider('');
      setServiceName('');
      setServiceDescription('');
      
      // Refresh services list
      setServices(ServiceStorage.getServices());
      
    } catch (err: any) {
      console.error('Error setting up autopay:', err);
      setError(err.message || 'Failed to set up autopay');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAutopay = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.disapproveService();
      await tx.wait();
      refreshData();
    } catch (err) {
      console.error("Error canceling autopay:", err);
      setError("Failed to cancel autopay");
    } finally {
      setLoading(false);
    }
  };

  const formatInterval = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    if (days > 0) return `${days} days`;
    if (hours > 0) return `${hours} hours`;
    return `${minutes} minutes`;
  };

  const nextPaymentDate = (lastPayment: Date, interval: number): Date => {
    return new Date(lastPayment.getTime() + interval * 1000);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setServiceName(service.name);
    setServiceDescription(service.description);
    setServiceProvider(service.recipient);
    setAutopayAmount(ethers.utils.formatUnits(service.amount, 6));
    // You might want to set other fields based on the selected service
  };

  return (
    <div className="auto-pay-manager">
      <h2>AutoPay Manager</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="balance-section">
        <h3>Your Balance: {balance} USDC</h3>
        <div className="form-group">
          <input
            type="number"
            className="form-control"
            placeholder="Amount to deposit"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <button 
            className="btn btn-primary"
            onClick={handleDeposit}
            disabled={!depositAmount || loading}
          >
            Deposit
          </button>
        </div>
        
        <div className="form-group">
          <input
            type="number"
            className="form-control"
            placeholder="Amount to withdraw"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <button 
            className="btn btn-secondary"
            onClick={handleWithdraw}
            disabled={!withdrawAmount || loading}
          >
            Withdraw
          </button>
        </div>
      </div>
      
      <div className="autopay-section">
        <h3>AutoPay Configuration</h3>
        {autoPayConfig?.isActive ? (
          <div className="autopay-active">
            <p>AutoPay is active for {autoPayConfig.serviceProvider}</p>
            <p>Amount: {ethers.utils.formatUnits(autoPayConfig.amount, 6)} USDC</p>
            <p>Interval: {autoPayConfig.interval / 86400} days</p>
            <p>Last payment: {new Date(autoPayConfig.lastPayment).toLocaleString()}</p>
            <button 
              className="btn btn-danger"
              onClick={handleCancelAutopay}
              disabled={loading}
            >
              Disable AutoPay
            </button>
          </div>
        ) : (
          <form onSubmit={handleSetAutopay}>
            <div className="form-group">
              <label>Service Name</label>
              <input
                type="text"
                className="form-control"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g., Netflix, Spotify"
                required
              />
            </div>
            <div className="form-group">
              <label>Service Description (Optional)</label>
              <input
                type="text"
                className="form-control"
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                placeholder="e.g., Premium Subscription"
              />
            </div>
            <div className="form-group">
              <label>Service Provider Address</label>
              <input
                type="text"
                className="form-control"
                value={serviceProvider}
                onChange={(e) => setServiceProvider(e.target.value)}
                placeholder="0x..."
                required
              />
            </div>
            <div className="form-group">
              <label>Amount (USDC)</label>
              <input
                type="number"
                step="0.000001"
                min="0.000001"
                className="form-control"
                value={autopayAmount}
                onChange={(e) => setAutopayAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Payment Frequency</label>
              <select
                className="form-control"
                value={autopayInterval}
                onChange={(e) => setAutopayInterval(Number(e.target.value))}
                required
              >
                <option value="1">Daily</option>
                <option value="7">Weekly</option>
                <option value="30">Monthly</option>
                <option value="365">Yearly</option>
                <option value="0">Custom (days)</option>
              </select>
              {autopayInterval === 0 && (
                <input
                  type="number"
                  min="1"
                  className="form-control mt-2"
                  value={autopayInterval}
                  onChange={(e) => setAutopayInterval(Number(e.target.value))}
                  required
                />
              )}
            </div>
            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="useOneNetwork"
                checked={useOneNetwork}
                onChange={(e) => setUseOneNetwork(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="useOneNetwork">
                Use One Network
              </label>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Enable AutoPay'}
            </button>
          </form>
        )}
      </div>

      <div className="services-section mt-5">
        <h3>Your Services</h3>
        <ServiceList 
          onServiceSelect={handleEditService}
          showActions={true}
        />
      </div>
    </div>
  );
};

export default AutoPayManager;
