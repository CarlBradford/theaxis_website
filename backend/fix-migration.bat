@echo off
echo Content Management Phase Database Migration Fix
echo ================================================

echo.
echo Step 1: Starting PostgreSQL database...
docker-compose up -d postgres

echo.
echo Step 2: Waiting for database to be ready...
timeout /t 10 /nobreak > nul

echo.
echo Step 3: Testing database connection...
cd backend
node test-connection.js

echo.
echo Step 4: Applying schema changes...
npx prisma db push

echo.
echo Step 5: Generating Prisma client...
npx prisma generate

echo.
echo Step 6: Running seed data...
npm run db:seed

echo.
echo Migration completed! You can now:
echo - View database: npx prisma studio
echo - Start backend: npm run dev
echo - Start frontend: cd ../theaxis_frontend && npm run dev

pause
