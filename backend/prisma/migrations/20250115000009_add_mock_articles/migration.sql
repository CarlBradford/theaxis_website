-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "featuredImage" TEXT,
    "mediaCaption" TEXT,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publicationDate" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "dislikeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "socialShares" INTEGER NOT NULL DEFAULT 0,
    "readingTime" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "reviewerId" TEXT,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");

-- CreateIndex
CREATE INDEX "Article_status_idx" ON "Article"("status");

-- CreateIndex
CREATE INDEX "Article_publicationDate_idx" ON "Article"("publicationDate");

-- CreateIndex
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");

-- CreateIndex
CREATE INDEX "Article_featured_idx" ON "Article"("featured");

-- CreateIndex
CREATE INDEX "Article_priority_idx" ON "Article"("priority");

-- CreateIndex
CREATE INDEX "Article_createdAt_idx" ON "Article"("createdAt");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert mock articles data
INSERT INTO "Article" (
    "id", "title", "slug", "content", "excerpt", "status", "authorId", "reviewerId", 
    "publicationDate", "publishedAt", "scheduledAt", "archivedAt", "viewCount", 
    "likeCount", "dislikeCount", "commentCount", "socialShares", "readingTime", 
    "featured", "priority", "createdAt", "updatedAt"
) VALUES 
-- DRAFT articles
('art_001', 'The Future of Artificial Intelligence in Healthcare', 'future-ai-healthcare', 
'<p>Artificial Intelligence is revolutionizing healthcare with applications in diagnosis, treatment planning, and drug discovery. This comprehensive analysis explores the current state and future potential of AI in medical practice.</p><p>From machine learning algorithms that can detect cancer in medical images to AI-powered drug discovery platforms, the healthcare industry is experiencing unprecedented transformation.</p>',
'AI is revolutionizing healthcare with applications in diagnosis, treatment planning, and drug discovery...',
'DRAFT', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), NULL,
NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 5, false, 0, NOW(), NOW()),

('art_002', 'Sustainable Energy Solutions for Modern Cities', 'sustainable-energy-cities',
'<p>As urban populations continue to grow, cities must adopt sustainable energy solutions to meet increasing demand while reducing environmental impact. This article examines renewable energy technologies and their implementation in urban environments.</p><p>Solar panels, wind turbines, and smart grid systems are becoming essential components of modern city infrastructure.</p>',
'Cities must adopt sustainable energy solutions to meet increasing demand while reducing environmental impact...',
'DRAFT', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), NULL,
NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 4, false, 0, NOW(), NOW()),

('art_003', 'Digital Marketing Trends for 2024', 'digital-marketing-trends-2024',
'<p>The digital marketing landscape continues to evolve rapidly, with new technologies and strategies emerging each year. This comprehensive guide covers the most important trends shaping digital marketing in 2024.</p><p>From AI-powered personalization to voice search optimization, marketers must adapt to stay competitive.</p>',
'The digital marketing landscape continues to evolve rapidly with new technologies and strategies...',
'DRAFT', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), NULL,
NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 6, false, 0, NOW(), NOW()),

-- IN_REVIEW articles
('art_004', 'The Psychology of Social Media Engagement', 'psychology-social-media-engagement',
'<p>Understanding the psychological factors that drive social media engagement is crucial for content creators and marketers. This research-based article explores the cognitive and emotional triggers that influence user behavior on social platforms.</p><p>From dopamine responses to social validation, multiple psychological mechanisms contribute to platform addiction and engagement patterns.</p>',
'Understanding psychological factors that drive social media engagement is crucial for content creators...',
'IN_REVIEW', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), (SELECT "id" FROM "User" WHERE "email" = 'section@theaxis.local' LIMIT 1),
NULL, NULL, NULL, NULL, 15, 0, 0, 0, 0, 7, false, 0, NOW(), NOW()),

