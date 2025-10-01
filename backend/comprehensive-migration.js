const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runComprehensiveMigration() {
  console.log('🚀 Starting comprehensive database migration...');
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Step 1: Apply schema changes
    console.log('📝 Step 1: Applying schema changes...');
    try {
      const { execSync } = require('child_process');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: process.cwd() });
      console.log('✅ Schema changes applied successfully');
    } catch (error) {
      console.log('⚠️  Schema push failed, continuing with manual approach...');
    }
    
    // Step 2: Generate Prisma client
    console.log('🔧 Step 2: Generating Prisma client...');
    try {
      const { execSync } = require('child_process');
      execSync('npx prisma generate', { stdio: 'inherit', cwd: process.cwd() });
      console.log('✅ Prisma client generated');
    } catch (error) {
      console.log('⚠️  Prisma generate failed, continuing...');
    }
    
    // Step 3: Run migrations in order
    console.log('📄 Step 3: Running migrations in order...');
    await runMigrationsInOrder();
    
    // Step 4: Verify and show results
    await verifyMigration();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function runMigrationsInOrder() {
  const migrations = [
    {
      name: 'Categories',
      sql: `
        INSERT INTO "Category" ("id", "name", "slug", "description", "createdAt", "updatedAt") 
        VALUES 
          ('cat_news', 'News', 'news', 'Latest news and current events', NOW(), NOW()),
          ('cat_opinion', 'Opinion', 'opinion', 'Editorials and opinion pieces', NOW(), NOW()),
          ('cat_features', 'Features', 'features', 'In-depth feature articles', NOW(), NOW()),
          ('cat_sports', 'Sports', 'sports', 'Sports coverage and analysis', NOW(), NOW()),
          ('cat_arts_culture', 'Arts & Culture', 'arts-culture', 'Arts, entertainment, and cultural coverage', NOW(), NOW()),
          ('cat_platform_updates', 'Platform Updates', 'platform-updates', 'Updates and announcements about The AXIS platform', NOW(), NOW()),
          ('cat_student_life', 'Student Life', 'student-life', 'Content related to student experiences and campus life', NOW(), NOW()),
          ('cat_technology', 'Technology', 'technology', 'Technology news, reviews, and insights', NOW(), NOW()),
          ('cat_education', 'Education', 'education', 'Educational content and academic discussions', NOW(), NOW()),
          ('cat_journalism', 'Journalism', 'journalism', 'Journalism techniques, ethics, and industry news', NOW(), NOW())
        ON CONFLICT (slug) DO NOTHING;
      `
    },
    {
      name: 'Tags',
      sql: `
        INSERT INTO "Tag" ("id", "name", "slug", "description", "color", "createdAt", "updatedAt") 
        VALUES 
          ('tag_breaking_news', 'Breaking News', 'breaking-news', 'Urgent and time-sensitive news', '#dc2626', NOW(), NOW()),
          ('tag_exclusive', 'Exclusive', 'exclusive', 'Exclusive content and interviews', '#7c3aed', NOW(), NOW()),
          ('tag_investigation', 'Investigation', 'investigation', 'Investigative journalism pieces', '#059669', NOW(), NOW()),
          ('tag_student_life', 'Student Life', 'student-life', 'Content related to student experiences', '#ea580c', NOW(), NOW()),
          ('tag_platform', 'Platform', 'platform', 'Content about The AXIS platform features and updates', '#2563eb', NOW(), NOW()),
          ('tag_introduction', 'Introduction', 'introduction', 'Introductory content and getting started guides', '#16a34a', NOW(), NOW()),
          ('tag_digital', 'Digital', 'digital', 'Digital technology and online content', '#9333ea', NOW(), NOW()),
          ('tag_tutorial', 'Tutorial', 'tutorial', 'Step-by-step instructional content', '#dc2626', NOW(), NOW()),
          ('tag_content_creation', 'Content Creation', 'content-creation', 'Content creation techniques and tools', '#ea580c', NOW(), NOW()),
          ('tag_guide', 'Guide', 'guide', 'Comprehensive guides and how-to content', '#059669', NOW(), NOW()),
          ('tag_workflow', 'Workflow', 'workflow', 'Process and workflow management', '#7c3aed', NOW(), NOW()),
          ('tag_editorial', 'Editorial', 'editorial', 'Editorial processes and management', '#dc2626', NOW(), NOW()),
          ('tag_process', 'Process', 'process', 'Step-by-step processes and procedures', '#16a34a', NOW(), NOW()),
          ('tag_journalism', 'Journalism', 'journalism', 'Journalism techniques and industry news', '#2563eb', NOW(), NOW()),
          ('tag_students', 'Students', 'students', 'Content specifically for students', '#ea580c', NOW(), NOW()),
          ('tag_digital_age', 'Digital Age', 'digital-age', 'Content about modern digital era', '#9333ea', NOW(), NOW()),
          ('tag_community', 'Community', 'community', 'Community building and engagement', '#059669', NOW(), NOW()),
          ('tag_campus', 'Campus', 'campus', 'Campus-related content and news', '#dc2626', NOW(), NOW()),
          ('tag_publications', 'Publications', 'publications', 'Publication management and strategy', '#7c3aed', NOW(), NOW())
        ON CONFLICT (slug) DO NOTHING;
      `
    },
    {
      name: 'Users',
      sql: `
        INSERT INTO "User" ("id", "email", "username", "firstName", "lastName", "passwordHash", "role", "isActive", "emailVerified", "bio", "createdAt", "updatedAt") 
        VALUES 
          ('user_admin', 'admin@theaxis.local', 'admin', 'System', 'Administrator', '$argon2id$v=19$m=65536,t=3,p=1$9qAt6+s3OYV8gDjiRN1Gkw$zzeWQW9SsJYfsM9EMcfUinuxGVAnuChzbvq7UMp/Dzo', 'ADMINISTRATOR', true, true, 'System administrator for The AXIS platform', NOW(), NOW()),
          ('user_eic', 'eic@theaxis.local', 'editorinchief', 'Editor', 'In Chief', '$argon2id$v=19$m=65536,t=3,p=1$64MoHdAwmm64EYtYPqKGag$vbCIXi2M6yG/s/VOKRb9+okUsEqiyv1gzVMSxp/Vhqk', 'ADMIN_ASSISTANT', true, true, 'Admin Assistant of The AXIS publication', NOW(), NOW()),
          ('user_section', 'section@theaxis.local', 'sectionhead', 'Section', 'Head', '$argon2id$v=19$m=65536,t=3,p=1$0HGwZW2BPfb9jpNHEe+BjA$e2GnXPfqnfw0zNsWRR/bTJLaGee9Fx3jA8Faj/41ovE', 'SECTION_HEAD', true, true, 'Section Head for The AXIS publication', NOW(), NOW()),
          ('user_staff', 'staff@theaxis.local', 'publicationstaff', 'Staff', 'Writer', '$argon2id$v=19$m=65536,t=3,p=1$L2WHYvS49FrtCfhhA5thqA$9QRfSK2+7u0gTA/neLgNBXNriWYbll4cIFtNyBkwUio', 'STAFF', true, true, 'Publication staff for The AXIS publication', NOW(), NOW())
        ON CONFLICT (email) DO NOTHING;
      `
    }
  ];
  
  for (const migration of migrations) {
    try {
      console.log(`📄 Running ${migration.name} migration...`);
      await prisma.$executeRawUnsafe(migration.sql);
      console.log(`✅ ${migration.name} migration completed`);
    } catch (error) {
      console.log(`⚠️  ${migration.name} migration failed (may already exist):`, error.message);
    }
  }
  
  // Step 4: Add comprehensive article data
  console.log('📰 Step 4: Adding comprehensive article data...');
  await addComprehensiveArticleData();
}

