const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkArticle() {
  try {
    const slug = 'opinion-the-future-of-digital-learning-part-50';
    
    console.log(`Checking for article with slug: ${slug}`);
    
    const article = await prisma.article.findFirst({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        createdAt: true
      }
    });
    
    if (article) {
      console.log('Article found:', article);
    } else {
      console.log('Article not found');
      
      // Let's also check if there are any articles with similar slugs
      const similarArticles = await prisma.article.findMany({
        where: {
          slug: {
            contains: 'opinion-the-future-of-digital-learning'
          }
        },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true
        },
        take: 5
      });
      
      console.log('Similar articles found:', similarArticles);
    }
    
    // Let's also check total article count
    const totalArticles = await prisma.article.count();
    console.log(`Total articles in database: ${totalArticles}`);
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkArticle();