('art_005', 'Climate Change Impact on Global Agriculture', 'climate-change-agriculture',
'<p>Climate change poses significant challenges to global food security and agricultural practices. This detailed analysis examines how rising temperatures, changing precipitation patterns, and extreme weather events affect crop yields and farming methods worldwide.</p><p>Adaptation strategies and sustainable farming practices are becoming increasingly important for food security.</p>',
'Climate change poses significant challenges to global food security and agricultural practices...',
'IN_REVIEW', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), (SELECT "id" FROM "User" WHERE "email" = 'section@theaxis.local' LIMIT 1),
NULL, NULL, NULL, NULL, 23, 0, 0, 0, 0, 8, false, 0, NOW(), NOW()),

('art_006', 'Cybersecurity Best Practices for Small Businesses', 'cybersecurity-small-businesses',
'<p>Small businesses are increasingly targeted by cybercriminals due to their often limited security resources. This practical guide outlines essential cybersecurity measures that small business owners can implement to protect their digital assets.</p><p>From employee training to network security, multiple layers of protection are necessary to prevent data breaches.</p>',
'Small businesses are increasingly targeted by cybercriminals due to limited security resources...',
'IN_REVIEW', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), (SELECT "id" FROM "User" WHERE "email" = 'section@theaxis.local' LIMIT 1),
NULL, NULL, NULL, NULL, 8, 0, 0, 0, 0, 5, false, 0, NOW(), NOW()),

-- NEEDS_REVISION articles
('art_007', 'The Evolution of Remote Work Culture', 'evolution-remote-work-culture',
'<p>Remote work has transformed from a temporary necessity to a permanent fixture in modern business culture. This article explores the evolution of remote work practices and their impact on employee productivity and satisfaction.</p><p>Companies are reimagining office spaces and developing new management strategies to support distributed teams.</p>',
'Remote work has transformed from a temporary necessity to a permanent fixture in modern business culture...',
'NEEDS_REVISION', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), (SELECT "id" FROM "User" WHERE "email" = 'section@theaxis.local' LIMIT 1),
NULL, NULL, NULL, NULL, 12, 0, 0, 0, 0, 6, false, 0, NOW(), NOW()),

('art_008', 'Mental Health Awareness in the Digital Age', 'mental-health-digital-age',
'<p>The digital age has brought both opportunities and challenges for mental health. This comprehensive article examines the impact of technology on mental well-being and explores strategies for maintaining healthy digital habits.</p><p>From social media comparison to information overload, digital technologies can both help and harm mental health.</p>',
'The digital age has brought both opportunities and challenges for mental health...',
'NEEDS_REVISION', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), (SELECT "id" FROM "User" WHERE "email" = 'section@theaxis.local' LIMIT 1),
NULL, NULL, NULL, NULL, 19, 0, 0, 0, 0, 7, false, 0, NOW(), NOW()),

-- APPROVED articles
('art_009', 'The Future of Electric Vehicles', 'future-electric-vehicles',
'<p>Electric vehicles are rapidly becoming the future of transportation, with major automakers investing billions in EV technology. This in-depth analysis covers battery innovations, charging infrastructure, and market trends shaping the EV revolution.</p><p>From Tesla''s dominance to traditional automakers'' EV strategies, the automotive industry is undergoing a fundamental transformation.</p>',
'Electric vehicles are rapidly becoming the future of transportation with major automakers investing billions...',
'APPROVED', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), (SELECT "id" FROM "User" WHERE "email" = 'section@theaxis.local' LIMIT 1),
NULL, NULL, NULL, NULL, 45, 0, 0, 0, 0, 9, false, 0, NOW(), NOW()),

