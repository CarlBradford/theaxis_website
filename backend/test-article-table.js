const { PrismaClient } = require('@prisma/client');

async function testArticleTable() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing Article table structure and data...\n');
    
    // Test 1: Check if articles exist
    const articleCount = await prisma.article.count();
    console.log(`📰 Total articles: ${articleCount}`);
    
    if (articleCount > 0) {
      // Test 2: Get article details
      const articles = await prisma.article.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          authorId: true,
          reviewerId: true,
          createdAt: true,
          updatedAt: true
        },
        take: 3
      });
      
      console.log('\n📋 Article details:');
      articles.forEach(article => {
        console.log(`  ${article.id} - ${article.title}`);
        console.log(`    Status: ${article.status}`);
        console.log(`    Author: ${article.authorId}`);
        console.log(`    Reviewer: ${article.reviewerId || 'None'}`);
      });
      
      // Test 3: Check for missing fields
      console.log('\n🔍 Checking for missing fields...');
      const fullArticle = await prisma.article.findFirst({
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          excerpt: true,
          featuredImage: true,
          mediaCaption: true,
          status: true,
          publicationDate: true,
          publishedAt: true,
          scheduledAt: true,
          archivedAt: true,
          viewCount: true,
          likeCount: true,
          dislikeCount: true,
          commentCount: true,
          socialShares: true,
          readingTime: true,
          featured: true,
          priority: true,
          createdAt: true,
          updatedAt: true,
          authorId: true,
          reviewerId: true
        }
      });
      
      if (fullArticle) {
        console.log('\n📊 Field analysis:');
        Object.entries(fullArticle).forEach(([key, value]) => {
          const status = value !== null && value !== undefined ? '✅' : '❌';
          console.log(`  ${status} ${key}: ${value}`);
        });
      }
      
      // Test 4: Check relationships
      console.log('\n🔗 Testing relationships...');
      const articleWithRelations = await prisma.article.findFirst({
        include: {
          author: {
            select: { id: true, email: true, username: true }
          },
          reviewer: {
            select: { id: true, email: true, username: true }
          },
          categories: {
            select: { id: true, name: true, slug: true }
          },
          tags: {
            select: { id: true, name: true, slug: true }
          },
          comments: {
            select: { id: true, content: true, authorId: true }
          }
        }
      });
      
      if (articleWithRelations) {
        console.log(`\n📝 Article: ${articleWithRelations.title}`);
        console.log(`  Author: ${articleWithRelations.author?.email || 'Missing'}`);
        console.log(`  Reviewer: ${articleWithRelations.reviewer?.email || 'None'}`);
        console.log(`  Categories: ${articleWithRelations.categories.length}`);
        console.log(`  Tags: ${articleWithRelations.tags.length}`);
        console.log(`  Comments: ${articleWithRelations.comments.length}`);
      }
      
    } else {
      console.log('❌ No articles found in database');
    }
    
    // Test 5: Check for schema issues
    console.log('\n🔧 Checking for potential schema issues...');
    
    // Check if required fields are missing
    const articlesWithMissingFields = await prisma.article.findMany({
      where: {
        OR: [
          { title: null },
          { slug: null },
          { content: null },
          { authorId: null }
        ]
      }
    });
    
    if (articlesWithMissingFields.length > 0) {
      console.log(`❌ Found ${articlesWithMissingFields.length} articles with missing required fields`);
    } else {
      console.log('✅ All articles have required fields');
    }
    
    // Test 6: Check for duplicate slugs
    const duplicateSlugs = await prisma.$queryRaw`
      SELECT slug, COUNT(*) as count 
      FROM "Article" 
      GROUP BY slug 
      HAVING COUNT(*) > 1
    `;
    
    if (duplicateSlugs.length > 0) {
      console.log('❌ Found duplicate slugs:', duplicateSlugs);
    } else {
      console.log('✅ No duplicate slugs found');
    }
    
  } catch (error) {
    console.error('❌ Error testing Article table:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testArticleTable();
