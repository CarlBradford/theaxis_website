const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Test basic queries
    const userCount = await prisma.user.count();
    console.log(`Users: ${userCount}`);
    
    const articleCount = await prisma.article.count();
    console.log(`Articles: ${articleCount}`);
    
    const categoryCount = await prisma.category.count();
    console.log(`Categories: ${categoryCount}`);
    
    const tagCount = await prisma.tag.count();
    console.log(`Tags: ${tagCount}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
