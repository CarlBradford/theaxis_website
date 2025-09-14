const { PrismaClient } = require('@prisma/client');

async function updateCategories() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting category update...');
    
    // Create the 8 allowed categories
    const allowedCategories = [
      'Development Communication',
      'Editorial', 
      'Feature',
      'Literary',
      'News',
      'Opinion',
      'Sports',
      'The AXIS Online'
    ];

    // Create categories
    for (const categoryName of allowedCategories) {
      await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { 
          name: categoryName, 
          slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
          description: `${categoryName} content`
        }
      });
    }

    // Get all articles and update them to use Feature category
    const articles = await prisma.article.findMany();
    
    for (const article of articles) {
      await prisma.article.update({
        where: { id: article.id },
        data: {
          categories: {
            set: [],
            connect: [{ name: 'Feature' }]
          }
        }
      });
    }

    console.log('Categories updated successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateCategories();
