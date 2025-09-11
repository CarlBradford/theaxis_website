@echo off
echo Starting comprehensive database migration...
echo.

echo Step 1: Testing Prisma version...
npx prisma --version
echo.

echo Step 2: Testing database connection...
node test-db.js
echo.

echo Step 3: Applying schema changes...
npx prisma db push --accept-data-loss
echo.

echo Step 4: Generating Prisma client...
npx prisma generate
echo.

echo Step 5: Running comprehensive migration...
node comprehensive-migration.js
echo.

echo Step 6: Final verification...
node test-db.js
echo.

echo Migration process completed!
pause
