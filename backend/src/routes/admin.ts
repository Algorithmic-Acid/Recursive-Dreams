import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, admin } from '../middleware/auth';
import { db } from '../config/postgres';
import { ApiResponse } from '../types';
import ProductRepository from '../repositories/ProductRepository';
import { getRequestLogs, getLogStats, clearRequestLogs } from '../middleware/requestLogger';
import { getBlacklistStatus, manualBan, manualUnban, getAlerts, dismissAlert, dismissAllAlerts, getCredHarvests, clearCredHarvests } from '../middleware/voidTrap';

// ─── AUDIO PREVIEW UPLOAD ───
const PREVIEWS_DIR = process.env.PREVIEWS_DIR || '/home/wes/voidvendor-uploads/previews';

const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PREVIEWS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const audioUpload = multer({
  storage: audioStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, admin);

// Get all users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, email, name, is_admin, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );

    const response: ApiResponse = {
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        isAdmin: row.is_admin,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get users error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch users',
    };
    res.status(500).json(response);
  }
});

// Get site statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get user count
    const usersResult = await db.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(usersResult.rows[0].count);

    // Get product count
    const productsResult = await db.query('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE');
    const productCount = parseInt(productsResult.rows[0].count);

    // Get order stats
    const ordersResult = await db.query(`
      SELECT
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM orders
    `);
    const orderStats = ordersResult.rows[0];

    // Get recent orders
    const recentOrdersResult = await db.query(`
      SELECT o.id, o.status, o.total_amount, o.created_at, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    // Get low stock products
    const lowStockResult = await db.query(`
      SELECT id, name, stock_quantity, low_stock_threshold
      FROM products
      WHERE is_active = TRUE AND stock_quantity <= low_stock_threshold
      ORDER BY stock_quantity ASC
      LIMIT 10
    `);

    // Get users registered per day (last 7 days)
    const userGrowthResult = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Get orders per day (last 7 days)
    const orderGrowthResult = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    const response: ApiResponse = {
      success: true,
      data: {
        overview: {
          totalUsers: userCount,
          totalProducts: productCount,
          totalOrders: parseInt(orderStats.total_orders),
          pendingOrders: parseInt(orderStats.pending_orders),
          completedOrders: parseInt(orderStats.completed_orders),
          totalRevenue: parseFloat(orderStats.total_revenue),
        },
        recentOrders: recentOrdersResult.rows.map(row => ({
          id: row.id,
          status: row.status,
          totalAmount: parseFloat(row.total_amount),
          createdAt: row.created_at,
          userName: row.user_name,
          userEmail: row.user_email,
        })),
        lowStockProducts: lowStockResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          stockQuantity: row.stock_quantity,
          lowStockThreshold: row.low_stock_threshold,
        })),
        userGrowth: userGrowthResult.rows,
        orderGrowth: orderGrowthResult.rows,
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get stats error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch statistics',
    };
    res.status(500).json(response);
  }
});

// Update user admin status
router.patch('/users/:id/admin', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;

    const result = await db.query(
      `UPDATE users SET is_admin = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, name, is_admin`,
      [isAdmin, id]
    );

    if (result.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        name: result.rows[0].name,
        isAdmin: result.rows[0].is_admin,
      },
      message: 'User admin status updated',
    };

    res.json(response);
  } catch (error: any) {
    console.error('Update user admin error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update user',
    };
    res.status(500).json(response);
  }
});

// Delete user
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Don't allow deleting yourself
    if (req.user?.userId === id) {
      const response: ApiResponse = {
        success: false,
        error: 'Cannot delete your own account',
      };
      return res.status(400).json(response);
    }

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'User deleted successfully',
    };

    res.json(response);
  } catch (error: any) {
    console.error('Delete user error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete user',
    };
    res.status(500).json(response);
  }
});

// ============================================
// ORDERS MANAGEMENT
// ============================================

// Get all orders with details
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT
        o.id, o.order_number, o.status, o.payment_status, o.payment_method,
        o.total_amount, o.created_at, o.updated_at,
        o.shipping_full_name, o.shipping_address, o.shipping_city,
        o.shipping_state, o.shipping_zip_code, o.shipping_country,
        u.id as user_id, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      result.rows.map(async (order) => {
        const itemsResult = await db.query(
          `SELECT product_name, product_icon, quantity, unit_price, total_price
           FROM order_items WHERE order_id = $1`,
          [order.id]
        );
        return {
          id: order.id,
          orderNumber: order.order_number,
          status: order.status,
          paymentStatus: order.payment_status,
          paymentMethod: order.payment_method,
          totalAmount: parseFloat(order.total_amount),
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          user: {
            id: order.user_id,
            name: order.user_name,
            email: order.user_email,
          },
          shipping: {
            fullName: order.shipping_full_name,
            address: order.shipping_address,
            city: order.shipping_city,
            state: order.shipping_state,
            zipCode: order.shipping_zip_code,
            country: order.shipping_country,
          },
          items: itemsResult.rows.map(item => ({
            productName: item.product_name,
            productIcon: item.product_icon,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unit_price),
            totalPrice: parseFloat(item.total_price),
          })),
        };
      })
    );

    const response: ApiResponse = {
      success: true,
      data: ordersWithItems,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get orders error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch orders',
    };
    res.status(500).json(response);
  }
});

// Update order status
router.patch('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
    }

    const result = await db.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Order status updated',
    });
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status',
    });
  }
});

// ============================================
// DOWNLOAD LOGS (tracks all downloads including "Steal It" AND Free VSTs)
// ============================================

// Get comprehensive download statistics
router.get('/download-stats', async (req: Request, res: Response) => {
  try {
    // Get free VST download counts from free_downloads table
    const freeVSTStats = await db.query(`
      SELECT
        fd.name,
        fd.filename,
        fd.download_count as total_downloads,
        'free_vst' as download_type
      FROM free_downloads fd
      WHERE fd.is_active = TRUE
      ORDER BY fd.download_count DESC
    `);

    // Get "Steal It" product download counts from traffic_logs
    const stealItStats = await db.query(`
      SELECT
        REPLACE(tl.path, '/downloads/', '') as filename,
        COUNT(*) as total_downloads,
        COUNT(DISTINCT tl.ip_address) as unique_ips,
        'steal_it' as download_type
      FROM traffic_logs tl
      WHERE tl.path LIKE '/downloads/%'
        AND tl.status_code = 200
        AND NOT EXISTS (
          SELECT 1 FROM free_downloads fd
          WHERE fd.filename = REPLACE(tl.path, '/downloads/', '')
        )
      GROUP BY tl.path
      ORDER BY total_downloads DESC
    `);

    const response: ApiResponse = {
      success: true,
      data: {
        freeVSTs: freeVSTStats.rows,
        stealItDownloads: stealItStats.rows,
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get download stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch download statistics',
    });
  }
});

// Get download logs with enhanced IP tracking and categorization
router.get('/download-logs', async (req: Request, res: Response) => {
  try {
    // Get logs from traffic_logs where path contains /downloads/
    // Join with free_downloads to determine if it's a free VST or "Steal It"
    const result = await db.query(`
      SELECT
        tl.id, tl.timestamp, tl.path, tl.ip_address, tl.user_agent,
        tl.user_id, tl.method, tl.status_code,
        u.name as user_name, u.email as user_email,
        fd.name as free_vst_name,
        CASE WHEN fd.id IS NOT NULL THEN 'free_vst' ELSE 'steal_it' END as download_type
      FROM traffic_logs tl
      LEFT JOIN users u ON tl.user_id = u.id
      LEFT JOIN free_downloads fd ON fd.filename = REPLACE(tl.path, '/downloads/', '')
      WHERE tl.path LIKE '/downloads/%' AND tl.status_code = 200
      ORDER BY tl.timestamp DESC
      LIMIT 200
    `);

    const logs = result.rows.map(row => {
      const filename = row.path.replace('/downloads/', '');
      // Parse user agent to detect bots
      const ua = row.user_agent || '';
      const isBot = /bot|crawler|spider|scraper/i.test(ua);

      // Extract browser info
      let browser = 'Unknown';
      if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
      else if (ua.includes('Edg')) browser = 'Edge';

      return {
        id: row.id,
        timestamp: row.timestamp,
        filename: filename,
        productName: row.free_vst_name || filename.replace('.zip', ''),
        downloadType: row.download_type, // 'free_vst' or 'steal_it'
        ipAddress: row.ip_address,
        fullIpAddress: row.ip_address, // Keep full IP for admin
        userAgent: row.user_agent,
        browser: browser,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        isGuest: !row.user_id,
        isBot: isBot,
        method: row.method,
      };
    });

    // Get download counts per file with unique IP tracking and categorization
    const countsResult = await db.query(`
      SELECT
        REPLACE(tl.path, '/downloads/', '') as filename,
        COALESCE(fd.name, REPLACE(tl.path, '/downloads/', '')) as product_name,
        COUNT(*) as count,
        COUNT(CASE WHEN tl.user_id IS NULL THEN 1 END) as guest_count,
        COUNT(DISTINCT tl.ip_address) as unique_ips,
        COUNT(DISTINCT CASE WHEN tl.user_id IS NULL THEN tl.ip_address END) as unique_pirate_ips,
        CASE WHEN fd.id IS NOT NULL THEN 'free_vst' ELSE 'steal_it' END as download_type
      FROM traffic_logs tl
      LEFT JOIN free_downloads fd ON fd.filename = REPLACE(tl.path, '/downloads/', '')
      WHERE tl.path LIKE '/downloads/%' AND tl.status_code = 200
      GROUP BY tl.path, fd.name, fd.id
      ORDER BY count DESC
    `);

    const response: ApiResponse = {
      success: true,
      data: {
        logs: logs,
        counts: countsResult.rows.map(row => ({
          filename: row.filename,
          productName: row.product_name,
          downloadType: row.download_type, // 'free_vst' or 'steal_it'
          totalDownloads: parseInt(row.count),
          guestDownloads: parseInt(row.guest_count),
          uniqueIPs: parseInt(row.unique_ips),
          uniquePirateIPs: parseInt(row.unique_pirate_ips),
        })),
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get download logs error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch download logs',
    };
    res.status(500).json(response);
  }
});

// ============================================
// FREE DOWNLOADS MANAGEMENT
// ============================================

// Get all free downloads (admin)
router.get('/downloads', async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, name, slug, description, version, file_size, filename, platform, download_count, is_active, created_at, updated_at
       FROM free_downloads
       ORDER BY created_at DESC`
    );

    const response: ApiResponse = {
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        version: row.version,
        fileSize: row.file_size,
        filename: row.filename,
        platform: row.platform,
        downloadCount: row.download_count,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get free downloads error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch free downloads',
    };
    res.status(500).json(response);
  }
});

