// Load environment variables FIRST - before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { db } from './config/postgres';
import { requestLogger, startTrafficLogCleanup } from './middleware/requestLogger';
import { voidTrap } from './middleware/voidTrap';
import productRoutes from './routes/products';
import authRoutes from './routes/auth';
import orderRoutes from './routes/orders';
import inventoryRoutes from './routes/inventory';
import adminRoutes from './routes/admin';
import paymentRoutes from './routes/payments';
import downloadRoutes from './routes/downloads';
import blogRoutes from './routes/blog';
import profileRoutes from './routes/profile';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS with multiple allowed origins
const allowedOrigins = [
  'https://voidvendor.com',
  'https://www.voidvendor.com',
  'http://localhost:5173',
  'http://localhost:3000',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// VOID TRAP - DDoS protection, honeypot, rate limiting (MUST be first)
app.use(voidTrap);

// Request logging middleware (stores last 100 requests in memory)
app.use(requestLogger);
app.use((req: Request, _res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Algorithmic Acid API',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      auth: '/api/auth',
      orders: '/api/orders',
      health: '/api/health'
    }
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/profile', profileRoutes);

// Avatar uploads - serve profile pictures
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/home/wes/voidvendor-uploads/avatars';
app.use('/uploads/avatars', express.static(UPLOADS_DIR, {
  dotfiles: 'deny',
  index: false,
  maxAge: '7d',
}));

// Public Downloads - "Steal It" button files (AFTER requestLogger for tracking)
const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || '/home/wes/voidvendor-downloads';
app.use('/downloads', express.static(DOWNLOADS_DIR, {
  dotfiles: 'deny',
  index: false,
  setHeaders: (res, filepath) => {
    // Log the download with enhanced IP tracking
    console.log(`📦 Public download: ${path.basename(filepath)}`);

    // Set download headers
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filepath)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error Handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize database
const initializeApp = async () => {
  try {
    // Connect to PostgreSQL
    await db.connect();

    // Initialize schema if needed (for development)
    if (process.env.INIT_SCHEMA === 'true') {
      console.log('Initializing database schema...');
      await db.initializeSchema();
      console.log('✅ Database schema initialized');
    }

    // Ensure free_downloads table exists and seed default VST plugins
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS free_downloads (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          version VARCHAR(50) DEFAULT '1.0.0',
          file_size VARCHAR(50),
          filename VARCHAR(255) NOT NULL,
          platform VARCHAR(100)[] DEFAULT ARRAY['Windows'],
          download_count INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.query('CREATE INDEX IF NOT EXISTS idx_free_downloads_active ON free_downloads(is_active)');
      await db.query('CREATE INDEX IF NOT EXISTS idx_free_downloads_slug ON free_downloads(slug)');

      // Seed free VST plugins
      const freeVSTs = [
        { name: 'Formant Filter', slug: 'formant-filter', description: 'Vowel-shaping formant filter for creating vocal-like resonances and electronic voice effects', version: '1.0.0', fileSize: '2.1 MB', filename: 'FormantFilter.zip' },
        { name: 'Lo-Fi Degrader', slug: 'lofi-degrader', description: 'Bit-crushing and sample rate reduction for vintage lo-fi vibes and retro digital textures', version: '1.0.0', fileSize: '1.8 MB', filename: 'LoFiDegrader.zip' },
        { name: 'Tape Wobble', slug: 'tape-wobble', description: 'Analog tape warble and flutter emulation for warm, nostalgic tape machine character', version: '1.0.0', fileSize: '1.9 MB', filename: 'TapeWobble.zip' },
        { name: 'GrainStorm', slug: 'grainstorm', description: 'Granular synthesis effect for transforming audio into evolving textures, glitches, and atmospheric soundscapes', version: '1.0.0', fileSize: '1.9 MB', filename: 'GrainStorm.zip' },
      ];

      for (const vst of freeVSTs) {
        await db.query(
          `INSERT INTO free_downloads (name, slug, description, version, file_size, filename, platform, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, ARRAY['Windows'], TRUE)
           ON CONFLICT (slug) DO NOTHING`,
          [vst.name, vst.slug, vst.description, vst.version, vst.fileSize, vst.filename]
        );
      }

      console.log('✅ Free downloads table ready');
    } catch (err) {
      console.log('Free downloads table check:', err);
    }

    // Start automatic traffic log cleanup (deletes logs older than 3 months)
    startTrafficLogCleanup();

    console.log('✅ PostgreSQL database ready');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    console.error('Make sure PostgreSQL is running and configured correctly in .env');
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await initializeApp();

  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   Algorithmic Acid API Server         ║
╠════════════════════════════════════════╣
║   Database: PostgreSQL + AI            ║
║   Environment: ${process.env.NODE_ENV || 'development'}               ║
║   Port: ${PORT}                           ║
║   URL: http://localhost:${PORT}           ║
╠════════════════════════════════════════╣
║   Inventory AI: ENABLED                ║
╚════════════════════════════════════════╝
    `);
  });
};

startServer();

export default app;
