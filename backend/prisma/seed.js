const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create default categories
    console.log('📂 Creating default categories...');
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { slug: 'news' },
        update: {},
        create: {
          name: 'News',
          slug: 'news',
          description: 'Latest news and current events',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'opinion' },
        update: {},
        create: {
          name: 'Opinion',
          slug: 'opinion',
          description: 'Editorials and opinion pieces',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'features' },
        update: {},
        create: {
          name: 'Features',
          slug: 'features',
          description: 'In-depth feature articles',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'sports' },
        update: {},
        create: {
          name: 'Sports',
          slug: 'sports',
          description: 'Sports coverage and analysis',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'arts-culture' },
        update: {},
        create: {
          name: 'Arts & Culture',
          slug: 'arts-culture',
          description: 'Arts, entertainment, and cultural coverage',
        },
      }),
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // Create default tags
    console.log('🏷️ Creating default tags...');
    const tags = await Promise.all([
      prisma.tag.upsert({
        where: { slug: 'breaking-news' },
        update: {},
        create: {
          name: 'Breaking News',
          slug: 'breaking-news',
          description: 'Urgent and time-sensitive news',
          color: '#dc2626',
        },
      }),
      prisma.tag.upsert({
        where: { slug: 'exclusive' },
        update: {},
        create: {
          name: 'Exclusive',
          slug: 'exclusive',
          description: 'Exclusive content and interviews',
          color: '#7c3aed',
        },
      }),
      prisma.tag.upsert({
        where: { slug: 'investigation' },
        update: {},
        create: {
          name: 'Investigation',
          slug: 'investigation',
          description: 'Investigative journalism pieces',
          color: '#059669',
        },
      }),
      prisma.tag.upsert({
        where: { slug: 'student-life' },
        update: {},
        create: {
          name: 'Student Life',
          slug: 'student-life',
          description: 'Content related to student experiences',
          color: '#ea580c',
        },
      }),
    ]);

    console.log(`✅ Created ${tags.length} tags`);

    // Create default admin user
    console.log('👤 Creating default admin user...');
    const adminPassword = await argon2.hash('admin123', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@theaxis.local' },
      update: {},
      create: {
        email: 'admin@theaxis.local',
        username: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        passwordHash: adminPassword,
        role: 'ADVISER',
        isActive: true,
        emailVerified: true,
        bio: 'System administrator for The AXIS platform',
      },
    });

    console.log('✅ Created admin user:', adminUser.email);

    // Create default editor-in-chief
    console.log('👑 Creating default editor-in-chief...');
    const eicPassword = await argon2.hash('eic123', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    const eicUser = await prisma.user.upsert({
      where: { email: 'eic@theaxis.local' },
      update: {},
      create: {
        email: 'eic@theaxis.local',
        username: 'editorinchief',
        firstName: 'Editor',
        lastName: 'In Chief',
        passwordHash: eicPassword,
        role: 'EDITOR_IN_CHIEF',
        isActive: true,
        emailVerified: true,
        bio: 'Editor-in-Chief of The AXIS publication',
      },
    });

    console.log('✅ Created editor-in-chief:', eicUser.email);

    // Create default section head
    console.log('📰 Creating default section head...');
    const sectionHeadPassword = await argon2.hash('section123', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    const sectionHeadUser = await prisma.user.upsert({
      where: { email: 'section@theaxis.local' },
      update: {},
      create: {
        email: 'section@theaxis.local',
        username: 'sectionhead',
        firstName: 'Section',
        lastName: 'Head',
        passwordHash: sectionHeadPassword,
        role: 'SECTION_HEAD',
        isActive: true,
        emailVerified: true,
        bio: 'Section Head for The AXIS publication',
      },
    });

    console.log('✅ Created section head:', sectionHeadUser.email);

    // Create default staff writer
    console.log('✍️ Creating default staff writer...');
    const staffPassword = await argon2.hash('staff123', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    const staffUser = await prisma.user.upsert({
      where: { email: 'staff@theaxis.local' },
      update: {},
      create: {
        email: 'staff@theaxis.local',
        username: 'staffwriter',
        firstName: 'Staff',
        lastName: 'Writer',
        passwordHash: staffPassword,
        role: 'STAFF',
        isActive: true,
        emailVerified: true,
        bio: 'Staff writer for The AXIS publication',
      },
    });

    console.log('✅ Created staff writer:', staffUser.email);

    // Create sample article
    console.log('📄 Creating sample article...');
    const sampleArticle = await prisma.article.upsert({
      where: { slug: 'welcome-to-the-axis' },
      update: {},
      create: {
        title: 'Welcome to The AXIS',
        slug: 'welcome-to-the-axis',
        excerpt: 'A new era of student journalism begins with The AXIS platform.',
        content: `
          <h1>Welcome to The AXIS</h1>
          <p>Welcome to The AXIS, your comprehensive student publication platform. This platform represents a new era of student journalism, combining modern technology with traditional editorial values.</p>
          
          <h2>What is The AXIS?</h2>
          <p>The AXIS is a web-based content management system designed specifically for student publications. It provides tools for article submission, editorial review, publication management, and audience engagement.</p>
          
          <h2>Key Features</h2>
          <ul>
            <li><strong>Content Management:</strong> Streamlined article workflow from draft to publication</li>
            <li><strong>Role-Based Access:</strong> Secure access control for different user roles</li>
            <li><strong>Feedback System:</strong> Public comments and internal editorial notes</li>
            <li><strong>Analytics Dashboard:</strong> Insights into readership and engagement</li>
          </ul>
          
          <h2>Getting Started</h2>
          <p>Whether you're a student writer, editor, or publication adviser, The AXIS provides the tools you need to create, manage, and publish high-quality content.</p>
          
          <p>This is just the beginning. The platform will continue to evolve with new features and improvements based on user feedback and needs.</p>
        `,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        authorId: adminUser.id,
        seoTitle: 'Welcome to The AXIS - Student Publication Platform',
        seoDescription: 'Discover The AXIS, the comprehensive student publication platform for modern journalism.',
        seoKeywords: ['student publication', 'journalism', 'content management', 'editorial platform'],
      },
    });

    console.log('✅ Created sample article:', sampleArticle.title);

    // Create sample comment
    console.log('💬 Creating sample comment...');
    const sampleComment = await prisma.comment.upsert({
      where: { id: 'sample-comment-1' },
      update: {},
      create: {
        id: 'sample-comment-1',
        content: 'This is an exciting new platform! Looking forward to seeing how it develops.',
        isPublic: true,
        isApproved: true,
        authorId: staffUser.id,
        articleId: sampleArticle.id,
      },
    });

    console.log('✅ Created sample comment');

    // Create sample editorial note
    console.log('📝 Creating sample editorial note...');
    const sampleNote = await prisma.editorialNote.upsert({
      where: { id: 'sample-note-1' },
      update: {},
      create: {
        id: 'sample-note-1',
        content: 'This welcome article sets a good foundation for the platform. Consider adding more specific examples of how students can use the system.',
        isInternal: true,
        authorId: eicUser.id,
        articleId: sampleArticle.id,
      },
    });

    console.log('✅ Created sample editorial note');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Default Login Credentials:');
    console.log('👤 Admin: admin@theaxis.local / admin123');
    console.log('👑 Editor-in-Chief: eic@theaxis.local / eic123');
    console.log('📰 Section Head: section@theaxis.local / section123');
    console.log('✍️ Staff Writer: staff@theaxis.local / staff123');
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
