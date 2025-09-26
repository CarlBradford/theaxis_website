const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Sample articles data for each category
const articlesData = [
  // Technology
  {
    title: "The Future of Artificial Intelligence in Healthcare",
    slug: "future-ai-healthcare-2024",
    content: "Artificial Intelligence is revolutionizing healthcare with applications in diagnosis, treatment planning, and patient care. This comprehensive analysis explores the latest developments and future prospects of AI in medical technology.",
    featuredImage: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-15"),
    viewCount: 1250,
    categoryName: "Technology"
  },
  {
    title: "Cybersecurity Trends for 2024: Protecting Digital Assets",
    slug: "cybersecurity-trends-2024",
    content: "As digital threats evolve, cybersecurity strategies must adapt. This article examines the latest trends in cybersecurity, including AI-powered defense systems and zero-trust architecture implementations.",
    featuredImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-10"),
    viewCount: 980,
    categoryName: "Technology"
  },
  {
    title: "Quantum Computing Breakthrough: What It Means for the Industry",
    slug: "quantum-computing-breakthrough-2024",
    content: "Recent advances in quantum computing are bringing us closer to practical applications. This analysis covers the latest breakthroughs and their potential impact on various industries.",
    featuredImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-05"),
    viewCount: 2100,
    categoryName: "Technology"
  },

  // Business
  {
    title: "Sustainable Business Practices: A Competitive Advantage",
    slug: "sustainable-business-practices-2024",
    content: "Sustainability is no longer just a buzzword but a critical business strategy. This article explores how companies can integrate sustainable practices to gain competitive advantages.",
    featuredImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-12"),
    viewCount: 1450,
    categoryName: "Business"
  },
  {
    title: "Remote Work Revolution: Managing Distributed Teams",
    slug: "remote-work-distributed-teams-2024",
    content: "The shift to remote work has transformed how businesses operate. This comprehensive guide covers best practices for managing distributed teams and maintaining productivity.",
    featuredImage: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-08"),
    viewCount: 1890,
    categoryName: "Business"
  },
  {
    title: "Digital Transformation Strategies for Small Businesses",
    slug: "digital-transformation-small-business-2024",
    content: "Small businesses must adapt to digital transformation to remain competitive. This article provides practical strategies and tools for successful digital adoption.",
    featuredImage: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-03"),
    viewCount: 1120,
    categoryName: "Business"
  },

  // Health
  {
    title: "Mental Health in the Digital Age: Finding Balance",
    slug: "mental-health-digital-age-2024",
    content: "Technology's impact on mental health is profound. This article examines the challenges and opportunities of maintaining mental wellness in our connected world.",
    featuredImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-14"),
    viewCount: 1680,
    categoryName: "Health"
  },
  {
    title: "Nutrition Science: Debunking Common Myths",
    slug: "nutrition-science-myths-2024",
    content: "Nutrition science continues to evolve, often contradicting popular beliefs. This evidence-based article separates fact from fiction in modern nutrition.",
    featuredImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-09"),
    viewCount: 1340,
    categoryName: "Health"
  },
  {
    title: "Exercise Physiology: Optimizing Your Workout Routine",
    slug: "exercise-physiology-workout-optimization-2024",
    content: "Understanding exercise physiology can help maximize workout effectiveness. This article covers the science behind optimal training strategies and recovery.",
    featuredImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-06"),
    viewCount: 1560,
    categoryName: "Health"
  },

  // Science
  {
    title: "Climate Change Research: Latest Findings and Implications",
    slug: "climate-change-research-2024",
    content: "Recent climate research provides new insights into global warming patterns and mitigation strategies. This article summarizes the latest scientific findings.",
    featuredImage: "https://images.unsplash.com/photo-1569163139394-de446cf4b4e6?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-13"),
    viewCount: 2200,
    categoryName: "Science"
  },
  {
    title: "Space Exploration: Mars Mission Updates and Future Plans",
    slug: "space-exploration-mars-mission-2024",
    content: "Mars exploration continues to advance with new missions and discoveries. This article covers the latest updates from ongoing Mars missions and future exploration plans.",
    featuredImage: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-07"),
    viewCount: 1980,
    categoryName: "Science"
  },
  {
    title: "Renewable Energy Breakthroughs: Solar and Wind Innovations",
    slug: "renewable-energy-breakthroughs-2024",
    content: "Renewable energy technology continues to advance rapidly. This article highlights recent breakthroughs in solar and wind energy technologies.",
    featuredImage: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-04"),
    viewCount: 1750,
    categoryName: "Science"
  },

  // Lifestyle
  {
    title: "Minimalist Living: Simplifying Your Space and Mind",
    slug: "minimalist-living-simplify-2024",
    content: "Minimalism offers a path to greater clarity and purpose. This article explores practical strategies for adopting minimalist principles in daily life.",
    featuredImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-11"),
    viewCount: 1420,
    categoryName: "Lifestyle"
  },
  {
    title: "Digital Detox: Reconnecting with the Real World",
    slug: "digital-detox-reconnect-2024",
    content: "Constant digital connectivity can overwhelm our mental health. This guide provides strategies for effective digital detox and mindful technology use.",
    featuredImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-02"),
    viewCount: 1280,
    categoryName: "Lifestyle"
  },
  {
    title: "Sustainable Fashion: Making Ethical Clothing Choices",
    slug: "sustainable-fashion-ethical-choices-2024",
    content: "The fashion industry's environmental impact is significant. This article explores sustainable fashion practices and how to make ethical clothing choices.",
    featuredImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-01"),
    viewCount: 1650,
    categoryName: "Lifestyle"
  },

  // Education
  {
    title: "Online Learning Revolution: Adapting to Digital Education",
    slug: "online-learning-revolution-2024",
    content: "Online education has transformed how we learn and teach. This article examines the evolution of digital learning platforms and their impact on education.",
    featuredImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-16"),
    viewCount: 1920,
    categoryName: "Education"
  },
  {
    title: "Critical Thinking Skills: Essential for Modern Learners",
    slug: "critical-thinking-skills-modern-learners-2024",
    content: "Critical thinking is more important than ever in our information-rich world. This article provides strategies for developing and teaching critical thinking skills.",
    featuredImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-17"),
    viewCount: 1380,
    categoryName: "Education"
  },
  {
    title: "STEM Education: Preparing Students for Future Careers",
    slug: "stem-education-future-careers-2024",
    content: "STEM education prepares students for careers in science, technology, engineering, and mathematics. This article explores effective STEM teaching methods and career pathways.",
    featuredImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop&quality=90",
    status: "published",
    publicationDate: new Date("2024-01-18"),
    viewCount: 2100,
    categoryName: "Education"
  }
];