// Create free download
router.post('/downloads', async (req: Request, res: Response) => {
  try {
    const { name, description, version, fileSize, filename, platform } = req.body;

    if (!name || !filename) {
      const response: ApiResponse = {
        success: false,
        error: 'Name and filename are required',
      };
      return res.status(400).json(response);
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await db.query(
      `INSERT INTO free_downloads (name, slug, description, version, file_size, filename, platform)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, slug, description || '', version || '1.0.0', fileSize || '', filename, platform || ['Windows']]
    );

    const row = result.rows[0];
    const response: ApiResponse = {
      success: true,
      data: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        version: row.version,
        fileSize: row.file_size,
        filename: row.filename,
        platform: row.platform,
        downloadCount: row.download_count,
        isActive: row.is_active,
        createdAt: row.created_at,
      },
      message: 'Free download created successfully',
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Create free download error:', error);
    if (error.code === '23505') {
      const response: ApiResponse = {
        success: false,
        error: 'A download with this name already exists',
      };
      return res.status(400).json(response);
    }
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create free download',
    };
    res.status(500).json(response);
  }
});

// Update free download
router.put('/downloads/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, version, fileSize, filename, platform, isActive } = req.body;

    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined;

    const result = await db.query(
      `UPDATE free_downloads
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           version = COALESCE($4, version),
           file_size = COALESCE($5, file_size),
           filename = COALESCE($6, filename),
           platform = COALESCE($7, platform),
           is_active = COALESCE($8, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [name, slug, description, version, fileSize, filename, platform, isActive, id]
    );

    if (result.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Download not found',
      };
      return res.status(404).json(response);
    }

    const row = result.rows[0];
    const response: ApiResponse = {
      success: true,
      data: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        version: row.version,
        fileSize: row.file_size,
        filename: row.filename,
        platform: row.platform,
        downloadCount: row.download_count,
        isActive: row.is_active,
        updatedAt: row.updated_at,
      },
      message: 'Download updated successfully',
    };

    res.json(response);
  } catch (error: any) {
    console.error('Update free download error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update download',
    };
    res.status(500).json(response);
  }
});

