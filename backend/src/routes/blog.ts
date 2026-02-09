import express, { Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { db } from '../config/postgres';
import { ApiResponse } from '../types';

const router = express.Router();

// ============================================
// BLOG POSTS / PRODUCT REVIEWS / FORUM
// ============================================

// Get all forum posts (general discussions, not product-specific)
router.get('/forum', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const categoryFilter = category ? 'AND bp.category = $1' : '';
    const params = category ? [category, limit, offset] : [limit, offset];

    const result = await db.query(`
      SELECT
        bp.id, bp.user_id, bp.title, bp.content, bp.category, bp.is_pinned, bp.view_count,
        bp.likes_count, bp.created_at, bp.updated_at,
        u.name as author_name,
        u.avatar_url as author_avatar,
        COUNT(DISTINCT bc.id) as comment_count
      FROM blog_posts bp
      JOIN users u ON bp.user_id = u.id
      LEFT JOIN blog_comments bc ON bc.post_id = bp.id
      WHERE bp.product_id IS NULL ${categoryFilter}
      GROUP BY bp.id, bp.user_id, u.name, u.avatar_url
      ORDER BY bp.is_pinned DESC, bp.created_at DESC
      LIMIT $${category ? '2' : '1'} OFFSET $${category ? '3' : '2'}
    `, params);

    const response: ApiResponse = {
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        content: row.content,
        category: row.category,
        isPinned: row.is_pinned,
        viewCount: row.view_count,
        likesCount: row.likes_count,
        commentCount: parseInt(row.comment_count),
        authorName: row.author_name,
        authorAvatar: row.author_avatar || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get forum posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch forum posts',
    });
  }
});

// Create a new forum post (requires login)
router.post('/forum', protect, async (req: Request, res: Response) => {
  try {
    const { title, content, category } = req.body;
    const userId = req.user!.userId;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required',
      });
    }

    const validCategories = ['general', 'lore', 'support', 'announcements', 'reviews'];
    const postCategory = validCategories.includes(category) ? category : 'general';

    const result = await db.query(`
      INSERT INTO blog_posts (user_id, product_id, title, content, category)
      VALUES ($1, NULL, $2, $3, $4)
      RETURNING id, title, content, category, likes_count, view_count, created_at
    `, [userId, title, content, postCategory]);

    const post = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        likesCount: post.likes_count,
        viewCount: post.view_count,
        createdAt: post.created_at,
      },
      message: 'Forum post created successfully',
    });
  } catch (error: any) {
    console.error('Create forum post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create forum post',
    });
  }
});

// Get all blog posts for a product (public)
router.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await db.query(`
      SELECT
        bp.id, bp.title, bp.content, bp.rating, bp.is_verified_download,
        bp.likes_count, bp.created_at, bp.updated_at,
        u.name as author_name, u.email as author_email,
        u.avatar_url as author_avatar,
        COUNT(DISTINCT bc.id) as comment_count
      FROM blog_posts bp
      JOIN users u ON bp.user_id = u.id
      LEFT JOIN blog_comments bc ON bc.post_id = bp.id
      WHERE bp.product_id = $1
      GROUP BY bp.id, u.name, u.email, u.avatar_url
      ORDER BY bp.created_at DESC
      LIMIT $2 OFFSET $3
    `, [productId, limit, offset]);

    const response: ApiResponse = {
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        rating: row.rating,
        isVerifiedDownload: row.is_verified_download,
        likesCount: row.likes_count,
        commentCount: parseInt(row.comment_count),
        authorName: row.author_name,
        authorAvatar: row.author_avatar || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get blog posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog posts',
    });
  }
});

