const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Found ${userCount} users in database`);
    
    const articleCount = await prisma.article.count();
    console.log(`📰 Found ${articleCount} articles in database`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check if Docker container is running: docker ps');
    console.log('3. Start database: docker-compose up -d postgres');
    console.log('4. Check .env file has correct DATABASE_URL');
    console.log('5. Verify database credentials');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