('art_010', 'Sustainable Fashion: A Growing Movement', 'sustainable-fashion-movement',
'<p>The fashion industry is embracing sustainability as consumers demand more ethical and environmentally conscious clothing options. This article explores sustainable fashion practices, from eco-friendly materials to circular fashion models.</p><p>Brands are innovating with recycled materials, reducing water usage, and implementing fair labor practices throughout their supply chains.</p>',
'The fashion industry is embracing sustainability as consumers demand more ethical clothing options...',
'APPROVED', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), (SELECT "id" FROM "User" WHERE "email" = 'section@theaxis.local' LIMIT 1),
NULL, NULL, NULL, NULL, 32, 0, 0, 0, 0, 6, false, 0, NOW(), NOW()),

('art_011', 'The Rise of Plant-Based Diets', 'rise-plant-based-diets',
'<p>Plant-based diets are gaining popularity worldwide as people become more health-conscious and environmentally aware. This comprehensive guide examines the benefits, challenges, and practical aspects of adopting a plant-based lifestyle.</p><p>From nutritional considerations to environmental impact, plant-based diets offer numerous advantages for individuals and the planet.</p>',
'Plant-based diets are gaining popularity worldwide as people become more health-conscious...',
'APPROVED', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), (SELECT "id" FROM "User" WHERE "email" = 'section@theaxis.local' LIMIT 1),
NULL, NULL, NULL, NULL, 28, 0, 0, 0, 0, 8, false, 0, NOW(), NOW()),

-- SCHEDULED articles
('art_012', 'Space Exploration: The Next Frontier', 'space-exploration-next-frontier',
'<p>Humanity''s quest to explore space continues with ambitious missions to Mars, the Moon, and beyond. This article covers recent developments in space exploration, including private space companies and international collaborations.</p><p>From SpaceX''s Mars missions to NASA''s Artemis program, the next decade promises exciting advances in space exploration.</p>',
'Humanity''s quest to explore space continues with ambitious missions to Mars, the Moon, and beyond...',
'SCHEDULED', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), (SELECT "id" FROM "User" WHERE "email" = 'eic@theaxis.local' LIMIT 1),
'2024-02-15T10:00:00Z', NULL, '2024-02-15T10:00:00Z', NULL, 0, 0, 0, 0, 0, 7, false, 0, NOW(), NOW()),

('art_013', 'The Art of Storytelling in Business', 'storytelling-business',
'<p>Effective storytelling is a powerful tool for businesses to connect with customers and build brand loyalty. This article explores how companies can use narrative techniques to enhance their marketing and communication strategies.</p><p>From brand origin stories to customer testimonials, storytelling helps businesses create emotional connections with their audience.</p>',
'Effective storytelling is a powerful tool for businesses to connect with customers and build brand loyalty...',
'SCHEDULED', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), (SELECT "id" FROM "User" WHERE "email" = 'eic@theaxis.local' LIMIT 1),
'2024-02-20T14:00:00Z', NULL, '2024-02-20T14:00:00Z', NULL, 0, 0, 0, 0, 0, 6, false, 0, NOW(), NOW()),

-- PUBLISHED articles
('art_014', 'The Benefits of Regular Exercise', 'benefits-regular-exercise',
'<p>Regular exercise is one of the most important factors for maintaining good health and well-being. This comprehensive guide covers the physical, mental, and emotional benefits of consistent physical activity.</p><p>From cardiovascular health to stress reduction, exercise provides numerous advantages that extend far beyond physical fitness.</p>',
'Regular exercise is one of the most important factors for maintaining good health and well-being...',
'PUBLISHED', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), (SELECT "id" FROM "User" WHERE "email" = 'eic@theaxis.local' LIMIT 1),
'2024-01-15T09:00:00Z', '2024-01-15T09:00:00Z', NULL, NULL, 156, 0, 0, 0, 0, 5, false, 0, NOW(), NOW()),