// Create a new blog post (requires login)
router.post('/product/:productId', protect, async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { title, content, rating } = req.body;
    const userId = req.user!.userId;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required',
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5',
      });
    }

    // Check if user has downloaded this product (from orders or free downloads)
    const downloadCheck = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.user_id = $1 AND oi.product_id = $2 AND o.payment_status = 'paid'
      ) OR EXISTS (
        SELECT 1 FROM traffic_logs tl
        JOIN products p ON p.metadata->>'download_file' = REPLACE(tl.path, '/downloads/', '')
        WHERE tl.user_id = $1 AND p.id = $2 AND tl.status_code = 200
      ) as has_downloaded
    `, [userId, productId]);

    const isVerifiedDownload = downloadCheck.rows[0]?.has_downloaded || false;

    // Create the blog post
    const result = await db.query(`
      INSERT INTO blog_posts (user_id, product_id, title, content, rating, is_verified_download)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, content, rating, is_verified_download, likes_count, created_at
    `, [userId, productId, title, content, rating || null, isVerifiedDownload]);

    const post = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: post.id,
        title: post.title,
        content: post.content,
        rating: post.rating,
        isVerifiedDownload: post.is_verified_download,
        likesCount: post.likes_count,
        createdAt: post.created_at,
      },
      message: 'Blog post created successfully',
    });
  } catch (error: any) {
    console.error('Create blog post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create blog post',
    });
  }
});

// Update a blog post (only by author)
router.put('/:postId', protect, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { title, content, rating } = req.body;
    const userId = req.user!.userId;

    // Check if user owns this post
    const ownerCheck = await db.query(
      'SELECT user_id FROM blog_posts WHERE id = $1',
      [postId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
    }

    if (ownerCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own posts',
      });
    }

    const result = await db.query(`
      UPDATE blog_posts
      SET title = COALESCE($1, title),
          content = COALESCE($2, content),
          rating = COALESCE($3, rating),
          updated_at = NOW()
      WHERE id = $4
      RETURNING id, title, content, rating, updated_at
    `, [title, content, rating, postId]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Blog post updated successfully',
    });
  } catch (error: any) {
    console.error('Update blog post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update blog post',
    });
  }
});

// Delete a blog post (only by author)
router.delete('/:postId', protect, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user!.userId;

    const result = await db.query(
      'DELETE FROM blog_posts WHERE id = $1 AND user_id = $2 RETURNING id',
      [postId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found or unauthorized',
      });
    }

    res.json({
      success: true,
      message: 'Blog post deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete blog post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete blog post',
    });
  }
});

// Like/Unlike a blog post
router.post('/:postId/like', protect, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user!.userId;

    // Check if already liked
    const likeCheck = await db.query(
      'SELECT id FROM blog_post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (likeCheck.rows.length > 0) {
      // Unlike
      await db.query('DELETE FROM blog_post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      await db.query('UPDATE blog_posts SET likes_count = likes_count - 1 WHERE id = $1', [postId]);

      res.json({
        success: true,
        message: 'Post unliked',
        liked: false,
      });
    } else {
      // Like
      await db.query('INSERT INTO blog_post_likes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
      await db.query('UPDATE blog_posts SET likes_count = likes_count + 1 WHERE id = $1', [postId]);

      res.json({
        success: true,
        message: 'Post liked',
        liked: true,
      });
    }
  } catch (error: any) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like post',
    });
  }
});

// ============================================
// COMMENTS
// ============================================

// Get comments for a post
router.get('/:postId/comments', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const result = await db.query(`
      SELECT
        bc.id, bc.content, bc.created_at, bc.updated_at,
        u.name as author_name,
        u.avatar_url as author_avatar
      FROM blog_comments bc
      JOIN users u ON bc.user_id = u.id
      WHERE bc.post_id = $1
      ORDER BY bc.created_at ASC
    `, [postId]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        content: row.content,
        authorName: row.author_name,
        authorAvatar: row.author_avatar || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error: any) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments',
    });
  }
});

// Add a comment to a post
router.post('/:postId/comments', protect, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user!.userId;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    const result = await db.query(`
      INSERT INTO blog_comments (post_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, content, created_at
    `, [postId, userId, content]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Comment added successfully',
    });
  } catch (error: any) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment',
    });
  }
});

// Delete a comment (only by author)
router.delete('/:postId/comments/:commentId', protect, async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.user!.userId;

    const result = await db.query(
      'DELETE FROM blog_comments WHERE id = $1 AND user_id = $2 RETURNING id',
      [commentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found or unauthorized',
      });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment',
    });
  }
});

export default router;
