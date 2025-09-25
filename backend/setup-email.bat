@echo off
echo Setting up email configuration for The AXIS...
echo.

REM Check if .env file exists
if exist .env (
    echo ✅ .env file already exists
) else (
    echo 📝 Creating .env file from env.example...
    copy env.example .env
    if exist .env (
        echo ✅ .env file created successfully
    ) else (
        echo ❌ Failed to create .env file
        pause
        exit /b 1
    )
)

echo.
echo 📧 Email Configuration Setup Complete!
echo.
echo 🔧 Next steps:
echo 1. Edit the .env file in this directory
echo 2. Update these lines with your email settings:
echo    SMTP_USER="your-actual-email@gmail.com"
echo    SMTP_PASS="your-app-password"
echo    EMAIL_FROM="noreply@yourdomain.com"
echo.
echo 📋 For Gmail:
echo - Use your Gmail address for SMTP_USER
echo - Generate an "App Password" for SMTP_PASS
echo - Go to Google Account → Security → 2-Step Verification → App passwords
echo.
echo 🧪 Test the configuration:
echo node test-email-service.js
echo.
echo 🔄 Restart the backend server after configuration
echo.
pause