async function addArticles() {
  try {
    console.log('Starting to add articles...');
    
    // Get all categories
    const categories = await prisma.category.findMany();
    console.log('Found categories:', categories.length);
    
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    
    console.log('Category mapping:', categoryMap);
    
    let addedCount = 0;
    
    for (const articleData of articlesData) {
      try {
        // Check if article already exists
        const existingArticle = await prisma.article.findFirst({
          where: { slug: articleData.slug }
        });
        
        if (existingArticle) {
          console.log(`Article "${articleData.title}" already exists, skipping...`);
          continue;
        }
        
        // Create the article
        const article = await prisma.article.create({
          data: {
            title: articleData.title,
            slug: articleData.slug,
            content: articleData.content,
            featuredImage: articleData.featuredImage,
            status: articleData.status,
            publicationDate: articleData.publicationDate,
            viewCount: articleData.viewCount
          }
        });
        
        console.log(`Created article: ${article.title}`);
        
        // Connect to category
        const categoryId = categoryMap[articleData.categoryName];
        if (categoryId) {
          await prisma.article.update({
            where: { id: article.id },
            data: {
              categories: {
                connect: { id: categoryId }
              }
            }
          });
          console.log(`Connected article to category: ${articleData.categoryName}`);
        } else {
          console.log(`Category not found: ${articleData.categoryName}`);
        }
        
        addedCount++;
        
      } catch (error) {
        console.error(`Error creating article "${articleData.title}":`, error.message);
      }
    }
    
    console.log(`\nSuccessfully added ${addedCount} articles!`);
    
    // Final count by category
    const finalArticles = await prisma.article.findMany({
      where: { status: 'published' },
      include: { categories: true }
    });
    
    const finalCategoryCounts = {};
    finalArticles.forEach(article => {
      article.categories.forEach(cat => {
        finalCategoryCounts[cat.name] = (finalCategoryCounts[cat.name] || 0) + 1;
      });
    });
    
    console.log('\nFinal articles per category:');
    Object.entries(finalCategoryCounts).forEach(([cat, count]) => {
      console.log('-', cat + ':', count);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addArticles();