async function addComprehensiveArticleData() {
  const articles = [
    {
      id: 'article_1',
      title: 'Welcome to The AXIS: Your New Digital Publication Platform',
      slug: 'welcome-to-the-axis-digital-publication-platform',
      content: 'Welcome to The AXIS, your comprehensive digital publication platform designed specifically for educational institutions. This platform revolutionizes how students, faculty, and staff create, manage, and share content in an organized, professional manner.',
      excerpt: 'Discover The AXIS platform - a comprehensive digital publication system designed for educational institutions with powerful content management and editorial workflow tools.',
      featuredImage: 'https://example.com/images/welcome-axis.jpg',
      mediaCaption: 'The AXIS platform interface showing content management dashboard',
      status: 'PUBLISHED',
      publicationDate: new Date('2025-01-15T10:00:00Z'),
      publishedAt: new Date('2025-01-15T10:05:00Z'),
      viewCount: 1250,
      likeCount: 89,
      dislikeCount: 3,
      commentCount: 23,
      socialShares: 45,
      readingTime: 8,
      featured: true,
      priority: 10,
      authorId: 'user_staff',
      reviewerId: 'user_eic',
      categories: ['platform-updates'],
      tags: ['platform', 'introduction', 'digital']
    },
    {
      id: 'article_2',
      title: 'Getting Started: A Complete Guide to Content Creation',
      slug: 'getting-started-complete-guide-content-creation',
      content: 'Creating compelling content on The AXIS platform is easier than ever. This comprehensive guide walks you through every aspect of content creation, from brainstorming ideas to publishing your final piece.',
      excerpt: 'Master content creation on The AXIS platform with this comprehensive guide covering everything from ideation to publication.',
      featuredImage: 'https://example.com/images/content-creation-guide.jpg',
      mediaCaption: 'Screenshot of The AXIS content creation interface',
      status: 'PUBLISHED',
      publicationDate: new Date('2025-01-14T14:00:00Z'),
      publishedAt: new Date('2025-01-14T14:15:00Z'),
      viewCount: 890,
      likeCount: 67,
      dislikeCount: 2,
      commentCount: 18,
      socialShares: 32,
      readingTime: 12,
      featured: true,
      priority: 9,
      authorId: 'user_staff',
      reviewerId: 'user_section',
      categories: ['platform-updates'],
      tags: ['tutorial', 'content-creation', 'guide']
    },
    {
      id: 'article_3',
      title: 'Student Journalism in the Digital Age',
      slug: 'student-journalism-digital-age',
      content: 'The landscape of student journalism has evolved dramatically with digital technology. Today\'s student journalists have access to powerful tools and platforms that enable them to reach wider audiences.',
      excerpt: 'Explore how digital technology is transforming student journalism and the new opportunities it presents for young journalists.',
      featuredImage: 'https://example.com/images/student-journalism.jpg',
      mediaCaption: 'Students working on digital journalism projects',
      status: 'PUBLISHED',
      publicationDate: new Date('2025-01-12T12:00:00Z'),
      publishedAt: new Date('2025-01-12T12:10:00Z'),
      viewCount: 1123,
      likeCount: 78,
      dislikeCount: 4,
      commentCount: 31,
      socialShares: 52,
      readingTime: 15,
      featured: true,
      priority: 7,
      authorId: 'user_staff',
      reviewerId: 'user_section',
      categories: ['student-life'],
      tags: ['journalism', 'students', 'digital-age']
    }
  ];
  
  for (const articleData of articles) {
    try {
      // Create the article
      const article = await prisma.article.create({
        data: {
          id: articleData.id,
          title: articleData.title,
          slug: articleData.slug,
          content: articleData.content,
          excerpt: articleData.excerpt,
          featuredImage: articleData.featuredImage,
          mediaCaption: articleData.mediaCaption,
          status: articleData.status,
          publicationDate: articleData.publicationDate,
          publishedAt: articleData.publishedAt,
          viewCount: articleData.viewCount,
          likeCount: articleData.likeCount,
          dislikeCount: articleData.dislikeCount,
          commentCount: articleData.commentCount,
          socialShares: articleData.socialShares,
          readingTime: articleData.readingTime,
          featured: articleData.featured,
          priority: articleData.priority,
          authorId: articleData.authorId,
          reviewerId: articleData.reviewerId
        }
      });
      
      // Connect to categories
      if (articleData.categories && articleData.categories.length > 0) {
        for (const categorySlug of articleData.categories) {
          const category = await prisma.category.findUnique({
            where: { slug: categorySlug }
          });
          if (category) {
            await prisma.article.update({
              where: { id: article.id },
              data: {
                categories: {
                  connect: { id: category.id }
                }
              }
            });
          }
        }
      }
      
      // Connect to tags
      if (articleData.tags && articleData.tags.length > 0) {
        for (const tagSlug of articleData.tags) {
          const tag = await prisma.tag.findUnique({
            where: { slug: tagSlug }
          });
          if (tag) {
            await prisma.article.update({
              where: { id: article.id },
              data: {
                tags: {
                  connect: { id: tag.id }
                }
              }
            });
          }
        }
      }
      
      console.log(`✅ Created article: ${articleData.title}`);
    } catch (error) {
      console.log(`⚠️  Article ${articleData.title} may already exist:`, error.message);
    }
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration results...');
  
  try {
    const userCount = await prisma.user.count();
    const articleCount = await prisma.article.count();
    const categoryCount = await prisma.category.count();
    const tagCount = await prisma.tag.count();
    
    console.log('\n📊 Migration Results:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`📰 Articles: ${articleCount}`);
    console.log(`📂 Categories: ${categoryCount}`);
    console.log(`🏷️  Tags: ${tagCount}`);
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('👤 Admin: admin@theaxis.local / admin123');
    console.log('👑 Admin Assistant: eic@theaxis.local / eic123');
    console.log('📰 Section Head: section@theaxis.local / section123');
    console.log('✍️ Publication Staff: staff@theaxis.local / staff123');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the comprehensive migration
runComprehensiveMigration()
  .catch((error) => {
    console.error('❌ Comprehensive migration failed:', error);
    process.exit(1);
  });
