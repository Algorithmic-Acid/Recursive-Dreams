
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/postgres';
import productRoutes from './routes/products';
import authRoutes from './routes/auth';
import orderRoutes from './routes/orders';
import inventoryRoutes from './routes/inventory';

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
app.use('/api/inventory', inventoryRoutes);

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
