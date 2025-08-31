# Web3 Uptime Monitor Makefile

.PHONY: help install build start stop clean logs test deploy

# Default target
help:
	@echo "Web3 Uptime Monitor - Available commands:"
	@echo ""
	@echo "  make install    - Install all dependencies"
	@echo "  make build      - Build all Docker images"
	@echo "  make start      - Start all services"
	@echo "  make stop       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo "  make clean      - Clean up containers and volumes"
	@echo "  make logs       - View logs from all services"
	@echo "  make test       - Run tests"
	@echo "  make deploy     - Deploy smart contracts"
	@echo "  make setup      - Complete setup (install + build + deploy + start)"
	@echo ""

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	npm install
	cd packages/contracts && npm install
	cd packages/backend && npm install
	cd packages/frontend && npm install
	cd packages/monitoring-node && npm install
	@echo "✅ Dependencies installed"

# Build Docker images
build:
	@echo "🐳 Building Docker images..."
	docker-compose build
	@echo "✅ Docker images built"

# Start services
start:
	@echo "🚀 Starting services..."
	docker-compose up -d
	@echo "✅ Services started"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:3001"
	@echo "Blockchain: http://localhost:8545"

# Stop services
stop:
	@echo "🛑 Stopping services..."
	docker-compose down
	@echo "✅ Services stopped"

# Restart services
restart: stop start

# Clean up
clean:
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	docker system prune -f
	@echo "✅ Cleanup complete"

# View logs
logs:
	docker-compose logs -f

# View logs for specific service
logs-frontend:
	docker-compose logs -f frontend

logs-backend:
	docker-compose logs -f backend

logs-contracts:
	docker-compose logs -f hardhat

logs-node1:
	docker-compose logs -f monitoring-node-1

logs-node2:
	docker-compose logs -f monitoring-node-2

# Run tests
test:
	@echo "🧪 Running tests..."
	cd packages/contracts && npm test
	cd packages/backend && npm test
	@echo "✅ Tests completed"

# Deploy smart contracts
deploy:
	@echo "📜 Deploying smart contracts..."
	cd packages/contracts && npm run deploy
	@echo "✅ Smart contracts deployed"

# Complete setup
setup: install build deploy start
	@echo ""
	@echo "🎉 Setup complete!"
	@echo ""
	@echo "📋 Services:"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Backend API: http://localhost:3001"
	@echo "   Blockchain: http://localhost:8545"
	@echo ""
	@echo "🔑 Demo Credentials:"
	@echo "   Email: demo@example.com"
	@echo "   Password: password"

# Development commands
dev-frontend:
	cd packages/frontend && npm run dev

dev-backend:
	cd packages/backend && npm run dev

dev-contracts:
	cd packages/contracts && npm run node

dev-node:
	cd packages/monitoring-node && npm run dev

# Quick development start (without Docker)
dev-start:
	@echo "🚀 Starting development servers..."
	@echo "You'll need to start each service in separate terminals:"
	@echo "  Terminal 1: make dev-contracts"
	@echo "  Terminal 2: make dev-backend"
	@echo "  Terminal 3: make dev-frontend"
	@echo "  Terminal 4: make dev-node"

# Database commands
db-reset:
	docker-compose stop mongodb
	docker volume rm web3_mongodb_data
	docker-compose up -d mongodb

# Backup database
db-backup:
	docker exec web3-monitor-mongodb mongodump --out /tmp/backup
	docker cp web3-monitor-mongodb:/tmp/backup ./backup

# Health check
health:
	@echo "🏥 Checking service health..."
	@curl -s http://localhost:3001/health | jq '.' || echo "Backend not responding"
	@curl -s http://localhost:3002/health | jq '.' || echo "Node 1 not responding"
	@curl -s http://localhost:3003/health | jq '.' || echo "Node 2 not responding"

# Update all dependencies
update:
	npm update
	cd packages/contracts && npm update
	cd packages/backend && npm update
	cd packages/frontend && npm update
	cd packages/monitoring-node && npm update