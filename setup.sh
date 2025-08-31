#!/bin/bash

# Web3 Uptime Monitor Setup Script
echo "🚀 Setting up Web3 Uptime Monitor..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v18+) first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create environment file
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp env.example .env
    echo "✅ Created .env file. Please update it with your configuration."
else
    echo "⚠️  .env file already exists. Skipping creation."
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install package dependencies
echo "📦 Installing contract dependencies..."
cd packages/contracts && npm install && cd ../..

echo "📦 Installing backend dependencies..."
cd packages/backend && npm install && cd ../..

echo "📦 Installing frontend dependencies..."
cd packages/frontend && npm install && cd ../..

echo "📦 Installing monitoring node dependencies..."
cd packages/monitoring-node && npm install && cd ../..

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p packages/backend/logs
mkdir -p packages/monitoring-node/logs
mkdir -p packages/contracts/cache
mkdir -p packages/contracts/artifacts
mkdir -p nginx/ssl

# Build and start services
echo "🐳 Building and starting Docker services..."
docker-compose up -d mongodb redis

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Deploy smart contracts
echo "📜 Deploying smart contracts..."
cd packages/contracts
npm run compile
npm run deploy
cd ../..

# Extract contract addresses and update environment
echo "🔧 Updating contract addresses in environment..."
# This would typically extract addresses from deployment output
# For demo purposes, we'll use the default addresses

# Start remaining services
echo "🐳 Starting all services..."
docker-compose up -d

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Services:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   Blockchain: http://localhost:8545"
echo "   MongoDB: mongodb://localhost:27017"
echo "   Redis: redis://localhost:6379"
echo "   Node 1 Health: http://localhost:3002/health"
echo "   Node 2 Health: http://localhost:3003/health"
echo ""
echo "🔑 Demo Credentials:"
echo "   Email: demo@example.com"
echo "   Password: password"
echo ""
echo "💡 Next steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Connect your MetaMask to localhost:8545"
echo "   3. Import test accounts using the private keys in .env"
echo "   4. Register an account and start monitoring!"
echo ""
echo "📖 Documentation: See README.md for more details"
echo "🐛 Logs: docker-compose logs -f [service-name]"
echo "🛑 Stop: docker-compose down"