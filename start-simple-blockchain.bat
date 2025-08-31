@echo off
echo 🚀 Starting Web3 Uptime Monitor - Simple Blockchain Setup
echo.

echo 📁 Setting up contracts...
cd packages\contracts

echo 📦 Installing minimal dependencies...
npm install hardhat @nomicfoundation/hardhat-toolbox --save-dev --silent

echo 🔨 Starting local blockchain...
start "Hardhat Blockchain" cmd /k "npx hardhat node"

echo ⏳ Waiting for blockchain to start...
timeout /t 10

echo 📜 Deploying contracts...
npx hardhat run scripts/deploy.js --network localhost

echo ✅ Blockchain setup complete!
echo.
echo 📋 Your local blockchain is running at:
echo    🔗 RPC URL: http://localhost:8545
echo    🆔 Chain ID: 31337
echo.
echo 🔑 Add to MetaMask:
echo    Network Name: Hardhat Local  
echo    RPC URL: http://localhost:8545
echo    Chain ID: 31337
echo    Currency: ETH
echo.
echo 💰 Test Account (import to MetaMask):
echo    Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
echo.
echo 🌐 Now open: minimal-blockchain-demo.html
echo    And connect MetaMask to test real blockchain features!
echo.
pause