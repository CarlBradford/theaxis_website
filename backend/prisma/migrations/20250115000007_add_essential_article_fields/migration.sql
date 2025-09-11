-- Add essential fields to Article table for Content Management Phase
-- These fields improve user experience and content management

-- Add excerpt field for article summaries
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "excerpt" TEXT;

-- Add publishedAt field for actual publication date
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

-- Add readingTime field for estimated reading time
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "readingTime" INTEGER;

-- Add featured field for featured articles
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;

-- Add priority field for display order
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS "Article_publishedAt_idx" ON "Article"("publishedAt");
CREATE INDEX IF NOT EXISTS "Article_featured_idx" ON "Article"("featured");
CREATE INDEX IF NOT EXISTS "Article_priority_idx" ON "Article"("priority");

COMMIT;
