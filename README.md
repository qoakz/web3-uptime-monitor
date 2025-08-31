# 🚀 Web3 Uptime Monitor

A decentralized uptime monitoring platform built with blockchain technology, featuring real-time website monitoring, smart contracts, and web3 integration.

## ✨ Features

- **Real-time Uptime Monitoring** - Track website availability and performance
- **Blockchain Integration** - Smart contracts for decentralized monitoring
- **Web3 Wallet Support** - MetaMask integration for seamless blockchain interactions
- **Multi-Node Architecture** - Distributed monitoring nodes for reliability
- **Real-time Notifications** - Instant alerts for downtime and performance issues
- **Performance Metrics** - Response time, uptime percentage, and status tracking

## 🏗️ Architecture

```
├── Frontend (React) - User interface and monitoring dashboard
├── Backend (Node.js) - API server and business logic
├── Smart Contracts (Solidity) - Blockchain monitoring logic
├── Monitoring Nodes - Distributed uptime checking
├── Database (MongoDB) - Monitor data and user information
├── Cache (Redis) - Performance optimization and real-time data
└── Hardhat - Local blockchain development environment
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ and npm
- MetaMask browser extension

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd web3
```

### 2. Start the Platform
```bash
# Start all services
docker-compose -f docker-compose.minimal.yml up -d

# Or use the working configuration
docker-compose -f docker-compose.working.yml up -d
```

### 3. Connect MetaMask
1. Open MetaMask and add custom network:
   - **Network Name**: `Hardhat Local`
   - **RPC URL**: `http://localhost:8545`
   - **Chain ID**: `31337`
   - **Currency**: `ETH`

2. Import test account with private key:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

### 4. Access the Platform
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Blockchain**: http://localhost:8545
- **Demo**: Open `demo.html` in your browser

## 🛠️ Development

### Project Structure
```
packages/
├── frontend/          # React frontend application
├── backend/           # Node.js API server
├── contracts/         # Solidity smart contracts
└── monitoring-node/   # Distributed monitoring nodes
```

### Available Scripts
```bash
# Install dependencies
npm install

# Start development environment
docker-compose up -d

# Compile smart contracts
cd packages/contracts
npm run compile

# Run tests
npm run test

# Deploy contracts
npm run deploy
```

## 🔧 Configuration

### Environment Variables
```env
# Backend
MONGODB_URI=mongodb://admin:password@mongodb:27017
REDIS_URL=redis://redis:6379
ETHEREUM_RPC_URL=http://hardhat:8545
PRIVATE_KEY=your-private-key
JWT_SECRET=your-jwt-secret

# Frontend
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
```

### Docker Services
- **MongoDB**: Database for monitors and users
- **Redis**: Caching and real-time data
- **Hardhat**: Local blockchain development
- **Backend**: Node.js API server
- **Frontend**: React application
- **Monitoring Nodes**: Distributed uptime checking

## 📊 Monitoring Features

### What Gets Monitored
- **Website Availability** - HTTP status codes
- **Response Time** - Performance metrics
- **Uptime Percentage** - Reliability tracking
- **Real-time Status** - Live monitoring updates

### Smart Contract Features
- **Decentralized Monitoring** - No single point of failure
- **Automated Rewards** - Incentivized monitoring
- **Transparent Results** - Blockchain-verified data
- **Community Governance** - Decentralized decision making

## 🌟 Demo

The project includes a fully functional demo (`demo.html`) that showcases:
- Real-time uptime monitoring
- Web3 wallet integration
- Performance metrics display
- Monitor management interface

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:
1. Check the Docker container logs
2. Verify MetaMask network configuration
3. Ensure all services are running
4. Check the browser console for errors

## 🎯 Roadmap

- [ ] Multi-chain support (Ethereum, Polygon, BSC)
- [ ] Advanced analytics and reporting
- [ ] Mobile application
- [ ] API rate limiting and monitoring
- [ ] Community governance features
- [ ] Integration with popular monitoring services

---

**Built with ❤️ for the Web3 community**