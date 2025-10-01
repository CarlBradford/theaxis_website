const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMockArticles() {
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

  console.log('📁 Creating categories...');
  const categories = await Promise.all(
    allowedCategories.map(categoryName =>
      prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { 
          name: categoryName, 
          slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
          description: `${categoryName} content`
        }
      })
    )
  );

  // Get users
  const users = await prisma.user.findMany();
  const staffUser = users.find(u => u.email === 'staff@theaxis.local');
  const sectionHeadUser = users.find(u => u.email === 'section@theaxis.local');
  const eicUser = users.find(u => u.email === 'eic@theaxis.local');

  if (!staffUser) {
    console.log('❌ Staff user not found, skipping mock articles');
    return;
  }

  // Mock articles data
  const mockArticles = [
    {
      title: "The Future of Artificial Intelligence in Healthcare",
      slug: "future-ai-healthcare",
      content: "<p>Artificial Intelligence is revolutionizing healthcare with applications in diagnosis, treatment planning, and drug discovery. This comprehensive analysis explores the current state and future potential of AI in medical practice.</p><p>From machine learning algorithms that can detect cancer in medical images to AI-powered drug discovery platforms, the healthcare industry is experiencing unprecedented transformation.</p>",
      excerpt: "AI is revolutionizing healthcare with applications in diagnosis, treatment planning, and drug discovery...",
      status: "DRAFT",
      authorId: staffUser.id,
      reviewerId: null,
      viewCount: 0,
      tags: ["AI", "Healthcare", "Innovation"]
    },
    {
      title: "Sustainable Energy Solutions for Modern Cities",
      slug: "sustainable-energy-cities",
      content: "<p>As urban populations continue to grow, cities must adopt sustainable energy solutions to meet increasing demand while reducing environmental impact. This article examines renewable energy technologies and their implementation in urban environments.</p><p>Solar panels, wind turbines, and smart grid systems are becoming essential components of modern city infrastructure.</p>",
      excerpt: "Cities must adopt sustainable energy solutions to meet increasing demand while reducing environmental impact...",
      status: "DRAFT",
      authorId: staffUser.id,
      reviewerId: null,
      viewCount: 0,
      tags: ["Sustainability", "Energy", "Cities"]
    },
    {
      title: "Digital Marketing Trends for 2024",
      slug: "digital-marketing-trends-2024",
      content: "<p>The digital marketing landscape continues to evolve rapidly, with new technologies and strategies emerging each year. This comprehensive guide covers the most important trends shaping digital marketing in 2024.</p><p>From AI-powered personalization to voice search optimization, marketers must adapt to stay competitive.</p>",
      excerpt: "The digital marketing landscape continues to evolve rapidly with new technologies and strategies...",
      status: "DRAFT",
      authorId: staffUser.id,
      reviewerId: null,
      viewCount: 0,
      tags: ["Digital Marketing", "Trends", "2024"]
    },
    {
      title: "The Psychology of Social Media Engagement",
      slug: "psychology-social-media-engagement",
      content: "<p>Understanding the psychological factors that drive social media engagement is crucial for content creators and marketers. This research-based article explores the cognitive and emotional triggers that influence user behavior on social platforms.</p><p>From dopamine responses to social validation, multiple psychological mechanisms contribute to platform addiction and engagement patterns.</p>",
      excerpt: "Understanding psychological factors that drive social media engagement is crucial for content creators...",
      status: "IN_REVIEW",
      authorId: staffUser.id,
      reviewerId: sectionHeadUser?.id,
      viewCount: 15,
      tags: ["Psychology", "Social Media", "Engagement"]
    },
    {
      title: "Climate Change Impact on Global Agriculture",
      slug: "climate-change-agriculture",
      content: "<p>Climate change poses significant challenges to global food security and agricultural practices. This detailed analysis examines how rising temperatures, changing precipitation patterns, and extreme weather events affect crop yields and farming methods worldwide.</p><p>Adaptation strategies and sustainable farming practices are becoming increasingly important for food security.</p>",
      excerpt: "Climate change poses significant challenges to global food security and agricultural practices...",
      status: "IN_REVIEW",
      authorId: staffUser.id,
      reviewerId: sectionHeadUser?.id,
      viewCount: 23,
      tags: ["Climate Change", "Agriculture", "Food Security"]
    },
    {
      title: "Cybersecurity Best Practices for Small Businesses",
      slug: "cybersecurity-small-businesses",
      content: "<p>Small businesses are increasingly targeted by cybercriminals due to their often limited security resources. This practical guide outlines essential cybersecurity measures that small business owners can implement to protect their digital assets.</p><p>From employee training to network security, multiple layers of protection are necessary to prevent data breaches.</p>",
      excerpt: "Small businesses are increasingly targeted by cybercriminals due to limited security resources...",
      status: "IN_REVIEW",
      authorId: staffUser.id,
      reviewerId: sectionHeadUser?.id,
      viewCount: 8,
      tags: ["Cybersecurity", "Small Business", "Security"]
    },
    {
      title: "The Evolution of Remote Work Culture",
      slug: "evolution-remote-work-culture",
      content: "<p>Remote work has transformed from a temporary necessity to a permanent fixture in modern business culture. This article explores the evolution of remote work practices and their impact on employee productivity and satisfaction.</p><p>Companies are reimagining office spaces and developing new management strategies to support distributed teams.</p>",
      excerpt: "Remote work has transformed from a temporary necessity to a permanent fixture in modern business culture...",
      status: "NEEDS_REVISION",
      authorId: staffUser.id,
      reviewerId: sectionHeadUser?.id,
      viewCount: 12,
      tags: ["Remote Work", "Culture", "Productivity"]
    },
    {
      title: "Mental Health Awareness in the Digital Age",
      slug: "mental-health-digital-age",
      content: "<p>The digital age has brought both opportunities and challenges for mental health. This comprehensive article examines the impact of technology on mental well-being and explores strategies for maintaining healthy digital habits.</p><p>From social media comparison to information overload, digital technologies can both help and harm mental health.</p>",
      excerpt: "The digital age has brought both opportunities and challenges for mental health...",
      status: "NEEDS_REVISION",
      authorId: staffUser.id,
      reviewerId: sectionHeadUser?.id,
      viewCount: 19,
      tags: ["Mental Health", "Digital Age", "Wellness"]
    },
    {
      title: "The Future of Electric Vehicles",
      slug: "future-electric-vehicles",
      content: "<p>Electric vehicles are rapidly becoming the future of transportation, with major automakers investing billions in EV technology. This in-depth analysis covers battery innovations, charging infrastructure, and market trends shaping the EV revolution.</p><p>From Tesla's dominance to traditional automakers' EV strategies, the automotive industry is undergoing a fundamental transformation.</p>",
      excerpt: "Electric vehicles are rapidly becoming the future of transportation with major automakers investing billions...",
      status: "APPROVED",
      authorId: staffUser.id,
      reviewerId: sectionHeadUser?.id,
      viewCount: 45,
      tags: ["Electric Vehicles", "Transportation", "Innovation"]
    },
    {
      title: "Sustainable Fashion: A Growing Movement",
      slug: "sustainable-fashion-movement",
      content: "<p>The fashion industry is embracing sustainability as consumers demand more ethical and environmentally conscious clothing options. This article explores sustainable fashion practices, from eco-friendly materials to circular fashion models.</p><p>Brands are innovating with recycled materials, reducing water usage, and implementing fair labor practices throughout their supply chains.</p>",
      excerpt: "The fashion industry is embracing sustainability as consumers demand more ethical clothing options...",
      status: "APPROVED",
      authorId: staffUser.id,
      reviewerId: sectionHeadUser?.id,
      viewCount: 32,
      tags: ["Sustainable Fashion", "Environment", "Ethics"]
    },
    {
      title: "The Rise of Plant-Based Diets",
      slug: "rise-plant-based-diets",
      content: "<p>Plant-based diets are gaining popularity worldwide as people become more health-conscious and environmentally aware. This comprehensive guide examines the benefits, challenges, and practical aspects of adopting a plant-based lifestyle.</p><p>From nutritional considerations to environmental impact, plant-based diets offer numerous advantages for individuals and the planet.</p>",
      excerpt: "Plant-based diets are gaining popularity worldwide as people become more health-conscious...",
      status: "APPROVED",
      authorId: staffUser.id,
      reviewerId: sectionHeadUser?.id,
      viewCount: 28,
      tags: ["Plant-Based", "Nutrition", "Health"]
    },
    {
      title: "Space Exploration: The Next Frontier",
      slug: "space-exploration-next-frontier",
      content: "<p>Humanity's quest to explore space continues with ambitious missions to Mars, the Moon, and beyond. This article covers recent developments in space exploration, including private space companies and international collaborations.</p><p>From SpaceX's Mars missions to NASA's Artemis program, the next decade promises exciting advances in space exploration.</p>",
      excerpt: "Humanity's quest to explore space continues with ambitious missions to Mars, the Moon, and beyond...",
      status: "SCHEDULED",
      authorId: staffUser.id,
      reviewerId: eicUser?.id,
      publicationDate: new Date('2024-02-15T10:00:00Z'),
      scheduledAt: new Date('2024-02-15T10:00:00Z'),
      viewCount: 0,
      tags: ["Space Exploration", "Mars", "NASA"]
    },
    {
      title: "The Art of Storytelling in Business",
      slug: "storytelling-business",
      content: "<p>Effective storytelling is a powerful tool for businesses to connect with customers and build brand loyalty. This article explores how companies can use narrative techniques to enhance their marketing and communication strategies.</p><p>From brand origin stories to customer testimonials, storytelling helps businesses create emotional connections with their audience.</p>",
      excerpt: "Effective storytelling is a powerful tool for businesses to connect with customers and build brand loyalty...",
      status: "SCHEDULED",
      authorId: staffUser.id,
      reviewerId: eicUser?.id,
      publicationDate: new Date('2024-02-20T14:00:00Z'),
      scheduledAt: new Date('2024-02-20T14:00:00Z'),
      viewCount: 0,
      tags: ["Storytelling", "Marketing", "Brand"]
    },
    {
      title: "The Benefits of Regular Exercise",
      slug: "benefits-regular-exercise",
      content: "<p>Regular exercise is one of the most important factors for maintaining good health and well-being. This comprehensive guide covers the physical, mental, and emotional benefits of consistent physical activity.</p><p>From cardiovascular health to stress reduction, exercise provides numerous advantages that extend far beyond physical fitness.</p>",
      excerpt: "Regular exercise is one of the most important factors for maintaining good health and well-being...",
      status: "PUBLISHED",
      authorId: staffUser.id,
      reviewerId: eicUser?.id,
      publishedAt: new Date('2024-01-15T09:00:00Z'),
      publicationDate: new Date('2024-01-15T09:00:00Z'),
      viewCount: 156,
      tags: ["Exercise", "Health", "Fitness"]
    },
    {
      title: "Understanding Cryptocurrency and Blockchain",
      slug: "understanding-cryptocurrency-blockchain",
      content: "<p>Cryptocurrency and blockchain technology have revolutionized the financial industry and beyond. This beginner-friendly guide explains the fundamentals of digital currencies and distributed ledger technology.</p><p>From Bitcoin to smart contracts, blockchain technology offers innovative solutions for various industries beyond finance.</p>",
      excerpt: "Cryptocurrency and blockchain technology have revolutionized the financial industry and beyond...",
      status: "PUBLISHED",
      authorId: staffUser.id,
      reviewerId: eicUser?.id,
      publishedAt: new Date('2024-01-20T11:00:00Z'),
      publicationDate: new Date('2024-01-20T11:00:00Z'),
      viewCount: 203,
      tags: ["Cryptocurrency", "Blockchain", "Finance"]
    },
    {
      title: "The Importance of Mental Health Awareness",
      slug: "importance-mental-health-awareness",
      content: "<p>Mental health awareness is crucial for creating supportive communities and reducing stigma around mental health issues. This article discusses the importance of open conversations about mental health and available resources.</p><p>From workplace mental health programs to community support groups, awareness initiatives help individuals access the help they need.</p>",
      excerpt: "Mental health awareness is crucial for creating supportive communities and reducing stigma...",
      status: "PUBLISHED",
      authorId: staffUser.id,
      reviewerId: eicUser?.id,
      publishedAt: new Date('2024-01-25T08:00:00Z'),
      publicationDate: new Date('2024-01-25T08:00:00Z'),
      viewCount: 89,
      tags: ["Mental Health", "Awareness", "Support"]
    },
    {
      title: "The Future of Renewable Energy",
      slug: "future-renewable-energy",
      content: "<p>Renewable energy sources are becoming increasingly cost-effective and efficient, driving the global transition away from fossil fuels. This article examines the latest developments in solar, wind, and other renewable technologies.</p><p>From offshore wind farms to advanced solar panels, renewable energy innovations are accelerating the clean energy transition.</p>",
      excerpt: "Renewable energy sources are becoming increasingly cost-effective and efficient...",
      status: "PUBLISHED",
      authorId: staffUser.id,
      reviewerId: eicUser?.id,
      publishedAt: new Date('2024-01-30T13:00:00Z'),
      publicationDate: new Date('2024-01-30T13:00:00Z'),
      viewCount: 127,
      tags: ["Renewable Energy", "Solar", "Wind"]
    },
    {
      title: "Old Technology Trends That Shaped Computing",
      slug: "old-technology-trends-computing",
      content: "<p>This archived article looks back at the technology trends that shaped the early days of personal computing. While some technologies have become obsolete, they laid the foundation for modern innovations.</p><p>From floppy disks to dial-up internet, these technologies represent important milestones in computing history.</p>",
      excerpt: "This archived article looks back at technology trends that shaped early personal computing...",
      status: "ARCHIVED",
      authorId: staffUser.id,
      reviewerId: eicUser?.id,
      archivedAt: new Date('2023-12-15T16:00:00Z'),
      viewCount: 45,
      tags: ["Technology History", "Computing", "Archive"]
    },
    {
      title: "Traditional Marketing Strategies in the Digital Era",
      slug: "traditional-marketing-digital-era",
      content: "<p>This archived article examines how traditional marketing strategies have adapted to the digital era. While some methods remain relevant, others have been replaced by digital alternatives.</p><p>From print advertising to direct mail campaigns, traditional marketing methods continue to evolve alongside digital innovations.</p>",
      excerpt: "This archived article examines how traditional marketing strategies have adapted to the digital era...",
      status: "ARCHIVED",
      authorId: staffUser.id,
      reviewerId: eicUser?.id,
      archivedAt: new Date('2023-11-20T12:00:00Z'),
      viewCount: 23,
      tags: ["Traditional Marketing", "Digital Era", "Archive"]
    }
  ];

  console.log('📰 Creating articles...');
  for (const articleData of mockArticles) {
    // Create or get tags
    const articleTags = await Promise.all(
      articleData.tags.map(tagName =>
        prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName, slug: tagName.toLowerCase().replace(/\s+/g, '-') }
        })
      )
    );

    // Create article
    const article = await prisma.article.create({
      data: {
        title: articleData.title,
        slug: articleData.slug,
        content: articleData.content,
        excerpt: articleData.excerpt,
        status: articleData.status,
        authorId: articleData.authorId,
        reviewerId: articleData.reviewerId,
        publicationDate: articleData.publicationDate,
        publishedAt: articleData.publishedAt,
        scheduledAt: articleData.scheduledAt,
        archivedAt: articleData.archivedAt,
        viewCount: articleData.viewCount,
        categories: {
          connect: [{ name: 'Feature' }] // All articles use Feature category
        },
        tags: {
          connect: articleTags.map(tag => ({ id: tag.id }))
        }
      }
    });

    console.log(`✅ Created: ${article.title} (${article.status})`);
  }

  console.log('🎉 Mock articles created successfully!');
}