// Delete free download
router.delete('/downloads/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM free_downloads WHERE id = $1 RETURNING id, name', [id]);

    if (result.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Download not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: `Download "${result.rows[0].name}" deleted successfully`,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Delete free download error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete download',
    };
    res.status(500).json(response);
  }
});

// ============================================
// NETWORK TRAFFIC MONITORING
// ============================================

// Get comprehensive traffic statistics from database
router.get('/traffic/stats', async (req: Request, res: Response) => {
  try {
    // Get total requests
    const totalResult = await db.query('SELECT COUNT(*) as count FROM traffic_logs');
    const totalRequests = parseInt(totalResult.rows[0].count);

    // Get unique visitors (unique IPs)
    const uniqueResult = await db.query('SELECT COUNT(DISTINCT ip_address) as count FROM traffic_logs');
    const uniqueVisitors = parseInt(uniqueResult.rows[0].count);

    // Get requests in different time windows
    const timeWindowsResult = await db.query(`
      SELECT
        COUNT(CASE WHEN timestamp >= NOW() - INTERVAL '1 minute' THEN 1 END) as last_minute,
        COUNT(CASE WHEN timestamp >= NOW() - INTERVAL '1 hour' THEN 1 END) as last_hour,
        COUNT(CASE WHEN timestamp >= NOW() - INTERVAL '1 day' THEN 1 END) as today
      FROM traffic_logs
    `);
    const timeWindows = timeWindowsResult.rows[0];

    // Get average response time
    const avgResult = await db.query('SELECT AVG(response_time) as avg FROM traffic_logs');
    const avgResponseTime = Math.round(parseFloat(avgResult.rows[0].avg) || 0);

    // Get method counts
    const methodResult = await db.query(`
      SELECT method, COUNT(*) as count
      FROM traffic_logs
      GROUP BY method
      ORDER BY count DESC
    `);
    const methodCounts: Record<string, number> = {};
    methodResult.rows.forEach(row => {
      methodCounts[row.method] = parseInt(row.count);
    });

    // Get status code distribution
    const statusResult = await db.query(`
      SELECT
        CASE
          WHEN status_code < 200 THEN '1xx'
          WHEN status_code < 300 THEN '2xx'
          WHEN status_code < 400 THEN '3xx'
          WHEN status_code < 500 THEN '4xx'
          ELSE '5xx'
        END as status_group,
        COUNT(*) as count
      FROM traffic_logs
      GROUP BY status_group
      ORDER BY status_group
    `);
    const statusCounts: Record<string, number> = {};
    statusResult.rows.forEach(row => {
      statusCounts[row.status_group] = parseInt(row.count);
    });

    // Get top paths (normalize by removing UUIDs and IDs)
    const pathResult = await db.query(`
      SELECT
        regexp_replace(
          regexp_replace(path, '/[a-f0-9-]{36}', '/:id', 'g'),
          '/[0-9]+', '/:id', 'g'
        ) as normalized_path,
        COUNT(*) as count,
        ROUND(AVG(response_time)) as avg_response_time
      FROM traffic_logs
      GROUP BY normalized_path
      ORDER BY count DESC
      LIMIT 10
    `);
    const topPaths = pathResult.rows.map(row => ({
      path: row.normalized_path,
      count: parseInt(row.count),
      avgResponseTime: parseInt(row.avg_response_time),
    }));

    // Get authenticated vs guest traffic
    const authResult = await db.query(`
      SELECT
        COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as authenticated,
        COUNT(CASE WHEN user_id IS NULL THEN 1 END) as guest
      FROM traffic_logs
    `);
    const authVsGuest = {
      authenticated: parseInt(authResult.rows[0].authenticated),
      guest: parseInt(authResult.rows[0].guest),
    };

    const stats = {
      totalRequests,
      uniqueVisitors,
      requestsLastMinute: parseInt(timeWindows.last_minute),
      requestsLastHour: parseInt(timeWindows.last_hour),
      requestsToday: parseInt(timeWindows.today),
      avgResponseTime,
      methodCounts,
      statusCounts,
      topPaths,
      authenticatedVsGuest: authVsGuest,
    };

    const response: ApiResponse = {
      success: true,
      data: stats,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get traffic stats error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch traffic stats',
    };
    res.status(500).json(response);
  }
});

