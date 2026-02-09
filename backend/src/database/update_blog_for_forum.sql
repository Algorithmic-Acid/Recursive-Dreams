-- Update blog_posts table to support general forum discussions
-- Make product_id nullable so posts can be general or product-specific
ALTER TABLE blog_posts ALTER COLUMN product_id DROP NOT NULL;

-- Add category field for organizing discussions
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';

-- Add pinned flag for important announcements
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Add view count
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create index on category
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

-- Create index on pinned posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_pinned ON blog_posts(is_pinned DESC, created_at DESC);

COMMENT ON COLUMN blog_posts.product_id IS 'NULL for general forum posts, UUID for product reviews';
COMMENT ON COLUMN blog_posts.category IS 'Categories: general, lore, support, announcements, reviews';
COMMENT ON COLUMN blog_posts.is_pinned IS 'Pinned posts appear at the top of their category';
