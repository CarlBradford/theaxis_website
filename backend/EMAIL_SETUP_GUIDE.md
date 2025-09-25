# Email Notification Setup Guide

## Problem Identified
Section heads are not receiving notifications when articles are submitted because the email service is not configured.

## Root Cause
The email service requires SMTP configuration in a `.env` file, but this file doesn't exist or isn't properly configured.

## Solution Steps

### 1. Create .env file
```bash
cd backend
copy env.example .env
```

### 2. Configure SMTP Settings
Edit the `.env` file and update these lines:

```env
# Email Configuration (REQUIRED for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@yourdomain.com"
```

### 3. For Gmail Setup
1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to Security → App passwords
4. Generate a new app password for "Mail"
5. Use this app password (not your regular password) for `SMTP_PASS`

### 4. Alternative Email Providers
- **Outlook/Hotmail**: `smtp-mail.outlook.com`, port 587
- **Yahoo**: `smtp.mail.yahoo.com`, port 587
- **Custom SMTP**: Use your organization's SMTP server

### 5. Test Configuration
Run the test script:
```bash
node test-email-service.js
```

### 6. Restart Backend Server
After configuring, restart your backend server for changes to take effect.

## Verification
1. Submit an article as a staff member
2. Check section head's email inbox
3. Look for notification with subject: "New Article Submitted by Staff: [Article Title]"

## Troubleshooting
- Check backend logs for email service errors
- Verify SMTP credentials are correct
- Ensure firewall allows SMTP connections
- Test with a simple email first

## Code Flow
1. Article submitted with status `IN_REVIEW`
2. `notificationService.notifySectionHeadArticleSubmitted()` called
3. Finds all users with role `SECTION_HEAD`
4. Sends email via `emailService.sendSectionHeadStaffSubmissionNotification()`
5. Email contains article details and review link
