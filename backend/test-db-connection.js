const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if users exist
    const userCount = await prisma.user.count();
    console.log(`👥 Users in database: ${userCount}`);
    
    if (userCount === 0) {
      console.log('❌ No users found - this is why login fails!');
      console.log('📝 Run: npm run db:seed');
    } else {
      console.log('✅ Users found - login should work');
      
      // Show available users
      const users = await prisma.user.findMany({
        select: {
          email: true,
          username: true,
          role: true,
          isActive: true
        }
      });
      
      console.log('\n🔑 Available login credentials:');
      users.forEach(user => {
        console.log(`  ${user.email} (${user.username}) - ${user.role}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('\n🔧 Possible solutions:');
    console.log('1. Make sure PostgreSQL is running: docker-compose up -d postgres');
    console.log('2. Check .env file exists and has correct DATABASE_URL');
    console.log('3. Run: npx prisma db push');
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
