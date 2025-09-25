const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
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
      return;
    }
    
    // Create Arts category
    const artsCategory = await prisma.category.create({
      data: {
        name: 'Arts',
        description: 'Articles and content related to visual arts, performing arts, literature, and cultural expressions',
        slug: 'arts',
        isActive: true,
        sortOrder: 6,
        metaTitle: 'Arts - The AXIS Group of Publications',
        metaDescription: 'Explore articles about visual arts, performing arts, literature, and cultural expressions.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Arts category created successfully!');
    console.log('ID:', artsCategory.id);
    console.log('Name:', artsCategory.name);
    console.log('Slug:', artsCategory.slug);
    
    // Show all categories
    const allCategories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' }
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

main();

