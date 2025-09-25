const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDB() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);
    
    // Check existing categories
    const categories = await prisma.category.findMany();
    console.log(`📊 Found ${categories.length} existing categories:`);
    categories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.slug})`);
    });
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();

