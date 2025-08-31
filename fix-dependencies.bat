@echo off
echo Fixing package dependencies...

echo.
echo Installing root dependencies...
npm install --legacy-peer-deps

echo.
echo Installing frontend dependencies...
cd packages\frontend
npm install --legacy-peer-deps
cd ..

echo.
echo Installing backend dependencies...
cd packages\backend
npm install --legacy-peer-deps
cd ..

echo.
echo Installing contracts dependencies...
cd packages\contracts
npm install --legacy-peer-deps
cd ..

echo.
echo Installing monitoring-node dependencies...
cd packages\monitoring-node
npm install --legacy-peer-deps
cd ..

echo.
echo Dependencies fixed! Now you can run: docker-compose up -d
pause
