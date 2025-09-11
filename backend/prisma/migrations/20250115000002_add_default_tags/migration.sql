-- AddDefaultTags
-- This migration adds default tags to the database

-- Insert default tags
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