('art_015', 'Understanding Cryptocurrency and Blockchain', 'understanding-cryptocurrency-blockchain',
'<p>Cryptocurrency and blockchain technology have revolutionized the financial industry and beyond. This beginner-friendly guide explains the fundamentals of digital currencies and distributed ledger technology.</p><p>From Bitcoin to smart contracts, blockchain technology offers innovative solutions for various industries beyond finance.</p>',
'Cryptocurrency and blockchain technology have revolutionized the financial industry and beyond...',
'PUBLISHED', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), (SELECT "id" FROM "User" WHERE "email" = 'eic@theaxis.local' LIMIT 1),
'2024-01-20T11:00:00Z', '2024-01-20T11:00:00Z', NULL, NULL, 203, 0, 0, 0, 0, 8, false, 0, NOW(), NOW()),

('art_016', 'The Importance of Mental Health Awareness', 'importance-mental-health-awareness',
'<p>Mental health awareness is crucial for creating supportive communities and reducing stigma around mental health issues. This article discusses the importance of open conversations about mental health and available resources.</p><p>From workplace mental health programs to community support groups, awareness initiatives help individuals access the help they need.</p>',
'Mental health awareness is crucial for creating supportive communities and reducing stigma...',
'PUBLISHED', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), (SELECT "id" FROM "User" WHERE "email" = 'eic@theaxis.local' LIMIT 1),
'2024-01-25T08:00:00Z', '2024-01-25T08:00:00Z', NULL, NULL, 89, 0, 0, 0, 0, 6, false, 0, NOW(), NOW()),

('art_017', 'The Future of Renewable Energy', 'future-renewable-energy',
'<p>Renewable energy sources are becoming increasingly cost-effective and efficient, driving the global transition away from fossil fuels. This article examines the latest developments in solar, wind, and other renewable technologies.</p><p>From offshore wind farms to advanced solar panels, renewable energy innovations are accelerating the clean energy transition.</p>',
'Renewable energy sources are becoming increasingly cost-effective and efficient...',
'PUBLISHED', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), (SELECT "id" FROM "User" WHERE "email" = 'eic@theaxis.local' LIMIT 1),
'2024-01-30T13:00:00Z', '2024-01-30T13:00:00Z', NULL, NULL, 127, 0, 0, 0, 0, 7, false, 0, NOW(), NOW()),

-- ARCHIVED articles
('art_018', 'Old Technology Trends That Shaped Computing', 'old-technology-trends-computing',
'<p>This archived article looks back at the technology trends that shaped the early days of personal computing. While some technologies have become obsolete, they laid the foundation for modern innovations.</p><p>From floppy disks to dial-up internet, these technologies represent important milestones in computing history.</p>',
'This archived article looks back at technology trends that shaped early personal computing...',
'ARCHIVED', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), (SELECT "id" FROM "User" WHERE "email" = 'eic@theaxis.local' LIMIT 1),
NULL, NULL, NULL, '2023-12-15T16:00:00Z', 45, 0, 0, 0, 0, 4, false, 0, NOW(), NOW()),

('art_019', 'Traditional Marketing Strategies in the Digital Era', 'traditional-marketing-digital-era',
'<p>This archived article examines how traditional marketing strategies have adapted to the digital era. While some methods remain relevant, others have been replaced by digital alternatives.</p><p>From print advertising to direct mail campaigns, traditional marketing methods continue to evolve alongside digital innovations.</p>',
'This archived article examines how traditional marketing strategies have adapted to the digital era...',
'ARCHIVED', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), (SELECT "id" FROM "User" WHERE "email" = 'eic@theaxis.local' LIMIT 1),
NULL, NULL, NULL, '2023-11-20T12:00:00Z', 23, 0, 0, 0, 0, 5, false, 0, NOW(), NOW()),

('art_020', 'The Psychology of Social Media Engagement', 'psychology-social-media-engagement-2',
'<p>Understanding the psychological factors that drive social media engagement is crucial for content creators and marketers. This research-based article explores the cognitive and emotional triggers that influence user behavior on social platforms.</p><p>From dopamine responses to social validation, multiple psychological mechanisms contribute to platform addiction and engagement patterns.</p>',
'Understanding psychological factors that drive social media engagement is crucial for content creators...',
'DRAFT', (SELECT "id" FROM "User" WHERE "email" = 'staff@theaxis.local' LIMIT 1), NULL,
NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 7, false, 0, NOW(), NOW());

