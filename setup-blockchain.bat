@echo off
echo 🚀 Setting up Web3 Uptime Monitor with Blockchain
echo.

echo 📦 Installing contracts dependencies...
cd packages\contracts
call npm install --legacy-peer-deps --no-optional
if %errorlevel% neq 0 (
    echo ❌ Failed to install contracts dependencies
    pause
    exit /b 1
)

echo 🔨 Compiling smart contracts...
call npx hardhat compile
if %errorlevel% neq 0 (
    echo ❌ Failed to compile contracts
    pause
    exit /b 1
)

echo 🚀 Starting local blockchain...
start "Hardhat Network" cmd /k "npx hardhat node"

echo ⏳ Waiting for blockchain to start...
timeout /t 10

echo 📜 Deploying smart contracts...
call npx hardhat run scripts/deploy.js --network localhost
if %errorlevel% neq 0 (
    echo ❌ Failed to deploy contracts
    pause
    exit /b 1
)

cd ..\..

echo.
echo ✅ Blockchain setup complete!
echo 📋 Services running:
echo    - Hardhat Network: http://localhost:8545
echo    - Chain ID: 31337
echo.
echo 🔑 Add to MetaMask:
echo    - Network: Hardhat Local
echo    - RPC URL: http://localhost:8545
echo    - Chain ID: 31337
echo    - Currency: ETH
echo.
echo 💡 Import test accounts using these private keys:
echo    Account 1: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
echo    Account 2: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
echo.
pause