// Get recent request logs with pagination
router.get('/traffic/logs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await db.query(`
      SELECT
        tl.id,
        tl.timestamp,
        tl.method,
        tl.path,
        tl.status_code,
        tl.response_time,
        tl.ip_address,
        tl.user_agent,
        tl.user_id,
        u.name as user_name
      FROM traffic_logs tl
      LEFT JOIN users u ON tl.user_id = u.id
      ORDER BY tl.timestamp DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const logs = result.rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      method: row.method,
      path: row.path,
      statusCode: row.status_code,
      responseTime: row.response_time,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      userId: row.user_id,
      userName: row.user_name,
    }));

    const response: ApiResponse = {
      success: true,
      data: logs,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get traffic logs error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch traffic logs',
    };
    res.status(500).json(response);
  }
});

// Get traffic trends over time (time-series data for charts)
router.get('/traffic/trends', async (req: Request, res: Response) => {
  try {
    const interval = (req.query.interval as string) || 'hourly';

    let query: string;
    if (interval === 'hourly') {
      // Last 24 hours
      query = `
        SELECT
          date_trunc('hour', timestamp) as time_bucket,
          COUNT(*) as request_count,
          ROUND(AVG(response_time)) as avg_response_time,
          COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
        FROM traffic_logs
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY time_bucket
        ORDER BY time_bucket ASC
      `;
    } else if (interval === 'daily') {
      // Last 30 days
      query = `
        SELECT
          date_trunc('day', timestamp) as time_bucket,
          COUNT(*) as request_count,
          ROUND(AVG(response_time)) as avg_response_time,
          COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
        FROM traffic_logs
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY time_bucket
        ORDER BY time_bucket ASC
      `;
    } else {
      throw new Error('Invalid interval. Use "hourly" or "daily"');
    }

    const result = await db.query(query);

    const trends = result.rows.map(row => ({
      timestamp: row.time_bucket,
      requestCount: parseInt(row.request_count),
      avgResponseTime: parseInt(row.avg_response_time),
      errorCount: parseInt(row.error_count),
    }));

    const response: ApiResponse = {
      success: true,
      data: trends,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get traffic trends error:', error);
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Failed to fetch traffic trends',
    };
    res.status(500).json(response);
  }
});

