export interface Service {
  id: string;
  name: string;
  description: string;
  amount: string;
  frequency: string;
  nextPayment: string;
  tokenAddress: string;
  recipient: string;
  createdAt: string;
}

const STORAGE_KEY = 'topup_junkie_services';

export const ServiceStorage = {
  // Get all services
  getServices(): Service[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading services from localStorage:', error);
      return [];
    }
  },

  // Add a new service
  addService(service: Omit<Service, 'id' | 'createdAt'>): Service {
    const services = this.getServices();
    const newService: Service = {
      ...service,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    const updatedServices = [...services, newService];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedServices));
    return newService;
  },

  // Update an existing service
  updateService(id: string, updates: Partial<Service>): Service | null {
    const services = this.getServices();
    const index = services.findIndex(s => s.id === id);
    
    if (index === -1) return null;
    
    const updatedService = { ...services[index], ...updates };
    const updatedServices = [...services];
    updatedServices[index] = updatedService;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedServices));
    return updatedService;
  },

  // Delete a service
  deleteService(id: string): boolean {
    const services = this.getServices();
    const filteredServices = services.filter(s => s.id !== id);
    
    if (filteredServices.length === services.length) return false;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredServices));
    return true;
  },

  // Clear all services (for testing/development)
  clearServices(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};
