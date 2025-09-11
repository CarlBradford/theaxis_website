const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Starting comprehensive database seeding...');
  
  try {
    // Step 1: Ensure essential seed data exists (with predictable IDs)
    await ensureSeedData();
    
    // Step 2: Add additional data with automatic IDs
    await addAdditionalData();
    
    // Step 3: Verify everything
    await verifyData();
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function ensureSeedData() {
  console.log('📋 Ensuring essential seed data...');
  
  // Categories with predictable IDs (for references)
  const categories = [
    { id: 'cat_news', name: 'News', slug: 'news', description: 'Latest news and current events' },
    { id: 'cat_opinion', name: 'Opinion', slug: 'opinion', description: 'Editorials and opinion pieces' },
    { id: 'cat_features', name: 'Features', slug: 'features', description: 'In-depth feature articles' },
    { id: 'cat_sports', name: 'Sports', slug: 'sports', description: 'Sports coverage and analysis' },
    { id: 'cat_arts_culture', name: 'Arts & Culture', slug: 'arts-culture', description: 'Arts, entertainment, and cultural coverage' },
    { id: 'cat_platform_updates', name: 'Platform Updates', slug: 'platform-updates', description: 'Updates and announcements about The AXIS platform' },
    { id: 'cat_student_life', name: 'Student Life', slug: 'student-life', description: 'Content related to student experiences and campus life' },
    { id: 'cat_technology', name: 'Technology', slug: 'technology', description: 'Technology news, reviews, and insights' },
    { id: 'cat_education', name: 'Education', slug: 'education', description: 'Educational content and academic discussions' },
    { id: 'cat_journalism', name: 'Journalism', slug: 'journalism', description: 'Journalism techniques, ethics, and industry news' }
  ];
  
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description
      }
    });
  }
  
  // Tags with predictable IDs (for references)
  const tags = [
    { id: 'tag_breaking_news', name: 'Breaking News', slug: 'breaking-news', description: 'Urgent and time-sensitive news', color: '#dc2626' },
    { id: 'tag_exclusive', name: 'Exclusive', slug: 'exclusive', description: 'Exclusive content and interviews', color: '#7c3aed' },
    { id: 'tag_investigation', name: 'Investigation', slug: 'investigation', description: 'Investigative journalism pieces', color: '#059669' },
    { id: 'tag_student_life', name: 'Student Life', slug: 'student-life', description: 'Content related to student experiences', color: '#ea580c' },
    { id: 'tag_platform', name: 'Platform', slug: 'platform', description: 'Content about The AXIS platform features and updates', color: '#2563eb' },
    { id: 'tag_introduction', name: 'Introduction', slug: 'introduction', description: 'Introductory content and getting started guides', color: '#16a34a' },
    { id: 'tag_digital', name: 'Digital', slug: 'digital', description: 'Digital technology and online content', color: '#9333ea' },
    { id: 'tag_tutorial', name: 'Tutorial', slug: 'tutorial', description: 'Step-by-step instructional content', color: '#dc2626' },
    { id: 'tag_content_creation', name: 'Content Creation', slug: 'content-creation', description: 'Content creation techniques and tools', color: '#ea580c' },
    { id: 'tag_guide', name: 'Guide', slug: 'guide', description: 'Comprehensive guides and how-to content', color: '#059669' },
    { id: 'tag_workflow', name: 'Workflow', slug: 'workflow', description: 'Process and workflow management', color: '#7c3aed' },
    { id: 'tag_editorial', name: 'Editorial', slug: 'editorial', description: 'Editorial processes and management', color: '#dc2626' },
    { id: 'tag_process', name: 'Process', slug: 'process', description: 'Step-by-step processes and procedures', color: '#16a34a' },
    { id: 'tag_journalism', name: 'Journalism', slug: 'journalism', description: 'Journalism techniques and industry news', color: '#2563eb' },
    { id: 'tag_students', name: 'Students', slug: 'students', description: 'Content specifically for students', color: '#ea580c' },
    { id: 'tag_digital_age', name: 'Digital Age', slug: 'digital-age', description: 'Content about modern digital era', color: '#9333ea' },
    { id: 'tag_community', name: 'Community', slug: 'community', description: 'Community building and engagement', color: '#059669' },
    { id: 'tag_campus', name: 'Campus', slug: 'campus', description: 'Campus-related content and news', color: '#dc2626' },
    { id: 'tag_publications', name: 'Publications', slug: 'publications', description: 'Publication management and strategy', color: '#7c3aed' }
  ];
  
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        color: tag.color
      }
    });
  }
  
  // Users with predictable IDs (for references)
  const users = [
    { 
      id: 'user_admin', 
      email: 'admin@theaxis.local', 
      username: 'admin', 
      firstName: 'System', 
      lastName: 'Administrator', 
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$9qAt6+s3OYV8gDjiRN1Gkw$zzeWQW9SsJYfsM9EMcfUinuxGVAnuChzbvq7UMp/Dzo', 
      role: 'ADVISER' 
    },
    { 
      id: 'user_eic', 
      email: 'eic@theaxis.local', 
      username: 'editorinchief', 
      firstName: 'Editor', 
      lastName: 'In Chief', 
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$64MoHdAwmm64EYtYPqKGag$vbCIXi2M6yG/s/VOKRb9+okUsEqiyv1gzVMSxp/Vhqk', 
      role: 'EDITOR_IN_CHIEF' 
    },
    { 
      id: 'user_section', 
      email: 'section@theaxis.local', 
      username: 'sectionhead', 
      firstName: 'Section', 
      lastName: 'Head', 
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$0HGwZW2BPfb9jpNHEe+BjA$e2GnXPfqnfw0zNsWRR/bTJLaGee9Fx3jA8Faj/41ovE', 
      role: 'SECTION_HEAD' 
    },
    { 
      id: 'user_staff', 
      email: 'staff@theaxis.local', 
      username: 'publicationstaff', 
      firstName: 'Staff', 
      lastName: 'Writer', 
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$L2WHYvS49FrtCfhhA5thqA$9QRfSK2+7u0gTA/neLgNBXNriWYbll4cIFtNyBkwUio', 
      role: 'STAFF' 
    }
  ];
  
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        passwordHash: user.passwordHash,
        role: user.role,
        isActive: true,
        emailVerified: true,
        bio: `Default ${user.role.toLowerCase().replace('_', ' ')} account`
      }
    });
  }
  
  console.log('✅ Essential seed data ensured');
}