-- Create categories for the specified 8 categories
INSERT INTO "Category" ("id", "name", "slug", "description", "createdAt", "updatedAt") VALUES
('cat_001', 'Development Communication', 'development-communication', 'Development Communication content', NOW(), NOW()),
('cat_002', 'Editorial', 'editorial', 'Editorial content', NOW(), NOW()),
('cat_003', 'Feature', 'feature', 'Feature content', NOW(), NOW()),
('cat_004', 'Literary', 'literary', 'Literary content', NOW(), NOW()),
('cat_005', 'News', 'news', 'News content', NOW(), NOW()),
('cat_006', 'Opinion', 'opinion', 'Opinion content', NOW(), NOW()),
('cat_007', 'Sports', 'sports', 'Sports content', NOW(), NOW()),
('cat_008', 'The AXIS Online', 'the-axis-online', 'The AXIS Online content', NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

-- Create tags for the articles
INSERT INTO "Tag" ("id", "name", "slug", "description", "createdAt", "updatedAt") VALUES
('tag_001', 'AI', 'ai', 'Artificial Intelligence', NOW(), NOW()),
('tag_002', 'Healthcare', 'healthcare', 'Healthcare and medicine', NOW(), NOW()),
('tag_003', 'Innovation', 'innovation', 'Innovation and technology', NOW(), NOW()),
('tag_004', 'Sustainability', 'sustainability', 'Sustainability and environment', NOW(), NOW()),
('tag_005', 'Energy', 'energy', 'Energy and power', NOW(), NOW()),
('tag_006', 'Cities', 'cities', 'Urban development', NOW(), NOW()),
('tag_007', 'Digital Marketing', 'digital-marketing', 'Digital marketing strategies', NOW(), NOW()),
('tag_008', 'Trends', 'trends', 'Industry trends', NOW(), NOW()),
('tag_009', '2024', '2024', 'Year 2024', NOW(), NOW()),
('tag_010', 'Psychology', 'psychology', 'Psychology and behavior', NOW(), NOW()),
('tag_011', 'Social Media', 'social-media', 'Social media platforms', NOW(), NOW()),
('tag_012', 'Engagement', 'engagement', 'User engagement', NOW(), NOW()),
('tag_013', 'Climate Change', 'climate-change', 'Climate change issues', NOW(), NOW()),
('tag_014', 'Agriculture', 'agriculture', 'Agriculture and farming', NOW(), NOW()),
('tag_015', 'Food Security', 'food-security', 'Food security and safety', NOW(), NOW()),
('tag_016', 'Cybersecurity', 'cybersecurity', 'Cybersecurity and protection', NOW(), NOW()),
('tag_017', 'Small Business', 'small-business', 'Small business management', NOW(), NOW()),
('tag_018', 'Security', 'security', 'Security measures', NOW(), NOW()),
('tag_019', 'Remote Work', 'remote-work', 'Remote work culture', NOW(), NOW()),
('tag_020', 'Culture', 'culture', 'Workplace culture', NOW(), NOW()),
('tag_021', 'Productivity', 'productivity', 'Productivity and efficiency', NOW(), NOW()),
('tag_022', 'Mental Health', 'mental-health', 'Mental health awareness', NOW(), NOW()),
('tag_023', 'Digital Age', 'digital-age', 'Digital technology era', NOW(), NOW()),
('tag_024', 'Wellness', 'wellness', 'Health and wellness', NOW(), NOW()),
('tag_025', 'Electric Vehicles', 'electric-vehicles', 'Electric vehicle technology', NOW(), NOW()),
('tag_026', 'Transportation', 'transportation', 'Transportation and mobility', NOW(), NOW()),
('tag_027', 'Fashion', 'fashion', 'Fashion and style', NOW(), NOW()),
('tag_028', 'Environment', 'environment', 'Environmental issues', NOW(), NOW()),
('tag_029', 'Ethics', 'ethics', 'Ethical considerations', NOW(), NOW()),
('tag_030', 'Plant-Based', 'plant-based', 'Plant-based lifestyle', NOW(), NOW()),
('tag_031', 'Nutrition', 'nutrition', 'Nutrition and diet', NOW(), NOW()),
('tag_032', 'Health', 'health', 'Health and fitness', NOW(), NOW()),
('tag_033', 'Space Exploration', 'space-exploration', 'Space exploration missions', NOW(), NOW()),
('tag_034', 'Mars', 'mars', 'Mars exploration', NOW(), NOW()),
('tag_035', 'NASA', 'nasa', 'NASA missions', NOW(), NOW()),
('tag_036', 'Storytelling', 'storytelling', 'Business storytelling', NOW(), NOW()),
('tag_037', 'Marketing', 'marketing', 'Marketing strategies', NOW(), NOW()),
('tag_038', 'Brand', 'brand', 'Brand management', NOW(), NOW()),
('tag_039', 'Exercise', 'exercise', 'Physical exercise', NOW(), NOW()),
('tag_040', 'Fitness', 'fitness', 'Fitness and health', NOW(), NOW()),
('tag_041', 'Cryptocurrency', 'cryptocurrency', 'Digital currencies', NOW(), NOW()),
('tag_042', 'Blockchain', 'blockchain', 'Blockchain technology', NOW(), NOW()),
('tag_043', 'Finance', 'finance', 'Financial technology', NOW(), NOW()),
('tag_044', 'Awareness', 'awareness', 'Social awareness', NOW(), NOW()),
('tag_045', 'Support', 'support', 'Support systems', NOW(), NOW()),
('tag_046', 'Renewable Energy', 'renewable-energy', 'Renewable energy sources', NOW(), NOW()),
('tag_047', 'Solar', 'solar', 'Solar energy', NOW(), NOW()),
('tag_048', 'Wind', 'wind', 'Wind energy', NOW(), NOW()),
('tag_049', 'Technology History', 'technology-history', 'History of technology', NOW(), NOW()),
('tag_050', 'Computing', 'computing', 'Computing technology', NOW(), NOW()),
('tag_051', 'Archive', 'archive', 'Archived content', NOW(), NOW()),
('tag_052', 'Traditional Marketing', 'traditional-marketing', 'Traditional marketing methods', NOW(), NOW()),
('tag_053', 'Digital Era', 'digital-era', 'Digital technology era', NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

-- Connect articles to Feature category (as requested)
INSERT INTO "_ArticleToCategory" ("A", "B")
SELECT "id", (SELECT "id" FROM "Category" WHERE "name" = 'Feature' LIMIT 1)
FROM "Article"
WHERE "id" IN ('art_001', 'art_002', 'art_003', 'art_004', 'art_005', 'art_006', 'art_007', 'art_008', 'art_009', 'art_010', 'art_011', 'art_012', 'art_013', 'art_014', 'art_015', 'art_016', 'art_017', 'art_018', 'art_019', 'art_020');

-- Connect articles to relevant tags
INSERT INTO "_ArticleToTag" ("A", "B")
SELECT 'art_001', (SELECT "id" FROM "Tag" WHERE "name" = 'AI' LIMIT 1)
UNION ALL SELECT 'art_001', (SELECT "id" FROM "Tag" WHERE "name" = 'Healthcare' LIMIT 1)
UNION ALL SELECT 'art_001', (SELECT "id" FROM "Tag" WHERE "name" = 'Innovation' LIMIT 1)
UNION ALL SELECT 'art_002', (SELECT "id" FROM "Tag" WHERE "name" = 'Sustainability' LIMIT 1)
UNION ALL SELECT 'art_002', (SELECT "id" FROM "Tag" WHERE "name" = 'Energy' LIMIT 1)
UNION ALL SELECT 'art_002', (SELECT "id" FROM "Tag" WHERE "name" = 'Cities' LIMIT 1)
UNION ALL SELECT 'art_003', (SELECT "id" FROM "Tag" WHERE "name" = 'Digital Marketing' LIMIT 1)
UNION ALL SELECT 'art_003', (SELECT "id" FROM "Tag" WHERE "name" = 'Trends' LIMIT 1)
UNION ALL SELECT 'art_003', (SELECT "id" FROM "Tag" WHERE "name" = '2024' LIMIT 1)
UNION ALL SELECT 'art_004', (SELECT "id" FROM "Tag" WHERE "name" = 'Psychology' LIMIT 1)
UNION ALL SELECT 'art_004', (SELECT "id" FROM "Tag" WHERE "name" = 'Social Media' LIMIT 1)
UNION ALL SELECT 'art_004', (SELECT "id" FROM "Tag" WHERE "name" = 'Engagement' LIMIT 1)
UNION ALL SELECT 'art_005', (SELECT "id" FROM "Tag" WHERE "name" = 'Climate Change' LIMIT 1)
UNION ALL SELECT 'art_005', (SELECT "id" FROM "Tag" WHERE "name" = 'Agriculture' LIMIT 1)
UNION ALL SELECT 'art_005', (SELECT "id" FROM "Tag" WHERE "name" = 'Food Security' LIMIT 1)
UNION ALL SELECT 'art_006', (SELECT "id" FROM "Tag" WHERE "name" = 'Cybersecurity' LIMIT 1)
UNION ALL SELECT 'art_006', (SELECT "id" FROM "Tag" WHERE "name" = 'Small Business' LIMIT 1)
UNION ALL SELECT 'art_006', (SELECT "id" FROM "Tag" WHERE "name" = 'Security' LIMIT 1)
UNION ALL SELECT 'art_007', (SELECT "id" FROM "Tag" WHERE "name" = 'Remote Work' LIMIT 1)
UNION ALL SELECT 'art_007', (SELECT "id" FROM "Tag" WHERE "name" = 'Culture' LIMIT 1)
UNION ALL SELECT 'art_007', (SELECT "id" FROM "Tag" WHERE "name" = 'Productivity' LIMIT 1)
UNION ALL SELECT 'art_008', (SELECT "id" FROM "Tag" WHERE "name" = 'Mental Health' LIMIT 1)
UNION ALL SELECT 'art_008', (SELECT "id" FROM "Tag" WHERE "name" = 'Digital Age' LIMIT 1)
UNION ALL SELECT 'art_008', (SELECT "id" FROM "Tag" WHERE "name" = 'Wellness' LIMIT 1)
UNION ALL SELECT 'art_009', (SELECT "id" FROM "Tag" WHERE "name" = 'Electric Vehicles' LIMIT 1)
UNION ALL SELECT 'art_009', (SELECT "id" FROM "Tag" WHERE "name" = 'Transportation' LIMIT 1)
UNION ALL SELECT 'art_009', (SELECT "id" FROM "Tag" WHERE "name" = 'Innovation' LIMIT 1)
UNION ALL SELECT 'art_010', (SELECT "id" FROM "Tag" WHERE "name" = 'Fashion' LIMIT 1)
UNION ALL SELECT 'art_010', (SELECT "id" FROM "Tag" WHERE "name" = 'Environment' LIMIT 1)
UNION ALL SELECT 'art_010', (SELECT "id" FROM "Tag" WHERE "name" = 'Ethics' LIMIT 1)
UNION ALL SELECT 'art_011', (SELECT "id" FROM "Tag" WHERE "name" = 'Plant-Based' LIMIT 1)
UNION ALL SELECT 'art_011', (SELECT "id" FROM "Tag" WHERE "name" = 'Nutrition' LIMIT 1)
UNION ALL SELECT 'art_011', (SELECT "id" FROM "Tag" WHERE "name" = 'Health' LIMIT 1)
UNION ALL SELECT 'art_012', (SELECT "id" FROM "Tag" WHERE "name" = 'Space Exploration' LIMIT 1)
UNION ALL SELECT 'art_012', (SELECT "id" FROM "Tag" WHERE "name" = 'Mars' LIMIT 1)
UNION ALL SELECT 'art_012', (SELECT "id" FROM "Tag" WHERE "name" = 'NASA' LIMIT 1)
UNION ALL SELECT 'art_013', (SELECT "id" FROM "Tag" WHERE "name" = 'Storytelling' LIMIT 1)
UNION ALL SELECT 'art_013', (SELECT "id" FROM "Tag" WHERE "name" = 'Marketing' LIMIT 1)
UNION ALL SELECT 'art_013', (SELECT "id" FROM "Tag" WHERE "name" = 'Brand' LIMIT 1)
UNION ALL SELECT 'art_014', (SELECT "id" FROM "Tag" WHERE "name" = 'Exercise' LIMIT 1)
UNION ALL SELECT 'art_014', (SELECT "id" FROM "Tag" WHERE "name" = 'Fitness' LIMIT 1)
UNION ALL SELECT 'art_014', (SELECT "id" FROM "Tag" WHERE "name" = 'Health' LIMIT 1)
UNION ALL SELECT 'art_015', (SELECT "id" FROM "Tag" WHERE "name" = 'Cryptocurrency' LIMIT 1)
UNION ALL SELECT 'art_015', (SELECT "id" FROM "Tag" WHERE "name" = 'Blockchain' LIMIT 1)
UNION ALL SELECT 'art_015', (SELECT "id" FROM "Tag" WHERE "name" = 'Finance' LIMIT 1)
UNION ALL SELECT 'art_016', (SELECT "id" FROM "Tag" WHERE "name" = 'Mental Health' LIMIT 1)
UNION ALL SELECT 'art_016', (SELECT "id" FROM "Tag" WHERE "name" = 'Awareness' LIMIT 1)
UNION ALL SELECT 'art_016', (SELECT "id" FROM "Tag" WHERE "name" = 'Support' LIMIT 1)
UNION ALL SELECT 'art_017', (SELECT "id" FROM "Tag" WHERE "name" = 'Renewable Energy' LIMIT 1)
UNION ALL SELECT 'art_017', (SELECT "id" FROM "Tag" WHERE "name" = 'Solar' LIMIT 1)
UNION ALL SELECT 'art_017', (SELECT "id" FROM "Tag" WHERE "name" = 'Wind' LIMIT 1)
UNION ALL SELECT 'art_018', (SELECT "id" FROM "Tag" WHERE "name" = 'Technology History' LIMIT 1)
UNION ALL SELECT 'art_018', (SELECT "id" FROM "Tag" WHERE "name" = 'Computing' LIMIT 1)
UNION ALL SELECT 'art_018', (SELECT "id" FROM "Tag" WHERE "name" = 'Archive' LIMIT 1)
UNION ALL SELECT 'art_019', (SELECT "id" FROM "Tag" WHERE "name" = 'Traditional Marketing' LIMIT 1)
UNION ALL SELECT 'art_019', (SELECT "id" FROM "Tag" WHERE "name" = 'Digital Era' LIMIT 1)
UNION ALL SELECT 'art_019', (SELECT "id" FROM "Tag" WHERE "name" = 'Archive' LIMIT 1)
UNION ALL SELECT 'art_020', (SELECT "id" FROM "Tag" WHERE "name" = 'Psychology' LIMIT 1)
UNION ALL SELECT 'art_020', (SELECT "id" FROM "Tag" WHERE "name" = 'Social Media' LIMIT 1)
UNION ALL SELECT 'art_020', (SELECT "id" FROM "Tag" WHERE "name" = 'Engagement' LIMIT 1);
