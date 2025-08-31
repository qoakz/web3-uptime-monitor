@echo off
echo 🚀 Starting Web3 Uptime Monitor (Simple Demo)
echo.

echo 📁 Navigating to frontend directory...
cd packages\frontend

echo 📦 Installing frontend dependencies...
npm install --legacy-peer-deps

echo 🔄 Copying simple demo version...
copy /y src\App.simple.js src\App.js

echo 🌐 Starting React development server...
echo.
echo ✅ The app will open at: http://localhost:3000
echo.
npm start