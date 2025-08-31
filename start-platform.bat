@echo off
echo 🚀 Starting Web3 Uptime Monitor Platform
echo.

echo 📋 Checking Docker...
docker --version
if %errorlevel% neq 0 (
    echo ❌ Docker not found. Please install Docker Desktop first.
    pause
    exit /b 1
)

echo 🐳 Starting all services with Docker...
docker-compose up -d

echo ⏳ Waiting for services to start...
timeout /t 30

echo.
echo 🎉 Platform started successfully!
echo.
echo 📋 Your Web3 Uptime Monitor is now running at:
echo    🌐 Frontend:     http://localhost:3000
echo    🔧 Backend API:  http://localhost:3001
echo    ⛓️  Blockchain:   http://localhost:8545 (Chain ID: 31337)
echo    📊 MongoDB:      mongodb://localhost:27017
echo    🗄️  Redis:       redis://localhost:6379
echo.
echo 🔑 MetaMask Setup:
echo    - Network Name: Hardhat Local
echo    - RPC URL: http://localhost:8545
echo    - Chain ID: 31337
echo    - Currency: ETH
echo.
echo 💰 Test Account Private Keys:
echo    Account 1: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
echo    Account 2: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
echo.
echo 🛑 To stop all services: docker-compose down
echo 📊 To view logs: docker-compose logs -f
echo.
pause