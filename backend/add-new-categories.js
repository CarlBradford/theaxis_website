const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Function to create slug from name
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

async function addNewCategories() {
  console.log('🌱 Adding new categories to the database...');
  
  const newCategories = [
    {
      name: 'News',
      description: 'Latest news and current events coverage'
    },
    {
      name: 'Opinion',
      description: 'Editorials and opinion pieces from writers'
    },
    {
      name: 'Editorial',
      description: 'Editorial content and institutional perspectives'
    },
    {
      name: 'Feature',
      description: 'In-depth feature articles and long-form content'
    },
    {
      name: 'Literary',
      description: 'Literary works, creative writing, and artistic content'
    },
    {
      name: 'Development Communication',
      description: 'Content focused on development communication and social impact'
    },
    {
      name: 'Sports',
      description: 'Sports coverage, analysis, and athletic content'
    },
    {
      name: 'The AXIS Online',
      description: 'Digital content and online platform updates'
    }
  ];

  try {
    for (const category of newCategories) {
      const slug = createSlug(category.name);
      
      // Check if category already exists
      const existingCategory = await prisma.category.findFirst({
        where: {
          OR: [
            { name: category.name },
            { slug: slug }
          ]
        }
      });

      if (existingCategory) {
        console.log(`⚠️  Category "${category.name}" already exists, skipping...`);
        continue;
      }

      // Create the category
      const createdCategory = await prisma.category.create({
        data: {
          name: category.name,
          slug: slug,
          description: category.description
        }
      });

      console.log(`✅ Created category: "${createdCategory.name}" (slug: ${createdCategory.slug})`);
    }

    // Display all categories
    console.log('\n📋 All categories in the database:');
    const allCategories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });

    allCategories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} (${category.slug})`);
    });

    console.log(`\n✅ Successfully processed ${newCategories.length} categories!`);
    console.log(`📊 Total categories in database: ${allCategories.length}`);

  } catch (error) {
    console.error('❌ Error adding categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addNewCategories()
  .catch((error) => {
    console.error('❌ Failed to add categories:', error);
    process.exit(1);
  });
