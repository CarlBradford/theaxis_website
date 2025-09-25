#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up email configuration for The AXIS...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
} else {
  if (fs.existsSync(envExamplePath)) {
    try {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ Created .env file from env.example');
    } catch (error) {
      console.log('❌ Failed to create .env file:', error.message);
      process.exit(1);
    }
  } else {
    console.log('❌ env.example file not found');
    process.exit(1);
  }
}

// Read current .env content
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if SMTP is configured
const smtpConfigured = envContent.includes('SMTP_USER="your-email@gmail.com"') === false;

if (smtpConfigured) {
  console.log('✅ SMTP configuration appears to be set up');
} else {
  console.log('⚠️  SMTP configuration needs to be updated');
  console.log('\n📧 To enable email notifications, you need to:');
  console.log('1. Edit the .env file in the backend directory');
  console.log('2. Update these lines with your email settings:');
  console.log('   SMTP_USER="your-actual-email@gmail.com"');
  console.log('   SMTP_PASS="your-app-password"');
  console.log('   EMAIL_FROM="noreply@yourdomain.com"');
  console.log('\n📋 For Gmail:');
  console.log('- Use your Gmail address for SMTP_USER');
  console.log('- Generate an "App Password" for SMTP_PASS');
  console.log('- Go to Google Account → Security → 2-Step Verification → App passwords');
}

// Test email service configuration
console.log('\n🧪 Testing email service configuration...');

try {
  require('dotenv').config();
  const config = require('./src/config');
  const emailService = require('./src/services/emailService');

  console.log('SMTP_HOST:', config.email.smtp.host || 'NOT SET');
  console.log('SMTP_PORT:', config.email.smtp.port || 'NOT SET');
  console.log('SMTP_USER:', config.email.smtp.user || 'NOT SET');
  console.log('SMTP_PASS:', config.email.smtp.pass ? 'SET' : 'NOT SET');
  console.log('EMAIL_FROM:', config.email.from || 'NOT SET');

  if (emailService.transporter) {
    console.log('\n✅ Email service is properly configured and ready!');
    console.log('📬 Section heads will now receive notifications when articles are submitted.');
  } else {
    console.log('\n❌ Email service is not available');
    console.log('🔧 Please configure SMTP settings in the .env file');
  }
} catch (error) {
  console.log('❌ Error testing email service:', error.message);
}

console.log('\n🎯 Next steps:');
console.log('1. Update SMTP settings in .env file (if not done already)');
console.log('2. Restart the backend server');
console.log('3. Test by submitting an article to a section head');
console.log('4. Check the section head\'s email for the notification');
