@echo off
echo 🔧 Fixing login issues...
echo.

echo Step 1: Creating .env file...
if not exist .env (
    copy env.example .env
    echo ✅ .env file created
) else (
    echo ✅ .env file already exists
)

echo.
echo Step 2: Installing dependencies...
npm install

echo.
echo Step 3: Applying database schema...
npx prisma db push

echo.
echo Step 4: Generating Prisma client...
npx prisma generate

echo.
echo Step 5: Seeding database with users...
npm run db:seed

echo.
echo Step 6: Starting server...
echo ✅ Server starting on port 3001
echo.
echo 🔑 Login Credentials:
echo Admin: admin@theaxis.local / admin123
echo Editor: eic@theaxis.local / eic123
echo Section Head: section@theaxis.local / section123
echo Staff: staff@theaxis.local / staff123
echo.
echo 🌐 Frontend should be running on: http://localhost:5173
echo 📊 Prisma Studio: http://localhost:5555
echo.
npm start
