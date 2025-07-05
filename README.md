# TopUp Junkie - Smart Contract Suite

A decentralized application for managing recurring payments and service subscriptions on the Ethereum blockchain.

## Features

- **TopAcc Contract**: Main contract for managing user balances and auto-payments
- **AddService Contract**: For service providers to register and manage their services
- **Chainlink Automation**: Automated recurring payments
- **ERC20 Token Support**: Native support for any ERC20 token payments
- **Service Blacklisting**: Ability to blacklist services when needed

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Hardhat
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/top-up-junkie.git
   cd top-up-junkie
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your configuration.

## Smart Contracts

### Contracts Overview

- **TopAcc.sol**: Main contract for managing user balances and auto-payments
- **AddService.sol**: Contract for service providers to manage their services

### Compiling Contracts

```bash
npx hardhat compile
```

### Testing

Run the test suite:

```bash
npx hardhat test
```

Run tests with coverage:

```bash
npx hardhat coverage
```

## Deployment

### Local Development

1. Start a local Hardhat node:
   ```bash
   npx hardhat node
   ```

2. In a new terminal, deploy the contracts:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   npx hardhat run scripts/deploy-service.js --network localhost
   ```

### Testnet/Mainnet Deployment

1. Set up your environment variables in `.env`

2. Deploy to Sepolia testnet:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   npx hardhat run scripts/deploy-service.js --network sepolia
   ```

3. Verify the contracts on Etherscan:
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

## Frontend Integration

The frontend is built with Next.js and connects to the deployed smart contracts. To start the development server:

```bash
cd frontend
npm install
npm run dev
```

## Security

- Contracts are upgradeable using OpenZeppelin's upgradeable contracts pattern
- All external calls are protected with reentrancy guards
- Access control is implemented using OpenZeppelin's Ownable

## License

MIT

## Audits

Smart contracts have been audited by [Audit Firm]. See the `audits` directory for the full report.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request Top Up Junkie
A top up service using USDC to pay for services that offer prepaid credit options.