async function main() {
  console.log('🌱 Starting database seeding...');
  console.log('ℹ️  Note: Default categories, tags, users, and sample content are now handled by database migrations.');
  console.log('ℹ️  This seed file is kept for any additional development data you might want to add.');

  try {
    // Add mock articles if they don't exist
    const existingArticles = await prisma.article.findMany();
    if (existingArticles.length === 0) {
      console.log('📰 Adding mock articles...');
      await addMockArticles();
    } else {
      console.log(`📰 Found ${existingArticles.length} existing articles, skipping mock article creation.`);
    }
    
    // Add sample data for Content Management Phase models
    
    // Get existing users and articles for sample data
    const users = await prisma.user.findMany();
    const articles = await prisma.article.findMany();
    
    if (users.length > 0 && articles.length > 0) {
      console.log('📝 Adding sample Content Management Phase data...');
      
      // Add sample article authors (multiple authors per article)
      for (let i = 0; i < Math.min(3, articles.length); i++) {
        const article = articles[i];
        const availableUsers = users.filter(u => u.id !== article.authorId);
        
        if (availableUsers.length > 0) {
          // Add a co-author
          await prisma.articleAuthor.create({
            data: {
              articleId: article.id,
              userId: availableUsers[0].id,
              role: 'Co-Author',
              order: 1
            }
          });
        }
      }
      
      // Add sample view history
      for (let i = 0; i < Math.min(5, articles.length); i++) {
        const article = articles[i];
        const randomUsers = users.slice(0, Math.floor(Math.random() * 3) + 1);
        
        for (const user of randomUsers) {
          await prisma.articleViewHistory.create({
            data: {
              articleId: article.id,
              userId: user.id,
              viewedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
              ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
        }
      }
      
      // Add sample like/dislike history
      for (let i = 0; i < Math.min(3, articles.length); i++) {
        const article = articles[i];
        const randomUsers = users.slice(0, Math.floor(Math.random() * 2) + 1);
        
        for (const user of randomUsers) {
          await prisma.articleLikeHistory.create({
            data: {
              articleId: article.id,
              userId: user.id,
              isLike: Math.random() > 0.3, // 70% chance of like
              likedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000), // Random time in last 3 days
              ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
        }
      }
      
      // Add sample review feedback
      const editors = users.filter(u => u.role === 'ADMIN_ASSISTANT' || u.role === 'SECTION_HEAD');
      if (editors.length > 0) {
        for (let i = 0; i < Math.min(2, articles.length); i++) {
          const article = articles[i];
          const editor = editors[Math.floor(Math.random() * editors.length)];
          
          await prisma.reviewFeedback.create({
            data: {
              articleId: article.id,
              reviewerId: editor.id,
              feedback: 'Great article! Minor grammar fixes needed.',
              feedbackType: 'COMMENT',
              isApproved: null
            }
          });
        }
      }
      
      // Add sample analytics data
      for (let i = 0; i < Math.min(3, articles.length); i++) {
        const article = articles[i];
        
        // Add analytics for the last 7 days
        for (let day = 0; day < 7; day++) {
          const date = new Date();
          date.setDate(date.getDate() - day);
          date.setHours(0, 0, 0, 0);
          
          await prisma.articleAnalytics.create({
            data: {
              articleId: article.id,
              date: date,
              views: Math.floor(Math.random() * 100) + 10,
              likes: Math.floor(Math.random() * 20) + 1,
              dislikes: Math.floor(Math.random() * 5),
              comments: Math.floor(Math.random() * 10),
              socialShares: Math.floor(Math.random() * 15),
              uniqueVisitors: Math.floor(Math.random() * 50) + 5,
              avgTimeOnPage: Math.random() * 300 + 30, // 30-330 seconds
              bounceRate: Math.random() * 0.4 + 0.1 // 10-50%
            }
          });
        }
      }
      
      console.log('✅ Sample Content Management Phase data added successfully!');
    }
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Default Login Credentials (now permanent via migrations):');
    console.log('👤 Admin: admin@theaxis.local / admin123');
    console.log('👑 Admin Assistant: eic@theaxis.local / eic123');
    console.log('📰 Section Head: section@theaxis.local / section123');
    console.log('✍️ Publication Staff: staff@theaxis.local / staff123');
    console.log('\n⚠️  IMPORTANT: Change these passwords in production!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });