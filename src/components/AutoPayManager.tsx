import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './AutoPayManager.css';

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

  const handleSetAutopay = async () => {
    if (!contract || !autopayAmount || !serviceProvider) return;

    try {
      setLoading(true);
      const intervalSeconds = autopayInterval * 24 * 60 * 60; // Convert days to seconds
      const tx = await contract.setAutopay(
        ethers.utils.parseEther(autopayAmount),
        intervalSeconds,
        serviceProvider
      );
      await tx.wait();
      setAutopayAmount('');
      setServiceProvider('');
      refreshData();
    } catch (err) {
      console.error("Error setting autopay:", err);
      setError("Failed to set autopay");
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

  return (
    <div className="autopay-manager">
      <h2>AutoPay Manager</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="user-info">
        <div className="info-item">
          <label>User Address:</label>
          <span>{userAddress}</span>
        </div>
        <div className="info-item">
          <label>Balance:</label>
          <span>{balance} ETH</span>
        </div>
      </div>

      <div className="section">
        <h3>Manage Funds</h3>
        
        <div className="form-group">
          <label>Deposit Amount (ETH):</label>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="0.0"
            step="0.001"
            min="0"
          />
          <button onClick={handleDeposit} disabled={loading || !depositAmount}>
            {loading ? 'Processing...' : 'Deposit'}
          </button>
        </div>

        <div className="form-group">
          <label>Withdraw Amount (ETH):</label>
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="0.0"
            step="0.001"
            min="0"
          />
          <button onClick={handleWithdraw} disabled={loading || !withdrawAmount}>
            {loading ? 'Processing...' : 'Withdraw'}
          </button>
        </div>
      </div>

      <div className="section">
        <h3>AutoPay Configuration</h3>
        
        {autoPayConfig ? (
          <div className="autopay-status">
            <div className="status-active">
              <h4>✅ AutoPay Active</h4>
              <div className="config-details">
                <p><strong>Amount:</strong> {autoPayConfig.amount} ETH</p>
                <p><strong>Interval:</strong> {formatInterval(autoPayConfig.interval)}</p>
                <p><strong>Service Provider:</strong> {autoPayConfig.serviceProvider}</p>
                <p><strong>Last Payment:</strong> {autoPayConfig.lastPayment.toLocaleDateString()}</p>
                <p><strong>Next Payment:</strong> {nextPaymentDate(autoPayConfig.lastPayment, autoPayConfig.interval).toLocaleDateString()}</p>
              </div>
              <button onClick={handleCancelAutopay} disabled={loading} className="cancel-button">
                {loading ? 'Processing...' : 'Cancel AutoPay'}
              </button>
            </div>
          </div>
        ) : (
          <div className="autopay-setup">
            <h4>Set Up AutoPay</h4>
            
            <div className="form-group">
              <label>Payment Amount (ETH):</label>
              <input
                type="number"
                value={autopayAmount}
                onChange={(e) => setAutopayAmount(e.target.value)}
                placeholder="0.0"
                step="0.001"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Payment Interval (days):</label>
              <input
                type="number"
                value={autopayInterval}
                onChange={(e) => setAutopayInterval(Number(e.target.value))}
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Service Provider Address:</label>
              <input
                type="text"
                value={serviceProvider}
                onChange={(e) => setServiceProvider(e.target.value)}
                placeholder="0x..."
              />
            </div>

            <button 
              onClick={handleSetAutopay} 
              disabled={loading || !autopayAmount || !serviceProvider}
              className="setup-button"
            >
              {loading ? 'Processing...' : 'Set Up AutoPay'}
            </button>
          </div>
        )}
      </div>

      <div className="section">
        <h3>How It Works</h3>
        <div className="info-box">
          <p>
            🔄 <strong>Chainlink Automation:</strong> Once you set up AutoPay, Chainlink's decentralized automation network will automatically execute your payments according to your schedule.
          </p>
          <p>
            💰 <strong>Secure:</strong> Your funds are stored in the smart contract and can only be withdrawn by you or automatically paid to approved service providers.
          </p>
          <p>
            ⚡ <strong>Reliable:</strong> Payments are executed on-chain without requiring any manual intervention from you.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AutoPayManager;
