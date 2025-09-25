-- AddDefaultCategories
-- This migration adds default categories to the database

-- Insert default categories
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