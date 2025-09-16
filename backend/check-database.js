const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database connection...');
    
    // Check if we can connect to the database
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check total articles
    const totalArticles = await prisma.article.count();
    console.log(`📊 Total articles in database: ${totalArticles}`);
    
    // Check published articles
    const publishedArticles = await prisma.article.count({
      where: { status: 'PUBLISHED' }
    });
    console.log(`📰 Published articles: ${publishedArticles}`);
    
    // Check all article statuses
    const statusCounts = await prisma.article.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    
    console.log('📈 Article status breakdown:');
    statusCounts.forEach(status => {
      console.log(`  ${status.status}: ${status._count.status}`);
    });
    
    // Get a sample published article
    if (publishedArticles > 0) {
      const sampleArticle = await prisma.article.findFirst({
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          title: true,
          status: true,
          publishedAt: true,
          author: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });
      console.log('📄 Sample published article:', sampleArticle);
    } else {
      console.log('⚠️  No published articles found');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
