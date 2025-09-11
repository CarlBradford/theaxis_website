-- Add comprehensive mock data for Content Management Phase
-- This migration adds 10+ sample articles with all new fields

-- First, ensure we have the default users (in case they don't exist)
INSERT INTO "User" ("id", "email", "username", "firstName", "lastName", "passwordHash", "role", "isActive", "emailVerified", "bio", "createdAt", "updatedAt") 
VALUES 
  ('user_admin', 'admin@theaxis.local', 'admin', 'System', 'Administrator', '$argon2id$v=19$m=65536,t=3,p=1$9qAt6+s3OYV8gDjiRN1Gkw$zzeWQW9SsJYfsM9EMcfUinuxGVAnuChzbvq7UMp/Dzo', 'ADVISER', true, true, 'System administrator for The AXIS platform', NOW(), NOW()),
  ('user_eic', 'eic@theaxis.local', 'editorinchief', 'Editor', 'In Chief', '$argon2id$v=19$m=65536,t=3,p=1$64MoHdAwmm64EYtYPqKGag$vbCIXi2M6yG/s/VOKRb9+okUsEqiyv1gzVMSxp/Vhqk', 'EDITOR_IN_CHIEF', true, true, 'Editor-in-Chief of The AXIS publication', NOW(), NOW()),
  ('user_section', 'section@theaxis.local', 'sectionhead', 'Section', 'Head', '$argon2id$v=19$m=65536,t=3,p=1$0HGwZW2BPfb9jpNHEe+BjA$e2GnXPfqnfw0zNsWRR/bTJLaGee9Fx3jA8Faj/41ovE', 'SECTION_HEAD', true, true, 'Section Head for The AXIS publication', NOW(), NOW()),
  ('user_staff', 'staff@theaxis.local', 'publicationstaff', 'Staff', 'Writer', '$argon2id$v=19$m=65536,t=3,p=1$L2WHYvS49FrtCfhhA5thqA$9QRfSK2+7u0gTA/neLgNBXNriWYbll4cIFtNyBkwUio', 'STAFF', true, true, 'Publication staff for The AXIS publication', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Add 10+ comprehensive mock articles with all new fields
INSERT INTO "Article" (
  "id", "title", "slug", "content", "excerpt", "featuredImage", "mediaCaption", 
  "status", "publicationDate", "publishedAt", "scheduledAt", "archivedAt",
  "viewCount", "likeCount", "dislikeCount", "commentCount", "socialShares",
  "readingTime", "featured", "priority", "createdAt", "updatedAt", "authorId", "reviewerId"
) VALUES 
  (
    'article_1', 
    'Welcome to The AXIS: Your New Digital Publication Platform', 
    'welcome-to-the-axis-digital-publication-platform',
    'Welcome to The AXIS, your comprehensive digital publication platform designed specifically for educational institutions. This platform revolutionizes how students, faculty, and staff create, manage, and share content in an organized, professional manner. Our system provides powerful tools for content creation, editorial workflow management, and audience engagement tracking. Whether you are a student journalist, faculty member, or publication staff, The AXIS offers intuitive features that streamline the entire publication process from initial draft to final publication.',
    'Discover The AXIS platform - a comprehensive digital publication system designed for educational institutions with powerful content management and editorial workflow tools.',
    'https://example.com/images/welcome-axis.jpg',
    'The AXIS platform interface showing content management dashboard',
    'PUBLISHED',
    '2025-01-15 10:00:00',
    '2025-01-15 10:05:00',
    NULL,
    NULL,
    1250,
    89,
    3,
    23,
    45,
    8,
    true,
    10,
    '2025-01-10 09:00:00',
    '2025-01-15 10:05:00',
    'user_staff',
    'user_eic'
  ),
  (
    'article_2',
    'Getting Started: A Complete Guide to Content Creation',
    'getting-started-complete-guide-content-creation',
    'Creating compelling content on The AXIS platform is easier than ever. This comprehensive guide walks you through every aspect of content creation, from brainstorming ideas to publishing your final piece. Learn how to use our rich text editor, add multimedia elements, manage your content workflow, and optimize your articles for maximum engagement. Our platform supports various content types including news articles, feature stories, opinion pieces, and multimedia content.',
    'Master content creation on The AXIS platform with this comprehensive guide covering everything from ideation to publication.',
    'https://example.com/images/content-creation-guide.jpg',
    'Screenshot of The AXIS content creation interface',
    'PUBLISHED',
    '2025-01-14 14:00:00',
    '2025-01-14 14:15:00',
    NULL,
    NULL,
    890,
    67,
    2,
    18,
    32,
    12,
    true,
    9,
    '2025-01-12 11:00:00',
    '2025-01-14 14:15:00',
    'user_staff',
    'user_section'
  ),
  (
    'article_3',
    'Editorial Workflow: From Draft to Publication',
    'editorial-workflow-draft-to-publication',
    'Understanding the editorial workflow is crucial for maintaining high-quality content standards. Our platform implements a sophisticated review process that ensures every article meets publication standards before going live. Learn about the different stages: Draft, In Review, Needs Revision, Approved, Scheduled, Published, and Archived. Discover how editors can provide feedback, request revisions, and manage the publication timeline effectively.',
    'Navigate the editorial workflow process on The AXIS platform, from initial draft submission to final publication approval.',
    'https://example.com/images/editorial-workflow.jpg',
    'Editorial workflow diagram showing content review stages',
    'PUBLISHED',
    '2025-01-13 16:00:00',
    '2025-01-13 16:20:00',
    NULL,
    NULL,
    756,
    54,
    1,
    15,
    28,
    10,
    false,
    8,
    '2025-01-11 13:00:00',
    '2025-01-13 16:20:00',
    'user_section',
    'user_eic'
  ),
  (
    'article_4',
    'Student Journalism in the Digital Age',
    'student-journalism-digital-age',
    'The landscape of student journalism has evolved dramatically with digital technology. Today''s student journalists have access to powerful tools and platforms that enable them to reach wider audiences and create more engaging content. This article explores the opportunities and challenges facing student journalists in the digital age, including social media integration, multimedia storytelling, and the importance of digital literacy.',
    'Explore how digital technology is transforming student journalism and the new opportunities it presents for young journalists.',
    'https://example.com/images/student-journalism.jpg',
    'Students working on digital journalism projects',
    'PUBLISHED',
    '2025-01-12 12:00:00',
    '2025-01-12 12:10:00',
    NULL,
    NULL,
    1123,
    78,
    4,
    31,
    52,
    15,
    true,
    7,
    '2025-01-09 15:00:00',
    '2025-01-12 12:10:00',
    'user_staff',
    'user_section'
  ),
  (
    'article_5',
    'Building Community Through Campus Publications',
    'building-community-campus-publications',
    'Campus publications play a vital role in building and maintaining community spirit within educational institutions. They serve as platforms for student voices, faculty insights, and campus news. This article examines how publications like The AXIS can foster community engagement, provide opportunities for student leadership, and create lasting connections between different campus groups and organizations.',
    'Discover how campus publications strengthen community bonds and provide platforms for diverse voices within educational institutions.',
    'https://example.com/images/campus-community.jpg',
    'Campus community members reading The AXIS publication',
    'PUBLISHED',
    '2025-01-11 10:00:00',
    '2025-01-11 10:05:00',
    NULL,
    NULL,
    634,
    42,
    2,
    12,
    19,
    7,
    false,
    6,
    '2025-01-08 14:00:00',
    '2025-01-11 10:05:00',
    'user_staff',
    'user_eic'
  ),
  (
    'article_6',
    'Multimedia Storytelling: Beyond Text',
    'multimedia-storytelling-beyond-text',
    'Modern digital publications go far beyond traditional text-based articles. Multimedia storytelling combines text, images, videos, audio, and interactive elements to create engaging narratives. Learn how to effectively integrate multimedia elements into your articles, choose the right media formats, and create compelling visual stories that captivate your audience.',
    'Master multimedia storytelling techniques to create engaging, interactive content that goes beyond traditional text-based articles.',
    'https://example.com/images/multimedia-storytelling.jpg',
    'Multimedia content creation workspace',
    'PUBLISHED',
    '2025-01-10 15:00:00',
    '2025-01-10 15:12:00',
    NULL,
    NULL,
    987,
    71,
    3,
    26,
    41,
    11,
    false,
    5,
    '2025-01-07 16:00:00',
    '2025-01-10 15:12:00',
    'user_staff',
    'user_section'
  ),
  (
    'article_7',
    'Analytics and Engagement: Understanding Your Audience',
    'analytics-engagement-understanding-audience',
    'Understanding your audience is crucial for creating content that resonates and drives engagement. The AXIS platform provides comprehensive analytics tools that help you track article performance, audience demographics, and engagement metrics. Learn how to interpret these analytics to improve your content strategy and maximize reader engagement.',
    'Learn how to use analytics tools to understand your audience and create more engaging content that drives reader interaction.',
    'https://example.com/images/analytics-dashboard.jpg',
    'Analytics dashboard showing article performance metrics',
    'PUBLISHED',
    '2025-01-09 11:00:00',
    '2025-01-09 11:08:00',
    NULL,
    NULL,
    723,
    58,
    2,
    19,
    35,
    9,
    false,
    4,
    '2025-01-06 12:00:00',
    '2025-01-09 11:08:00',
    'user_section',
    'user_eic'
  ),
  (
    'article_8',
    'Collaborative Writing: Working with Multiple Authors',
    'collaborative-writing-multiple-authors',
    'Collaborative writing brings together diverse perspectives and expertise to create richer, more comprehensive content. The AXIS platform supports multiple authors per article, enabling seamless collaboration between writers, editors, and subject matter experts. Discover best practices for collaborative writing, managing author contributions, and maintaining consistency across multi-author pieces.',
    'Master collaborative writing techniques and learn how to effectively work with multiple authors on The AXIS platform.',
    'https://example.com/images/collaborative-writing.jpg',
    'Team of writers collaborating on an article',
    'PUBLISHED',
    '2025-01-08 13:00:00',
    '2025-01-08 13:15:00',
    NULL,
    NULL,
    856,
    63,
    1,
    22,
    38,
    13,
    false,
    3,
    '2025-01-05 10:00:00',
    '2025-01-08 13:15:00',
    'user_staff',
    'user_section'
  ),
  (
    'article_9',
    'Content Scheduling and Publication Management',
    'content-scheduling-publication-management',
    'Effective content management involves strategic planning and scheduling. Learn how to use The AXIS platform''s scheduling features to plan your content calendar, coordinate publication timing, and maintain consistent publishing schedules. Discover tips for managing seasonal content, coordinating with campus events, and optimizing publication timing for maximum reach.',
    'Master content scheduling and publication management to maintain consistent, strategic content publishing on The AXIS platform.',
    'https://example.com/images/content-scheduling.jpg',
    'Content calendar showing scheduled publications',
    'PUBLISHED',
    '2025-01-07 09:00:00',
    '2025-01-07 09:10:00',
    NULL,
    NULL,
    592,
    39,
    1,
    14,
    24,
    8,
    false,
    2,
    '2025-01-04 14:00:00',
    '2025-01-07 09:10:00',
    'user_staff',
    'user_eic'
  ),
  (
    'article_10',
    'Future of Digital Publications in Education',
    'future-digital-publications-education',
    'The future of digital publications in education is bright and full of possibilities. Emerging technologies like artificial intelligence, virtual reality, and interactive media are transforming how we create and consume content. This forward-looking article explores upcoming trends, technological innovations, and the evolving role of digital publications in educational settings.',
    'Explore the exciting future of digital publications in education and the emerging technologies that will shape content creation.',
    'https://example.com/images/future-publications.jpg',
    'Futuristic digital publication interface concept',
    'PUBLISHED',
    '2025-01-06 16:00:00',
    '2025-01-06 16:05:00',
    NULL,
    NULL,
    1347,
    95,
    5,
    37,
    67,
    16,
    true,
    1,
    '2025-01-03 11:00:00',
    '2025-01-06 16:05:00',
    'user_section',
    'user_eic'
  ),
  (
    'article_11',
    'Best Practices for Campus News Reporting',
    'best-practices-campus-news-reporting',
    'Campus news reporting requires a unique approach that balances journalistic integrity with community sensitivity. This comprehensive guide covers essential practices for campus journalists, including fact-checking, source verification, ethical reporting, and maintaining objectivity while covering sensitive campus issues.',
    'Learn essential best practices for campus news reporting, from fact-checking to ethical journalism in educational settings.',
    'https://example.com/images/campus-reporting.jpg',
    'Campus journalist conducting interviews',
    'IN_REVIEW',
    '2025-01-16 10:00:00',
    NULL,
    NULL,
    NULL,
    0,
    0,
    0,
    0,
    0,
    6,
    false,
    0,
    '2025-01-14 15:00:00',
    '2025-01-14 15:00:00',
    'user_staff',
    'user_section'
  ),
  (
    'article_12',
    'Social Media Integration for Publications',
    'social-media-integration-publications',
    'Social media has become an integral part of modern publication strategies. Learn how to effectively integrate social media platforms with your digital publication, create engaging social content, and use social media analytics to drive traffic back to your articles. Discover strategies for building social media presence and engaging with your audience across different platforms.',
    'Master social media integration strategies to amplify your publication''s reach and engage with readers across multiple platforms.',
    'https://example.com/images/social-media-integration.jpg',
    'Social media dashboard showing publication integration',
    'DRAFT',
    NULL,
    NULL,
    '2025-01-20 12:00:00',
    NULL,
    0,
    0,
    0,
    0,
    0,
    9,
    false,
    0,
    '2025-01-15 10:00:00',
    '2025-01-15 10:00:00',
    'user_staff',
    NULL
  )
ON CONFLICT (slug) DO NOTHING;

-- Connect articles to categories and tags
-- First, get category and tag IDs (assuming they exist from previous migrations)
-- Connect articles to categories
INSERT INTO "_ArticleToCategory" ("A", "B")
SELECT a.id, c.id
FROM "Article" a, "Category" c
WHERE a.slug IN (
  'welcome-to-the-axis-digital-publication-platform',
  'getting-started-complete-guide-content-creation',
  'editorial-workflow-draft-to-publication'
) AND c.slug = 'platform-updates'
ON CONFLICT DO NOTHING;

INSERT INTO "_ArticleToCategory" ("A", "B")
SELECT a.id, c.id
FROM "Article" a, "Category" c
WHERE a.slug IN (
  'student-journalism-digital-age',
  'building-community-campus-publications',
  'multimedia-storytelling-beyond-text'
) AND c.slug = 'student-life'
ON CONFLICT DO NOTHING;

INSERT INTO "_ArticleToCategory" ("A", "B")
SELECT a.id, c.id
FROM "Article" a, "Category" c
WHERE a.slug IN (
  'analytics-engagement-understanding-audience',
  'collaborative-writing-multiple-authors',
  'content-scheduling-publication-management'
) AND c.slug = 'technology'
ON CONFLICT DO NOTHING;

-- Connect articles to tags
INSERT INTO "_ArticleToTag" ("A", "B")
SELECT a.id, t.id
FROM "Article" a, "Tag" t
WHERE a.slug = 'welcome-to-the-axis-digital-publication-platform' 
AND t.slug IN ('platform', 'introduction', 'digital')
ON CONFLICT DO NOTHING;

INSERT INTO "_ArticleToTag" ("A", "B")
SELECT a.id, t.id
FROM "Article" a, "Tag" t
WHERE a.slug = 'getting-started-complete-guide-content-creation' 
AND t.slug IN ('tutorial', 'content-creation', 'guide')
ON CONFLICT DO NOTHING;

INSERT INTO "_ArticleToTag" ("A", "B")
SELECT a.id, t.id
FROM "Article" a, "Tag" t
WHERE a.slug = 'editorial-workflow-draft-to-publication' 
AND t.slug IN ('workflow', 'editorial', 'process')
ON CONFLICT DO NOTHING;

INSERT INTO "_ArticleToTag" ("A", "B")
SELECT a.id, t.id
FROM "Article" a, "Tag" t
WHERE a.slug = 'student-journalism-digital-age' 
AND t.slug IN ('journalism', 'students', 'digital-age')
ON CONFLICT DO NOTHING;

INSERT INTO "_ArticleToTag" ("A", "B")
SELECT a.id, t.id
FROM "Article" a, "Tag" t
WHERE a.slug = 'building-community-campus-publications' 
AND t.slug IN ('community', 'campus', 'publications')
ON CONFLICT DO NOTHING;

COMMIT;
