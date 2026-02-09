-- Blog Posts / Product Reviews Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_verified_download BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments on Blog Posts
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post Likes
CREATE TABLE IF NOT EXISTS blog_post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_product ON blog_posts(product_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_user ON blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_likes_post ON blog_post_likes(post_id);
