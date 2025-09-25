const nodemailer = require('nodemailer');
const config = require('./src/config');

async function testEmailConfiguration() {
  console.log('🔧 Testing Gmail SMTP Configuration...\n');

  // Check if email configuration is present
  if (!config.email.smtp.host || !config.email.smtp.user || !config.email.smtp.pass) {
    console.error('❌ Email configuration is incomplete!');
    console.log('\nRequired environment variables:');
    console.log('- SMTP_HOST (should be "smtp.gmail.com")');
    console.log('- SMTP_PORT (should be 587)');
    console.log('- SMTP_USER (your Gmail address)');
    console.log('- SMTP_PASS (your Gmail App Password)');
    console.log('- EMAIL_FROM (sender email address)');
    console.log('\nPlease check your .env file and ensure all email variables are set.');
    console.log('See GMAIL_SETUP_GUIDE.md for detailed instructions.');
    return;
  }

  console.log('📧 Email Configuration:');
  console.log(`   Host: ${config.email.smtp.host}`);
  console.log(`   Port: ${config.email.smtp.port}`);
  console.log(`   User: ${config.email.smtp.user}`);
  console.log(`   From: ${config.email.from}`);
  console.log(`   Pass: ${config.email.smtp.pass ? '***' + config.email.smtp.pass.slice(-4) : 'Not set'}`);
  console.log('');

  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: config.email.smtp.host,
    port: config.email.smtp.port,
    secure: config.email.smtp.port === 465,
    auth: {
      user: config.email.smtp.user,
      pass: config.email.smtp.pass,
    },
  });

  try {
    console.log('🔍 Verifying SMTP connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    
    console.log('\n📨 Testing password reset email...');
    
    // Test password reset email
    const testToken = 'test-token-12345';
    const testEmail = config.email.smtp.user; // Send to the same email
    const resetUrl = `${config.frontendUrl || 'http://localhost:5173'}/reset-password?token=${testToken}`;
    
    const mailOptions = {
      from: config.email.from,
      to: testEmail,
      subject: 'Test: Password Reset - The AXIS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test: Password Reset Request</h2>
          <p>Hello Test User,</p>
          <p>This is a test email to verify that the password reset functionality is working correctly.</p>
          <p>Click the button below to test the reset link:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Test Reset Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p><strong>This is a test email - the link will not work for actual password reset.</strong></p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Sent to: ${testEmail}`);
    
    console.log('\n🎉 Email configuration is working correctly!');
    console.log('You can now use the password reset functionality.');
    
  } catch (error) {
    console.error('❌ Email configuration test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Common solutions:');
      console.log('   1. Make sure you\'re using an App Password, not your regular Gmail password');
      console.log('   2. Verify that 2-Step Verification is enabled on your Gmail account');
      console.log('   3. Check that the App Password is correct (16 characters)');
      console.log('   4. Ensure the email address is correct');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Common solutions:');
      console.log('   1. Check your internet connection');
      console.log('   2. Verify firewall settings allow SMTP connections');
      console.log('   3. Check if your ISP blocks SMTP ports');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 Connection timeout. Common solutions:');
      console.log('   1. Check your internet connection');
      console.log('   2. Try again in a few minutes');
      console.log('   3. Check if Gmail servers are experiencing issues');
    }
    
    console.log('\n📖 See GMAIL_SETUP_GUIDE.md for detailed setup instructions.');
  }
}

// Run the test
testEmailConfiguration().catch(console.error);
