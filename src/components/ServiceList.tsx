import React, { useState, useEffect } from 'react';
import { Service, ServiceStorage } from '../services/ServiceStorage';
import { ethers } from 'ethers';
import './ServiceList.css';

interface ServiceListProps {
  onServiceSelect?: (service: Service) => void;
  showActions?: boolean;
}

const ServiceList: React.FC<ServiceListProps> = ({ onServiceSelect, showActions = true }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = () => {
    try {
      const loadedServices = ServiceStorage.getServices();
      setServices(loadedServices);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFrequency = (frequency: string) => {
    switch (frequency.toLowerCase()) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      default:
        return frequency;
    }
  };

  const handleServiceSelect = (service: Service) => {
    if (onServiceSelect) {
      onServiceSelect(service);
    }
  };

  if (loading) {
    return <div className="service-list-loading">Loading services...</div>;
  }

  if (services.length === 0) {
    return <div className="service-list-empty">No services found. Add a service to get started.</div>;
  }

  return (
    <div className="service-list">
      <div className="service-list-header">
        <div className="service-list-name">Service</div>
        <div className="service-list-amount">Amount</div>
        <div className="service-list-frequency">Frequency</div>
        <div className="service-list-next">Next Payment</div>
        {showActions && <div className="service-list-actions">Actions</div>}
      </div>
      
      {services.map((service) => (
        <div key={service.id} className="service-list-item">
          <div className="service-list-name">
            <div className="service-name">{service.name}</div>
            <div className="service-description">{service.description}</div>
          </div>
          <div className="service-list-amount">
            {ethers.utils.formatUnits(service.amount, 6)} USDC
          </div>
          <div className="service-list-frequency">
            {formatFrequency(service.frequency)}
          </div>
          <div className="service-list-next">
            {service.nextPayment ? formatDate(service.nextPayment) : 'N/A'}
          </div>
          {showActions && (
            <div className="service-list-actions">
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleServiceSelect(service)}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ServiceList;
