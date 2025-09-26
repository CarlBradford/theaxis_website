const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing Prisma connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Connection successful:', result);
    
    const categories = await prisma.category.findMany();
    console.log('Categories found:', categories.length);
    
    await prisma.$disconnect();
    console.log('Disconnected successfully');
  } catch (error) {
    console.error('Connection failed:', error);
    await prisma.$disconnect();
  }
}

testConnection();
