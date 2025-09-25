# Gmail SMTP Setup Guide for Password Reset Emails

## Prerequisites
1. A Gmail account
2. Two-factor authentication enabled on your Gmail account
3. An App Password generated for the application

## Step 1: Enable Two-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification if not already enabled

## Step 2: Generate App Password
1. Go to Google Account settings
2. Navigate to Security → 2-Step Verification
3. Scroll down to "App passwords"
4. Click "App passwords"
5. Select "Mail" and "Other (Custom name)"
6. Enter "The AXIS Password Reset" as the app name
7. Click "Generate"
8. Copy the 16-character password (e.g., "abcd efgh ijkl mnop")

## Step 3: Configure Environment Variables
Add these variables to your `.env` file in the backend directory:

```env
# Email Configuration for Gmail SMTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-character-app-password"
EMAIL_FROM="your-email@gmail.com"

# Frontend URL for reset links
FRONTEND_URL="http://localhost:5173"
```

## Step 4: Test Email Configuration
Run the email test script to verify your configuration:

```bash
cd backend
node test-email-config.js
```

## Important Notes
- Use the App Password, NOT your regular Gmail password
- The App Password is 16 characters without spaces
- Keep your App Password secure and don't share it
- If you change your Gmail password, you'll need to generate a new App Password

## Troubleshooting
- **Authentication failed**: Check that you're using the App Password, not your regular password
- **Connection timeout**: Check your internet connection and firewall settings
- **Invalid credentials**: Verify the email address and App Password are correct
- **Rate limiting**: Gmail has sending limits; avoid sending too many emails in a short time

## Security Best Practices
- Never commit your `.env` file to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your App Passwords
- Monitor your Gmail account for any suspicious activity