// Clean up old traffic logs (data retention)
router.post('/traffic/cleanup', async (req: Request, res: Response) => {
  try {
    const daysToKeep = parseInt(req.body.daysToKeep as string) || 30;

    const result = await db.query(
      'DELETE FROM traffic_logs WHERE timestamp < NOW() - INTERVAL $1 days RETURNING id',
      [`${daysToKeep}`]
    );

    const response: ApiResponse = {
      success: true,
      message: `Deleted ${result.rowCount} old traffic logs`,
      data: { deleted: result.rowCount },
    };

    res.json(response);
  } catch (error: any) {
    console.error('Clean up traffic logs error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to clean up traffic logs',
    };
    res.status(500).json(response);
  }
});

// Clear all traffic logs (for testing or manual cleanup)
router.delete('/traffic/logs', async (req: Request, res: Response) => {
  try {
    // Clear in-memory logs
    clearRequestLogs();

    // Optionally clear database logs too (commented out for safety)
    // await db.query('DELETE FROM traffic_logs');

    const response: ApiResponse = {
      success: true,
      message: 'In-memory traffic logs cleared',
    };

    res.json(response);
  } catch (error: any) {
    console.error('Clear traffic logs error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to clear traffic logs',
    };
    res.status(500).json(response);
  }
});

