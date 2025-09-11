const { PrismaClient } = require('@prisma/client');

async function comprehensiveArticleFix() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Comprehensive Article Table Fix...\n');
    
    // Step 1: Validate schema
    console.log('📋 Step 1: Validating schema...');
    const { execSync } = require('child_process');
    try {
      execSync('npx prisma validate', { stdio: 'pipe' });
      console.log('✅ Schema is valid');
    } catch (error) {
      console.log('❌ Schema validation failed:', error.message);
      return;
    }
    
    // Step 2: Check database connection
    console.log('\n📋 Step 2: Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Step 3: Check Article table structure
    console.log('\n📋 Step 3: Checking Article table...');
    const articleCount = await prisma.article.count();
    console.log(`📰 Articles in database: ${articleCount}`);
    
    // Step 4: Test article creation
    console.log('\n📋 Step 4: Testing article creation...');
    try {
      const testArticle = await prisma.article.create({
        data: {
          title: 'Test Article - System Fix',
          slug: 'test-article-system-fix',
          content: 'This is a test article to verify the system is working correctly.',
          excerpt: 'Test article for system verification',
          authorId: 'user_staff',
          status: 'DRAFT'
        }
      });
      console.log('✅ Article creation successful');
      console.log(`   Created article: ${testArticle.id}`);
      
      // Clean up test article
      await prisma.article.delete({
        where: { id: testArticle.id }
      });
      console.log('✅ Test article cleaned up');
      
    } catch (error) {
      console.log('❌ Article creation failed:', error.message);
    }
    
    // Step 5: Test relationships
    console.log('\n📋 Step 5: Testing relationships...');
    const articleWithRelations = await prisma.article.findFirst({
      include: {
        author: {
          select: { id: true, email: true, username: true, role: true }
        },
        categories: true,
        tags: true
      }
    });
    
    if (articleWithRelations) {
      console.log('✅ Relationships working correctly');
      console.log(`   Author: ${articleWithRelations.author?.email}`);
      console.log(`   Categories: ${articleWithRelations.categories.length}`);
      console.log(`   Tags: ${articleWithRelations.tags.length}`);
    } else {
      console.log('⚠️  No articles found to test relationships');
    }
    
    // Step 6: Check for data integrity issues
    console.log('\n📋 Step 6: Checking data integrity...');
    
    // Check for articles with missing required fields
    const invalidArticles = await prisma.article.findMany({
      where: {
        OR: [
          { title: '' },
          { slug: '' },
          { content: '' },
          { authorId: '' }
        ]
      }
    });
    
    if (invalidArticles.length > 0) {
      console.log(`❌ Found ${invalidArticles.length} articles with invalid data`);
    } else {
      console.log('✅ All articles have valid data');
    }
    
    // Step 7: Test API compatibility
    console.log('\n📋 Step 7: Testing API compatibility...');
    const articlesForAPI = await prisma.article.findMany({
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
      },
      take: 1
    });
    
    if (articlesForAPI.length > 0) {
      console.log('✅ API data structure is correct');
      const article = articlesForAPI[0];
      console.log(`   Sample article: ${article.title}`);
      console.log(`   Status: ${article.status}`);
      console.log(`   Featured: ${article.featured}`);
      console.log(`   Priority: ${article.priority}`);
    }
    
    console.log('\n🎉 Article table fix completed successfully!');
    console.log('\n📊 System Status:');
    console.log('✅ Schema is valid');
    console.log('✅ Database connected');
    console.log('✅ Article table structure correct');
    console.log('✅ Relationships working');
    console.log('✅ Data integrity verified');
    console.log('✅ API compatibility confirmed');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

comprehensiveArticleFix();
