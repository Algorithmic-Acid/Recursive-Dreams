import express, { Request, Response } from 'express';
import productService from '../services/productServicePg';
import { db } from '../config/postgres';
import { ApiResponse } from '../types';

const router = express.Router();

// ============================================
// FREE DOWNLOADS (Public) - Must be before /:id route!
// ============================================

// Get all active free downloads (public)
router.get('/free-downloads/list', async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, name, slug, description, version, file_size, filename, platform, download_count
       FROM free_downloads
       WHERE is_active = TRUE
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

// Enhanced IP extraction function (same as requestLogger)
const getClientIP = (req: Request): string => {
  const cfIP = req.headers['cf-connecting-ip'] as string;
  if (cfIP) return cfIP.trim();

  const realIP = req.headers['x-real-ip'] as string;
  if (realIP) return realIP.trim();

  const forwardedFor = req.headers['x-forwarded-for'] as string;
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (req.ip) return req.ip;

  const socketIP = (req.socket as any)?.remoteAddress;
  if (socketIP) return socketIP;

  return 'unknown';
};

// Increment download count with detailed tracking (public)
router.post('/free-downloads/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Get the filename for logging
    const fileResult = await db.query(
      'SELECT name, filename FROM free_downloads WHERE id = $1',
      [id]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Download not found',
      });
    }

    const download = fileResult.rows[0];

    // Increment download count
    await db.query(
      'UPDATE free_downloads SET download_count = download_count + 1, updated_at = NOW() WHERE id = $1',
      [id]
    );

    // Log to traffic_logs for unified tracking (will be picked up by piracy tracker)
    await db.query(
      `INSERT INTO traffic_logs (timestamp, method, path, status_code, response_time, ip_address, user_agent, user_id)
       VALUES (NOW(), 'GET', $1, 200, 0, $2, $3, $4)`,
      [`/downloads/${download.filename}`, clientIP, userAgent.substring(0, 200), (req as any).user?.userId || null]
    );

    console.log(`📥 Free VST download: ${download.name} from IP: ${clientIP}`);

    const response: ApiResponse = {
      success: true,
      message: 'Download tracked',
      data: {
        filename: download.filename,
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('Track download error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to track download',
    };
    res.status(500).json(response);
  }
});

// ============================================
// PRODUCTS
// ============================================

// Get all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    let products;
    if (search && typeof search === 'string') {
      products = await productService.search(search);
    } else if (category && typeof category === 'string') {
      products = await productService.findByCategory(category);
    } else {
      products = await productService.findAll();
    }

    const response: ApiResponse = {
      success: true,
      data: products
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch products'
    };
    res.status(500).json(response);
  }
});

// Get product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await productService.findById(req.params.id);

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: 'Product not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: product
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch product'
    };
    res.status(500).json(response);
  }
});

// Create product (admin only - simplified for demo)
router.post('/', async (req: Request, res: Response) => {
  try {
    const product = await productService.create(req.body);

    const response: ApiResponse = {
      success: true,
      data: product,
      message: 'Product created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create product'
    };
    res.status(500).json(response);
  }
});

// Update product (admin only - simplified for demo)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const product = await productService.update(req.params.id, req.body);

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: 'Product not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: product,
      message: 'Product updated successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update product'
    };
    res.status(500).json(response);
  }
});

// Delete product (admin only - simplified for demo)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await productService.delete(req.params.id);

    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        error: 'Product not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Product deleted successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete product'
    };
    res.status(500).json(response);
  }
});

export default router;
