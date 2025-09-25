const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addArts() {
  try {
    console.log('🎨 Adding Arts category...');
    
    // Check if Arts category already exists
    const existing = await prisma.category.findFirst({
      where: { name: 'Arts' }
    });
    
    if (existing) {
      console.log('✅ Arts category already exists!');
      console.log('ID:', existing.id);
      console.log('Name:', existing.name);
      console.log('Slug:', existing.slug);
      return;
    }
    
    // Create Arts category with correct fields
    const artsCategory = await prisma.category.create({
      data: {
        name: 'Arts',
        slug: 'arts',
        description: 'Articles and content related to visual arts, performing arts, literature, and cultural expressions'
      }
    });
    
    console.log('✅ Arts category created successfully!');
    console.log('ID:', artsCategory.id);
    console.log('Name:', artsCategory.name);
    console.log('Slug:', artsCategory.slug);
    console.log('Description:', artsCategory.description);
    
    // Show all categories
    const allCategories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log('\n📋 All Categories:');
    allCategories.forEach((cat, i) => {
      console.log(`${i + 1}. ${cat.name} (${cat.slug})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addArts();

