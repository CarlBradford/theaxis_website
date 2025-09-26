const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Get all categories
    const categories = await prisma.category.findMany();
    console.log('Categories:', categories.length);
    categories.forEach(cat => console.log('-', cat.name));
    
    // Get all published articles
    const articles = await prisma.article.findMany({
      where: { status: 'published' },
      include: { categories: true }
    });
    console.log('\nPublished articles:', articles.length);
    
    // Group articles by category
    const categoryCounts = {};
    articles.forEach(article => {
      article.categories.forEach(cat => {
        categoryCounts[cat.name] = (categoryCounts[cat.name] || 0) + 1;
      });
    });
    
    console.log('\nArticles per category:');
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log('-', cat + ':', count);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkDatabase();