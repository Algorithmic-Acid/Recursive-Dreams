import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../config/postgres';
import { protect } from '../middleware/auth';
import { verifyToken, generateDownloadToken, verifyDownloadToken } from '../utils/jwt';
import { ApiResponse } from '../types';

// Middleware that supports: HttpOnly cookie, Authorization header, or signed ?dltoken= param
const authForDownload = (req: Request, res: Response, next: NextFunction) => {
  const productId = req.params.productId;

  // 1. Short-lived signed download token (preferred for direct links)
  if (req.query.dltoken) {
    const verified = verifyDownloadToken(req.query.dltoken as string, productId);
    if (!verified) {
      return res.status(401).json({ success: false, error: 'Download link expired or invalid' });
    }
    req.user = { userId: verified.userId, email: '', role: 'user' };
    return next();
  }

  // 2. HttpOnly cookie or Authorization header (for in-app downloads)
  let token: string | undefined = req.cookies?.token;
  if (!token) token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Authentication required' });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ success: false, error: 'Invalid token' });

  req.user = decoded;
  next();
};

const router = express.Router();

// Get user's purchased downloads
router.get('/my-downloads', protect, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get all products the user has purchased
    const result = await db.query(`
      SELECT DISTINCT
        p.id,
        p.name,
        p.icon,
        p.metadata,
        oi.created_at as purchased_at
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      WHERE o.user_id = $1
        AND o.payment_status = 'paid'
        AND p.metadata->>'is_downloadable' = 'true'
      ORDER BY oi.created_at DESC
    `, [userId]);

    const downloads = result.rows.map(row => ({
      productId: row.id,
      name: row.name,
      icon: row.icon,
      downloadFile: row.metadata?.download_file,
      purchasedAt: row.purchased_at,
    }));

    const response: ApiResponse = {
      success: true,
      data: downloads,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get downloads error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch downloads',
    };
    res.status(500).json(response);
  }
});

// Check if user has access to a specific download
router.get('/check/:productId', protect, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;

    // Check if user has purchased this product
    const result = await db.query(`
      SELECT
        p.id,
        p.name,
        p.metadata
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      WHERE o.user_id = $1
        AND oi.product_id = $2
        AND o.payment_status = 'paid'
      LIMIT 1
    `, [userId, productId]);

    if (result.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'You have not purchased this product',
      };
      return res.status(403).json(response);
    }

    const product = result.rows[0];
    const downloadFile = product.metadata?.download_file;

    if (!downloadFile) {
      const response: ApiResponse = {
        success: false,
        error: 'This product is not available for download',
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        hasAccess: true,
        productName: product.name,
        downloadFile: downloadFile,
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('Check download access error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to check download access',
    };
    res.status(500).json(response);
  }
});

// Generate a signed, time-limited download link for a purchased product
router.get('/link/:productId', protect, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;

    // Verify user has purchased this product
    const result = await db.query(`
      SELECT p.id, p.name, p.metadata
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      WHERE o.user_id = $1
        AND oi.product_id = $2
        AND o.payment_status = 'paid'
      LIMIT 1
    `, [userId, productId]);

    if (result.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'You have not purchased this product' });
    }

    const product = result.rows[0];
    if (!product.metadata?.download_file) {
      return res.status(400).json({ success: false, error: 'This product is not available for download' });
    }

    const token = generateDownloadToken(userId, productId, 60); // 60-minute TTL
    const downloadUrl = `/api/downloads/file/${productId}?dltoken=${token}`;

    res.json({ success: true, data: { downloadUrl, expiresIn: 3600 } });
  } catch (error: any) {
    console.error('Generate download link error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate download link' });
  }
});

// Download a purchased product (supports query param token for direct links)
router.get('/file/:productId', authForDownload, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;

    // Verify user has purchased this product
    const result = await db.query(`
      SELECT
        p.id,
        p.name,
        p.metadata
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      WHERE o.user_id = $1
        AND oi.product_id = $2
        AND o.payment_status = 'paid'
      LIMIT 1
    `, [userId, productId]);

    if (result.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'You have not purchased this product',
      };
      return res.status(403).json(response);
    }

    const product = result.rows[0];
    const downloadFile = product.metadata?.download_file;

    if (!downloadFile) {
      const response: ApiResponse = {
        success: false,
        error: 'This product is not available for download',
      };
      return res.status(400).json(response);
    }

    // Construct file path - downloads are stored in /home/wes/voidvendor-downloads/
    const downloadsDir = process.env.DOWNLOADS_DIR || '/home/wes/voidvendor-downloads';
    const filePath = path.join(downloadsDir, downloadFile);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Download file not found: ${filePath}`);
      const response: ApiResponse = {
        success: false,
        error: 'Download file not found. Please contact support.',
      };
      return res.status(404).json(response);
    }

    // Log download
    console.log(`User ${userId} downloading: ${product.name} (${downloadFile})`);

    // Send file
    res.download(filePath, downloadFile, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to download file',
          });
        }
      }
    });
  } catch (error: any) {
    console.error('Download file error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to process download',
    };
    res.status(500).json(response);
  }
});

export default router;
