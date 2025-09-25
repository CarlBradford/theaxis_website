const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addArtsCategory() {
  console.log('🎨 Adding Arts category to database...');
  
  try {
    // Check if Arts category already exists
    const existingCategory = await prisma.category.findFirst({
      where: { name: 'Arts' }
    });
    
    if (existingCategory) {
      console.log('✅ Arts category already exists in the database');
      console.log(`📊 Category ID: ${existingCategory.id}`);
      console.log(`📊 Category Name: ${existingCategory.name}`);
      console.log(`📊 Category Description: ${existingCategory.description}`);
      return;
    }
    
    // Create the Arts category
    const artsCategory = await prisma.category.create({
      data: {
        name: 'Arts',
        description: 'Articles and content related to visual arts, performing arts, literature, and cultural expressions',
        slug: 'arts',
        isActive: true,
        sortOrder: 6, // Assuming other categories have sort orders 1-5
        metaTitle: 'Arts - The AXIS Group of Publications',
        metaDescription: 'Explore articles about visual arts, performing arts, literature, and cultural expressions on The AXIS Group of Publications.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Arts category created successfully!');
    console.log(`📊 Category ID: ${artsCategory.id}`);
    console.log(`📊 Category Name: ${artsCategory.name}`);
    console.log(`📊 Category Slug: ${artsCategory.slug}`);
    console.log(`📊 Category Description: ${artsCategory.description}`);
    console.log(`📊 Sort Order: ${artsCategory.sortOrder}`);
    
    // List all categories to show the updated list
    const allCategories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    
    console.log('\n📋 All Categories:');
    allCategories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} (${category.slug}) - ${category.description}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding Arts category:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addArtsCategory()
  .then(() => {
    console.log('🎉 Arts category addition completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Arts category addition failed:', error);
    process.exit(1);
  });
