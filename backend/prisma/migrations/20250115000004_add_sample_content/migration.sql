-- AddSampleContent
-- This migration adds sample comments and editorial notes to existing content

-- Insert sample comment (using actual staff user ID and article ID from database)
INSERT INTO "Comment" ("id", "content", "isPublic", "isApproved", "authorId", "articleId", "createdAt", "updatedAt") 
VALUES 
  ('comment_sample_1', 'This is an exciting new platform! Looking forward to seeing how it develops.', true, true, 'cmf8e2jlw000cvyu8v649b3av', 'cmf8e2jn4000evyu8elggingv', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample editorial note (using actual EIC user ID and article ID from database)
INSERT INTO "EditorialNote" ("id", "content", "isInternal", "authorId", "articleId", "createdAt", "updatedAt") 
VALUES 
  ('note_sample_1', 'This welcome article sets a good foundation for the platform. Consider adding more specific examples of how students can use the system.', true, 'cmf8e2ip5000avyu8gz8s6jut', 'cmf8e2jn4000evyu8elggingv', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
