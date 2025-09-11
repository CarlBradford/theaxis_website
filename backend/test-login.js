const { PrismaClient } = require('@prisma/client');

async function testLogin() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing login credentials...');
    
    // Check if users exist
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true
      }
    });
    
    console.log(`\n👥 Found ${users.length} users in database:`);
    users.forEach(user => {
      console.log(`  ${user.email} (${user.username}) - ${user.role} - Active: ${user.isActive}`);
    });
    
    // Test specific login credentials
    const testCredentials = [
      { email: 'admin@theaxis.local', password: 'admin123' },
      { email: 'eic@theaxis.local', password: 'eic123' },
      { email: 'section@theaxis.local', password: 'section123' },
      { email: 'staff@theaxis.local', password: 'staff123' }
    ];
    
    console.log('\n🔐 Testing login credentials:');
    
    for (const cred of testCredentials) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: cred.email },
            { username: cred.email }
          ]
        }
      });
      
      if (user) {
        console.log(`✅ User found: ${user.email} (${user.username})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Email Verified: ${user.emailVerified}`);
        console.log(`   Password Hash: ${user.passwordHash ? 'Set' : 'Not set'}`);
      } else {
        console.log(`❌ User not found: ${cred.email}`);
      }
    }
    
    // Test password verification
    const argon2 = require('argon2');
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@theaxis.local' }
    });
    
    if (adminUser) {
      console.log('\n🔑 Testing password verification:');
      try {
        const isValid = await argon2.verify(adminUser.passwordHash, 'admin123');
        console.log(`Password 'admin123' for admin: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      } catch (error) {
        console.log(`❌ Password verification failed: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