async function addAdditionalData() {
  console.log('📰 Adding additional data with automatic IDs...');
  
  // Get existing users for references
  const users = await prisma.user.findMany();
  const categories = await prisma.category.findMany();
  const tags = await prisma.tag.findMany();
  
  // Add articles with automatic IDs
  const articles = [
    {
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
      categorySlugs: ['platform-updates'],
      tagSlugs: ['platform', 'introduction', 'digital']
    },
    {
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
      categorySlugs: ['platform-updates'],
      tagSlugs: ['tutorial', 'content-creation', 'guide']
    },
    {
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
      categorySlugs: ['student-life'],
      tagSlugs: ['journalism', 'students', 'digital-age']
    }
  ];
  
  for (const articleData of articles) {
    try {
      // Create article with automatic ID
      const article = await prisma.article.create({
        data: {
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
      if (articleData.categorySlugs && articleData.categorySlugs.length > 0) {
        const categoryIds = categories
          .filter(cat => articleData.categorySlugs.includes(cat.slug))
          .map(cat => cat.id);
        
        if (categoryIds.length > 0) {
          await prisma.article.update({
            where: { id: article.id },
            data: {
              categories: {
                connect: categoryIds.map(id => ({ id }))
              }
            }
          });
        }
      }
      
      // Connect to tags
      if (articleData.tagSlugs && articleData.tagSlugs.length > 0) {
        const tagIds = tags
          .filter(tag => articleData.tagSlugs.includes(tag.slug))
          .map(tag => tag.id);
        
        if (tagIds.length > 0) {
          await prisma.article.update({
            where: { id: article.id },
            data: {
              tags: {
                connect: tagIds.map(id => ({ id }))
              }
            }
          });
        }
      }
      
      console.log(`✅ Created article with automatic ID: ${article.id} - ${articleData.title}`);
    } catch (error) {
      console.log(`⚠️  Article ${articleData.title} may already exist:`, error.message);
    }
  }
}

async function verifyData() {
  console.log('🔍 Verifying data...');
  
  const userCount = await prisma.user.count();
  const articleCount = await prisma.article.count();
  const categoryCount = await prisma.category.count();
  const tagCount = await prisma.tag.count();
  
  console.log('\n📊 Database Status:');
  console.log(`👥 Users: ${userCount}`);
  console.log(`📰 Articles: ${articleCount}`);
  console.log(`📂 Categories: ${categoryCount}`);
  console.log(`🏷️  Tags: ${tagCount}`);
  
  // Show some examples of automatic IDs
  const recentArticles = await prisma.article.findMany({
    take: 3,
    select: { id: true, title: true, slug: true }
  });
  
  console.log('\n🆔 Article IDs (automatic):');
  recentArticles.forEach(article => {
    console.log(`  ${article.id} - ${article.title}`);
  });
  
  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('👤 Admin: admin@theaxis.local / admin123');
  console.log('👑 Editor-in-Chief: eic@theaxis.local / eic123');
  console.log('📰 Section Head: section@theaxis.local / section123');
  console.log('✍️ Publication Staff: staff@theaxis.local / staff123');
}

// Run the seeding
seedDatabase()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
