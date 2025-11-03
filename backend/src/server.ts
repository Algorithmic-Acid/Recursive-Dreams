import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import productRoutes from './routes/products';
import authRoutes from './routes/auth';
import orderRoutes from './routes/orders';
import ProductModel from './models/Product';
import productService from './services/productService';
import { initialProducts } from './data/products';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
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

// Initialize database with seed data
const initializeApp = async () => {
  try {
    // Connect to MongoDB (falls back to in-memory if connection fails)
    await connectDatabase();

    // Get storage type
    const storageType = productService.getStorageType();
    console.log(`Using ${storageType} storage`);

    // Seed in-memory database if not using MongoDB
    if (storageType === 'In-Memory') {
      console.log('Initializing in-memory database with seed data...');
      await ProductModel.seed(initialProducts);
      console.log('In-memory database initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
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
║   Environment: ${process.env.NODE_ENV || 'development'}               ║
║   Port: ${PORT}                           ║
║   URL: http://localhost:${PORT}           ║
╚════════════════════════════════════════╝
    `);
  });
};

startServer();

export default app;
