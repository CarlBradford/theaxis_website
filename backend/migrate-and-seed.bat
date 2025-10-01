@echo off
echo Starting database migration and seeding process...
echo.

echo Step 1: Testing database connection...
node test-db.js
if %errorlevel% neq 0 (
    echo Database connection failed. Please check your database setup.
    pause
    exit /b 1
)

echo.
echo Step 2: Applying schema changes...
npx prisma db push
if %errorlevel% neq 0 (
    echo Schema push failed. Trying alternative approach...
    node apply-migrations.js
)

echo.
echo Step 3: Generating Prisma client...
npx prisma generate

echo.
echo Step 4: Running seed script...
npm run db:seed

echo.
echo Step 5: Verifying data...
node test-db.js

echo.
echo Migration and seeding completed!
echo.
echo Login Credentials:
echo Admin: admin@theaxis.local / admin123
echo Admin Assistant: eic@theaxis.local / eic123
echo Section Head: section@theaxis.local / section123
echo Publication Staff: staff@theaxis.local / staff123
echo.
pause
