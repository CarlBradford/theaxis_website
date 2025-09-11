-- Content Management Phase Database Update
-- Run this script directly against your PostgreSQL database

-- Add new columns to Article table
ALTER TABLE "Article" 
ADD COLUMN IF NOT EXISTS "dislikeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "layoutArtistId" TEXT,
ADD COLUMN IF NOT EXISTS "mediaCaption" TEXT,
ADD COLUMN IF NOT EXISTS "publicationDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "socialShares" INTEGER NOT NULL DEFAULT 0;

-- Create ReviewType enum
DO $$ BEGIN
    CREATE TYPE "ReviewType" AS ENUM ('COMMENT', 'APPROVAL', 'REJECTION', 'REVISION_REQUEST', 'PUBLICATION_READY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ArticleAnalytics table
CREATE TABLE IF NOT EXISTS "ArticleAnalytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "dislikes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "socialShares" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "avgTimeOnPage" DOUBLE PRECISION,
    "bounceRate" DOUBLE PRECISION,
    "articleId" TEXT NOT NULL,
    CONSTRAINT "ArticleAnalytics_pkey" PRIMARY KEY ("id")
);

-- Create ArticleAuthor table
CREATE TABLE IF NOT EXISTS "ArticleAuthor" (
    "id" TEXT NOT NULL,
    "role" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ArticleAuthor_pkey" PRIMARY KEY ("id")
);

-- Create ArticleLikeHistory table
CREATE TABLE IF NOT EXISTS "ArticleLikeHistory" (
    "id" TEXT NOT NULL,
    "isLike" BOOLEAN NOT NULL,
    "likedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "articleId" TEXT NOT NULL,
    "userId" TEXT,
    CONSTRAINT "ArticleLikeHistory_pkey" PRIMARY KEY ("id")
);

-- Create ArticleMedia table
CREATE TABLE IF NOT EXISTS "ArticleMedia" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "articleId" TEXT NOT NULL,
    CONSTRAINT "ArticleMedia_pkey" PRIMARY KEY ("id")
);

-- Create ArticleViewHistory table
CREATE TABLE IF NOT EXISTS "ArticleViewHistory" (
    "id" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "articleId" TEXT NOT NULL,
    "userId" TEXT,
    CONSTRAINT "ArticleViewHistory_pkey" PRIMARY KEY ("id")
);

-- Create ReviewFeedback table
CREATE TABLE IF NOT EXISTS "ReviewFeedback" (
    "id" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "feedbackType" "ReviewType" NOT NULL DEFAULT 'COMMENT',
    "isApproved" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "articleId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    CONSTRAINT "ReviewFeedback_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Article_layoutArtistId_idx" ON "Article"("layoutArtistId");
CREATE INDEX IF NOT EXISTS "Article_publicationDate_idx" ON "Article"("publicationDate");
CREATE UNIQUE INDEX IF NOT EXISTS "ArticleAnalytics_articleId_date_key" ON "ArticleAnalytics"("articleId", "date");
CREATE INDEX IF NOT EXISTS "ArticleAnalytics_articleId_idx" ON "ArticleAnalytics"("articleId");
CREATE INDEX IF NOT EXISTS "ArticleAnalytics_date_idx" ON "ArticleAnalytics"("date");
CREATE UNIQUE INDEX IF NOT EXISTS "ArticleAuthor_articleId_userId_key" ON "ArticleAuthor"("articleId", "userId");
CREATE INDEX IF NOT EXISTS "ArticleAuthor_articleId_idx" ON "ArticleAuthor"("articleId");
CREATE INDEX IF NOT EXISTS "ArticleAuthor_userId_idx" ON "ArticleAuthor"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "ArticleLikeHistory_articleId_userId_key" ON "ArticleLikeHistory"("articleId", "userId");
CREATE INDEX IF NOT EXISTS "ArticleLikeHistory_articleId_idx" ON "ArticleLikeHistory"("articleId");
CREATE INDEX IF NOT EXISTS "ArticleLikeHistory_userId_idx" ON "ArticleLikeHistory"("userId");
CREATE INDEX IF NOT EXISTS "ArticleLikeHistory_likedAt_idx" ON "ArticleLikeHistory"("likedAt");
CREATE INDEX IF NOT EXISTS "ArticleMedia_articleId_idx" ON "ArticleMedia"("articleId");
CREATE INDEX IF NOT EXISTS "ArticleMedia_mediaId_idx" ON "ArticleMedia"("mediaId");
CREATE INDEX IF NOT EXISTS "ArticleViewHistory_articleId_idx" ON "ArticleViewHistory"("articleId");
CREATE INDEX IF NOT EXISTS "ArticleViewHistory_userId_idx" ON "ArticleViewHistory"("userId");
CREATE INDEX IF NOT EXISTS "ArticleViewHistory_viewedAt_idx" ON "ArticleViewHistory"("viewedAt");
CREATE INDEX IF NOT EXISTS "ReviewFeedback_articleId_idx" ON "ReviewFeedback"("articleId");
CREATE INDEX IF NOT EXISTS "ReviewFeedback_reviewerId_idx" ON "ReviewFeedback"("reviewerId");
CREATE INDEX IF NOT EXISTS "ReviewFeedback_createdAt_idx" ON "ReviewFeedback"("createdAt");

-- Add foreign key constraints
DO $$ BEGIN
    ALTER TABLE "Article" ADD CONSTRAINT "Article_layoutArtistId_fkey" FOREIGN KEY ("layoutArtistId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ArticleAnalytics" ADD CONSTRAINT "ArticleAnalytics_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ArticleAuthor" ADD CONSTRAINT "ArticleAuthor_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ArticleAuthor" ADD CONSTRAINT "ArticleAuthor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ArticleLikeHistory" ADD CONSTRAINT "ArticleLikeHistory_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ArticleLikeHistory" ADD CONSTRAINT "ArticleLikeHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ArticleMedia" ADD CONSTRAINT "ArticleMedia_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ArticleMedia" ADD CONSTRAINT "ArticleMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ArticleViewHistory" ADD CONSTRAINT "ArticleViewHistory_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ArticleViewHistory" ADD CONSTRAINT "ArticleViewHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ReviewFeedback" ADD CONSTRAINT "ReviewFeedback_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ReviewFeedback" ADD CONSTRAINT "ReviewFeedback_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update Media table to include ArticleMedia relation
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "articleMedia" TEXT[];

COMMIT;