// Get admin traffic logs (separate from regular user/guest monitoring)
router.get('/traffic/admin', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db.query('SELECT COUNT(*) as count FROM admin_traffic_logs');
    const total = parseInt(countResult.rows[0].count);

    // Get paginated admin traffic
    const result = await db.query(`
      SELECT
        atl.id,
        atl.timestamp,
        atl.method,
        atl.path,
        atl.status_code,
        atl.response_time,
        atl.ip_address,
        atl.user_agent,
        atl.admin_email,
        u.name as admin_name
      FROM admin_traffic_logs atl
      LEFT JOIN users u ON atl.user_id = u.id
      ORDER BY atl.timestamp DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const response: ApiResponse = {
      success: true,
      data: {
        logs: result.rows.map(row => ({
          id: row.id,
          timestamp: row.timestamp,
          method: row.method,
          path: row.path,
          statusCode: row.status_code,
          responseTime: row.response_time,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          adminEmail: row.admin_email,
          adminName: row.admin_name,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get admin traffic logs error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch admin traffic logs',
    };
    res.status(500).json(response);
  }
});

// ============================================
// SECURITY / VOID TRAP
// ============================================

// Get blacklist status and banned IPs
router.get('/security/blacklist', (req: Request, res: Response) => {
  const status = getBlacklistStatus();
  res.json({ success: true, data: status });
});

// Manually ban an IP
router.post('/security/ban', (req: Request, res: Response) => {
  const { ip, reason } = req.body;
  if (!ip) {
    return res.status(400).json({ success: false, error: 'IP address required' });
  }
  manualBan(ip, reason || 'Manual admin ban');
  res.json({ success: true, message: `IP ${ip} banned for 30 minutes` });
});

// Unban an IP
router.delete('/security/ban/:ip', (req: Request, res: Response) => {
  const { ip } = req.params;
  const removed = manualUnban(ip);
  if (removed) {
    res.json({ success: true, message: `IP ${ip} unbanned` });
  } else {
    res.status(404).json({ success: false, error: 'IP not found in blacklist' });
  }
});

// Get trapped requests (honeypot hits logged as status 418)
router.get('/security/trapped', async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT ip_address, path, timestamp, user_agent
      FROM traffic_logs
      WHERE status_code = 418
      ORDER BY timestamp DESC
      LIMIT 100
    `);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch trapped requests' });
  }
});

// Get smart threat alerts (credential stuffing, ban evasion, admin honeypot, IP rotation)
router.get('/security/alerts', (req: Request, res: Response) => {
  res.json({ success: true, data: getAlerts() });
});

// Dismiss a specific alert
router.delete('/security/alerts/:id', (req: Request, res: Response) => {
  const dismissed = dismissAlert(req.params.id);
  if (dismissed) {
    res.json({ success: true, message: 'Alert dismissed' });
  } else {
    res.status(404).json({ success: false, error: 'Alert not found' });
  }
});

// Dismiss all alerts
router.delete('/security/alerts', (req: Request, res: Response) => {
  const count = dismissAllAlerts();
  res.json({ success: true, message: `Dismissed ${count} alerts` });
});

