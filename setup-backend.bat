@echo off
echo 🔧 Setting up Backend API Server
echo.

echo 📁 Navigating to backend directory...
cd packages\backend

echo 📦 Installing backend dependencies...
yarn install
if %errorlevel% neq 0 (
    echo ❌ Yarn failed, trying npm...
    npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

echo 📄 Setting up environment file...
if not exist .env (
    copy ..\..\env.example .env
    echo ✅ Created .env file
) else (
    echo ⚠️  .env file already exists
)

echo.
echo ✅ Backend setup complete!
echo.
echo 📋 Next steps:
echo    1. Configure .env file with your settings
echo    2. Start MongoDB: mongod
echo    3. Start Redis: redis-server
echo    4. Start backend: npm run dev
echo.
echo 🚀 Or use Docker for automatic setup: docker-compose up -d
echo.
pause