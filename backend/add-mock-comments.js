const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mock comment data with diverse content for actual articles
const mockComments = [
  // Comments for Technology: AI in Education articles
  {
    content: "AI in education is fascinating! It can personalize learning for each student. This is the future of education.",
    isApproved: true,
    isPublic: true,
    articleSlug: "technology-ai-in-education-part-14-1"
  },
  {
    content: "I'm concerned about AI replacing teachers. Human interaction is crucial for learning and development.",
    isApproved: true,
    isPublic: true,
    articleSlug: "technology-ai-in-education-part-14-1"
  },
  {
    content: "AI can help identify students who are struggling early. Early intervention is key to academic success.",
    isApproved: true,
    isPublic: true,
    articleSlug: "technology-ai-in-education-part-14-1"
  },
  {
    content: "This seems too optimistic. What about students who don't have access to technology?",
    isApproved: false,
    isPublic: true,
    articleSlug: "technology-ai-in-education-part-14-1"
  },

  // Comments for Sports: Championship Victory Analysis
  {
    content: "What an incredible victory! The team showed amazing determination and skill throughout the season.",
    isApproved: true,
    isPublic: true,
    articleSlug: "sports-championship-victory-analysis"
  },
  {
    content: "The coach's strategy was brilliant. They really outsmarted the opposing team in the final game.",
    isApproved: true,
    isPublic: true,
    articleSlug: "sports-championship-victory-analysis"
  },
  {
    content: "I was there at the game! The atmosphere was electric. Best sporting event I've ever attended.",
    isApproved: true,
    isPublic: true,
    articleSlug: "sports-championship-victory-analysis"
  },

  // Comments for Opinion: The Future of Digital Learning
  {
    content: "Digital learning has its benefits, but nothing beats face-to-face interaction with teachers and classmates.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-34-1758510982447"
  },
  {
    content: "Online learning made education accessible to so many people who couldn't attend traditional schools.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-34-1758510982447"
  },
  {
    content: "The hybrid model is perfect. Some subjects work better online, others need in-person instruction.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-34-1758510982447"
  },

  // Comments for Platform Updates: New Features Released
  {
    content: "These new features are game-changers! The user interface is so much more intuitive now.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-24-1758510982447"
  },
  {
    content: "Finally! The feature I've been requesting for months. Great job by the development team.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-24-1758510982447"
  },
  {
    content: "The mobile app improvements are fantastic. Much easier to use on my phone now.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-24-1758510982447"
  },

  // Comments for Journalism: Ethics in Modern Reporting
  {
    content: "Ethics in journalism is more important than ever. We need trustworthy news sources in this digital age.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-39-1758510982447"
  },
  {
    content: "Fact-checking should be mandatory for all news outlets. Misinformation spreads too quickly online.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-39-1758510982447"
  },
  {
    content: "Journalists have a responsibility to present balanced views, not just sensational headlines.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-39-1758510982447"
  },

  // Comments for Arts & Culture: Local Gallery Exhibition
  {
    content: "The local art scene is thriving! This exhibition showcases incredible talent from our community.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-45-1758510982447"
  },
  {
    content: "I visited the gallery last weekend. The contemporary pieces were particularly striking.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-45-1758510982447"
  },
  {
    content: "Supporting local artists is so important. They bring culture and creativity to our city.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-45-1758510982447"
  },

  // Comments for Breaking: New Campus Policy Changes
  {
    content: "These policy changes are long overdue. The campus will be much safer and more inclusive now.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-1-1758510982446"
  },
  {
    content: "I'm not sure about some of these changes. They might be too restrictive for students.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-1-1758510982446"
  },
  {
    content: "The administration should have consulted students more before implementing these policies.",
    isApproved: false,
    isPublic: true,
    articleSlug: "article-1-1758510982446"
  },

  // Comments for Feature: Student Entrepreneurs Making Waves
  {
    content: "These student entrepreneurs are inspiring! Starting a business while studying takes incredible dedication.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-19-1758510982447"
  },
  {
    content: "The university's entrepreneurship program must be excellent to produce such successful graduates.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-19-1758510982447"
  },
  {
    content: "I hope to start my own business someday. These stories give me hope and motivation.",
    isApproved: true,
    isPublic: true,
    articleSlug: "article-19-1758510982447"
  },

  // Comments for Test Published Article
  {
    content: "This is a great test article! The content is engaging and well-written.",
    isApproved: true,
    isPublic: true,
    articleSlug: "test-published-1758511134568"
  },
  {
    content: "I learned something new from this article. Thanks for sharing this information.",
    isApproved: true,
    isPublic: true,
    articleSlug: "test-published-1758511134568"
  },
  {
    content: "More articles like this please! The quality of content on this platform is excellent.",
    isApproved: true,
    isPublic: true,
    articleSlug: "test-published-1758511134568"
  }
];