// Honeypot hit heatmap — top paths that got trapped
router.get('/security/honeypot-heatmap', async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT path, COUNT(*) as hits, MAX(timestamp) as last_hit
      FROM traffic_logs
      WHERE method IN ('TRAPPED', 'CRED_HARVEST')
      GROUP BY path
      ORDER BY hits DESC
      LIMIT 20
    `);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch heatmap data' });
  }
});

// Recent attack timeline — attack events in the last 24 hours grouped by hour
router.get('/security/attack-timeline', async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT
        date_trunc('hour', timestamp) as hour,
        COUNT(*) FILTER (WHERE method = 'TRAPPED') as honeypot_hits,
        COUNT(*) FILTER (WHERE status_code = 429) as rate_limit_hits,
        COUNT(*) FILTER (WHERE status_code = 403) as blocked_requests,
        COUNT(*) FILTER (WHERE method = 'CRED_HARVEST') as cred_harvests
      FROM traffic_logs
      WHERE timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch attack timeline' });
  }
});

// Harvested WP honeypot credentials — stored in memory, cleared on demand
router.get('/security/cred-harvests', protect, admin, (_req: Request, res: Response) => {
  res.json({ success: true, data: getCredHarvests() });
});

router.delete('/security/cred-harvests', protect, admin, (_req: Request, res: Response) => {
  const count = clearCredHarvests();
  res.json({ success: true, message: `Cleared ${count} credential harvest entries` });
});

// ============================================
// PRODUCT MANAGEMENT (admin)
// ============================================

// List all products (including inactive) with all fields
router.get('/products', async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, name, slug, category, product_type, price, description, icon,
              image_url, is_active, stock_quantity, download_url, file_size_mb,
              metadata, preview_url, license_type, created_at, updated_at
       FROM products
       ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      productType: row.product_type,
      price: parseFloat(row.price),
      description: row.description,
      icon: row.icon,
      imageUrl: row.image_url,
      isActive: row.is_active,
      stock: row.stock_quantity,
      downloadUrl: row.download_url,
      fileSizeMb: row.file_size_mb,
      metadata: row.metadata,
      previewUrl: row.preview_url,
      licenseType: row.license_type,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// Create a product
router.post('/products', async (req: Request, res: Response) => {
  try {
    const { name, category, productType, price, description, icon, imageUrl,
            stock, downloadUrl, fileSizeMb, licenseType, metadata } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ success: false, error: 'name, category, and price are required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const result = await db.query(
      `INSERT INTO products (name, slug, category, product_type, price, description, icon,
         image_url, stock_quantity, low_stock_threshold, download_url, file_size_mb,
         license_type, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,10,$10,$11,$12,$13)
       RETURNING *`,
      [
        name, slug, category, productType || 'digital', price,
        description || '', icon || '📦', imageUrl || null,
        stock !== undefined ? stock : (productType === 'digital' ? 99999 : 0),
        downloadUrl || null, fileSizeMb || null,
        licenseType || 'royalty-free', JSON.stringify(metadata || {}),
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Product created' });
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

// Update a product (all fields including license_type, metadata for bpm/key)
router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: string[] = [];
    const values: any[] = [];
    let p = 1;

    const fields: Record<string, string> = {
      name: 'name', category: 'category', price: 'price',
      description: 'description', icon: 'icon', imageUrl: 'image_url',
      stock: 'stock_quantity', downloadUrl: 'download_url', fileSizeMb: 'file_size_mb',
      licenseType: 'license_type', productType: 'product_type', isActive: 'is_active',
    };

    for (const [key, col] of Object.entries(fields)) {
      if (req.body[key] !== undefined) {
        updates.push(`${col} = $${p++}`);
        values.push(req.body[key]);
      }
    }

    // Merge metadata (bpm, musical_key, pricing_variants, etc.)
    if (req.body.metadata !== undefined) {
      updates.push(`metadata = $${p++}`);
      values.push(JSON.stringify(req.body.metadata));
    }

    if (req.body.name !== undefined) {
      updates.push(`slug = $${p++}`);
      values.push(req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await db.query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $${p} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Product updated' });
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

// Upload audio preview for a product
router.post('/products/:id/preview', (req: Request, res: Response) => {
  audioUpload.single('preview')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file uploaded' });
    }

    const { id } = req.params;
    const previewUrl = `/uploads/previews/${req.file.filename}`;

    try {
      // Delete old preview file if one existed
      const existing = await db.query('SELECT preview_url FROM products WHERE id = $1', [id]);
      if (existing.rows.length > 0 && existing.rows[0].preview_url) {
        const oldFile = path.join(PREVIEWS_DIR, path.basename(existing.rows[0].preview_url));
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }

      await db.query('UPDATE products SET preview_url = $1, updated_at = NOW() WHERE id = $2', [previewUrl, id]);
      res.json({ success: true, data: { previewUrl }, message: 'Preview uploaded' });
    } catch (error: any) {
      fs.unlinkSync(req.file.path);
      res.status(500).json({ success: false, error: 'Failed to save preview URL' });
    }
  });
});

// Delete audio preview for a product
router.delete('/products/:id/preview', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT preview_url FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const previewUrl = result.rows[0].preview_url;
    if (previewUrl) {
      const filePath = path.join(PREVIEWS_DIR, path.basename(previewUrl));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.query('UPDATE products SET preview_url = NULL, updated_at = NOW() WHERE id = $1', [id]);
    res.json({ success: true, message: 'Preview deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to delete preview' });
  }
});

// ============================================
// PROMO CODES (admin)
// ============================================

router.get('/promo', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, code, discount_type, discount_value, max_uses, used_count,
              expires_at, is_active, created_at
       FROM promo_codes ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows.map(r => ({
      id: r.id, code: r.code, discountType: r.discount_type,
      discountValue: parseFloat(r.discount_value), maxUses: r.max_uses,
      usedCount: r.used_count, expiresAt: r.expires_at,
      isActive: r.is_active, createdAt: r.created_at,
    })) });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch promo codes' });
  }
});

router.post('/promo', async (req: Request, res: Response) => {
  try {
    const { code, discountType, discountValue, maxUses, expiresAt } = req.body;
    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ success: false, error: 'code, discountType, and discountValue are required' });
    }
    if (!['percent', 'fixed'].includes(discountType)) {
      return res.status(400).json({ success: false, error: 'discountType must be percent or fixed' });
    }
    const result = await db.query(
      `INSERT INTO promo_codes (code, discount_type, discount_value, max_uses, expires_at)
       VALUES (UPPER($1), $2, $3, $4, $5) RETURNING *`,
      [code, discountType, discountValue, maxUses || null, expiresAt || null]
    );
    const r = result.rows[0];
    res.status(201).json({ success: true, data: {
      id: r.id, code: r.code, discountType: r.discount_type,
      discountValue: parseFloat(r.discount_value), maxUses: r.max_uses,
      usedCount: r.used_count, expiresAt: r.expires_at,
      isActive: r.is_active, createdAt: r.created_at,
    }, message: 'Promo code created' });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Promo code already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create promo code' });
  }
});

router.put('/promo/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, maxUses, expiresAt, isActive } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let p = 1;

    if (code !== undefined) { updates.push(`code = UPPER($${p++})`); values.push(code); }
    if (discountType !== undefined) { updates.push(`discount_type = $${p++}`); values.push(discountType); }
    if (discountValue !== undefined) { updates.push(`discount_value = $${p++}`); values.push(discountValue); }
    if (maxUses !== undefined) { updates.push(`max_uses = $${p++}`); values.push(maxUses); }
    if (expiresAt !== undefined) { updates.push(`expires_at = $${p++}`); values.push(expiresAt); }
    if (isActive !== undefined) { updates.push(`is_active = $${p++}`); values.push(isActive); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    values.push(id);

    const result = await db.query(
      `UPDATE promo_codes SET ${updates.join(', ')} WHERE id = $${p} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Promo code not found' });
    }
    const r = result.rows[0];
    res.json({ success: true, data: {
      id: r.id, code: r.code, discountType: r.discount_type,
      discountValue: parseFloat(r.discount_value), maxUses: r.max_uses,
      usedCount: r.used_count, expiresAt: r.expires_at, isActive: r.is_active,
    }, message: 'Promo code updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to update promo code' });
  }
});

router.delete('/promo/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.query('DELETE FROM promo_codes WHERE id = $1 RETURNING code', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Promo code not found' });
    }
    res.json({ success: true, message: `Promo code "${result.rows[0].code}" deleted` });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete promo code' });
  }
});

export default router;