// Reply comments (nested comments)
const replyComments = [
  {
    content: "I agree! Early detection could save so many lives. AI can analyze patterns humans might miss.",
    parentContent: "AI in education is fascinating! It can personalize learning for each student. This is the future of education.",
    isApproved: true,
    isPublic: true
  },
  {
    content: "You're absolutely right about privacy concerns. We need strict guidelines for student data protection.",
    parentContent: "I'm concerned about AI replacing teachers. Human interaction is crucial for learning and development.",
    isApproved: true,
    isPublic: true
  },
  {
    content: "Cost is definitely a barrier, but prices are coming down as technology matures. Some schools are seeing ROI within 2-3 years.",
    parentContent: "This seems too optimistic. What about students who don't have access to technology?",
    isApproved: true,
    isPublic: true
  },
  {
    content: "You're right about wind turbines, but newer designs are much quieter and have better bird protection measures.",
    parentContent: "What an incredible victory! The team showed amazing determination and skill throughout the season.",
    isApproved: true,
    isPublic: true
  },
  {
    content: "Privacy is a valid concern, but personalization can be done without compromising individual privacy through aggregated data.",
    parentContent: "Digital learning has its benefits, but nothing beats face-to-face interaction with teachers and classmates.",
    isApproved: true,
    isPublic: true
  },
  {
    content: "The dopamine hit is real! I've started using app timers to limit my social media usage.",
    parentContent: "These new features are game-changers! The user interface is so much more intuitive now.",
    isApproved: true,
    isPublic: true
  },
  {
    content: "Climate has changed before, but never this rapidly. The rate of change is unprecedented in human history.",
    parentContent: "Ethics in journalism is more important than ever. We need trustworthy news sources in this digital age.",
    isApproved: true,
    isPublic: true
  },
  {
    content: "Sorry to hear about the hack. It's devastating for small businesses. Hope you've recovered well.",
    parentContent: "The local art scene is thriving! This exhibition showcases incredible talent from our community.",
    isApproved: true,
    isPublic: true
  },
  {
    content: "I agree! The social aspect of work is important. Maybe hybrid models are the answer.",
    parentContent: "These policy changes are long overdue. The campus will be much safer and more inclusive now.",
    isApproved: true,
    isPublic: true
  },
  {
    content: "You're right! Technology can be a tool for good mental health too. It's all about how we use it.",
    parentContent: "These student entrepreneurs are inspiring! Starting a business while studying takes incredible dedication.",
    isApproved: true,
    isPublic: true
  }
];

async function addMockComments() {
  console.log('💬 Adding mock comments to database...');

  try {
    // Get all users and articles
    const users = await prisma.user.findMany();
    const articles = await prisma.article.findMany();

    if (users.length === 0) {
      console.log('❌ No users found. Please run the seed script first to create users.');
      return;
    }

    if (articles.length === 0) {
      console.log('❌ No articles found. Please run the seed script first to create articles.');
      return;
    }

    console.log(`📊 Found ${users.length} users and ${articles.length} articles`);

    // Create a map of article slugs to article IDs
    const articleMap = new Map();
    articles.forEach(article => {
      articleMap.set(article.slug, article);
    });

    // Create comments
    const createdComments = [];
    
    for (const commentData of mockComments) {
      const article = articleMap.get(commentData.articleSlug);
      if (!article) {
        console.log(`⚠️  Article with slug "${commentData.articleSlug}" not found, skipping comment`);
        continue;
      }

      // Randomly select a user for the comment
      const randomUser = users[Math.floor(Math.random() * users.length)];

      const comment = await prisma.comment.create({
        data: {
          content: commentData.content,
          isApproved: commentData.isApproved,
          isPublic: commentData.isPublic,
          isModerated: !commentData.isApproved,
          moderationReason: !commentData.isApproved ? 'Pending review' : null,
          authorId: randomUser.id,
          articleId: article.id,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random time in last 30 days
        }
      });

      createdComments.push(comment);
      console.log(`✅ Created comment: "${commentData.content.substring(0, 50)}..." (${commentData.isApproved ? 'Approved' : 'Pending'})`);
    }

    // Create reply comments
    console.log('💬 Adding reply comments...');
    
    for (const replyData of replyComments) {
      // Find the parent comment
      const parentComment = createdComments.find(comment => 
        comment.content.includes(replyData.parentContent.substring(0, 30))
      );

      if (!parentComment) {
        console.log(`⚠️  Parent comment not found for reply, skipping`);
        continue;
      }

      // Randomly select a user for the reply
      const randomUser = users[Math.floor(Math.random() * users.length)];

      const reply = await prisma.comment.create({
        data: {
          content: replyData.content,
          isApproved: replyData.isApproved,
          isPublic: replyData.isPublic,
          isModerated: !replyData.isApproved,
          moderationReason: !replyData.isApproved ? 'Pending review' : null,
          authorId: randomUser.id,
          articleId: parentComment.articleId,
          parentCommentId: parentComment.id,
          createdAt: new Date(parentComment.createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // Within a week of parent
        }
      });

      console.log(`✅ Created reply: "${replyData.content.substring(0, 50)}..."`);
    }

    // Update article comment counts
    console.log('📊 Updating article comment counts...');
    
    for (const article of articles) {
      const commentCount = await prisma.comment.count({
        where: { 
          articleId: article.id,
          isApproved: true 
        }
      });

      await prisma.article.update({
        where: { id: article.id },
        data: { commentCount }
      });
    }

    console.log('🎉 Mock comments added successfully!');
    console.log(`📈 Created ${createdComments.length} main comments and ${replyComments.length} replies`);
    console.log('💡 Comments include both approved and pending moderation states');
    console.log('🔗 Reply comments create realistic comment threads');

  } catch (error) {
    console.error('❌ Error adding mock comments:', error);
    throw error;
  }
}

async function main() {
  try {
    await addMockComments();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
