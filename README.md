# Algorithmic Acid - Full Stack E-Commerce Platform

A modern, full-stack e-commerce platform built with React, TypeScript, Node.js, and Express. Sells shirts, music, anime, video games, and software.

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management (shopping cart)
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database (with in-memory fallback)
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Mongoose** - ODM

## Project Structure

```
Algorithmic_Acid/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          # MongoDB connection
│   │   ├── data/
│   │   │   └── products.ts          # Product seed data
│   │   ├── middleware/
│   │   │   └── auth.ts              # JWT authentication
│   │   ├── models/
│   │   │   ├── Product.ts           # Product model
│   │   │   ├── User.ts              # User model
│   │   │   └── Order.ts             # Order model
│   │   ├── routes/
│   │   │   ├── products.ts          # Product routes
│   │   │   ├── auth.ts              # Auth routes
│   │   │   └── orders.ts            # Order routes
│   │   ├── services/
│   │   │   └── productService.ts    # Product service layer
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   ├── utils/
│   │   │   └── jwt.ts               # JWT utilities
│   │   └── server.ts                # Express server
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx           # Navigation & search
│   │   │   ├── Hero.tsx             # Hero section
│   │   │   ├── ProductCard.tsx      # Product display
│   │   │   ├── CartSidebar.tsx      # Shopping cart
│   │   │   ├── Checkout.tsx         # Checkout modal
│   │   │   └── Footer.tsx           # Footer
│   │   ├── services/
│   │   │   ├── api.ts               # API client
│   │   │   └── orderApi.ts          # Order API
│   │   ├── store/
│   │   │   ├── cartStore.ts         # Zustand cart store
│   │   │   └── authStore.ts         # Auth state
│   │   ├── types/
│   │   │   ├── index.ts             # TypeScript types
│   │   │   └── order.ts             # Order types
│   │   ├── App.tsx                  # Main app component
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.example
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Algorithmic-Acid/Recursive-Dreams.git
   cd Recursive-Dreams
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure Environment Variables**

   Backend (backend/.env):
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your settings (defaults work for development)

   Frontend (frontend/.env):
   ```bash
   cp .env.example .env
   ```

### Running the Application

You'll need two terminal windows:

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
```
Server runs on [http://localhost:5000](http://localhost:5000)

**Terminal 2 - Frontend Dev Server:**
```bash
cd frontend
npm run dev
```
Frontend runs on [http://localhost:5173](http://localhost:5173)

### Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## Features

### Implemented
- ✅ Product catalog with categories (Shirts, Music, Anime, Games, Software)
- ✅ Search functionality
- ✅ Category filtering
- ✅ Shopping cart with persistent storage
- ✅ User authentication (JWT)
- ✅ Order management system
- ✅ Stock management
- ✅ Checkout flow
- ✅ Order history
- ✅ Order cancellation
- ✅ Admin role system
- ✅ Real-time total calculation
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Toast notifications
- ✅ Modern UI with animations
- ✅ Type-safe with TypeScript
- ✅ RESTful API

### Coming Soon
- 🔲 Login/Register UI components
- 🔲 Payment processing (Stripe)
- 🔲 Order tracking page
- 🔲 User profile page
- 🔲 Product reviews
- 🔲 Admin dashboard
- 🔲 Image uploads
- 🔲 Email notifications

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products?category=shirts` - Get products by category
- `GET /api/products?search=query` - Search products
- `GET /api/products/:id` - Get single product

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Orders
- `POST /api/orders` - Create order (protected)
- `GET /api/orders/my-orders` - Get user's orders (protected)
- `GET /api/orders/:id` - Get single order (protected)
- `PATCH /api/orders/:id/cancel` - Cancel order (protected)
- `GET /api/orders` - Get all orders (admin only)
- `PATCH /api/orders/:id/status` - Update order status (admin only)

### Health
- `GET /api/health` - API health check

## Development

### Backend Scripts
```bash
npm run dev      # Development with hot reload
npm run build    # Compile TypeScript
npm start        # Run compiled code
npm run lint     # Lint code
npm run seed     # Seed database
```

### Frontend Scripts
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Lint code
```

## Customization

### Adding Products
Edit [backend/src/data/products.ts](backend/src/data/products.ts)

```typescript
{
  name: "Your Product",
  category: "shirts", // shirts | music | anime | games | software
  price: 29.99,
  description: "Product description",
  icon: "🎨",
  stock: 100
}
```

### Changing Colors
Edit [frontend/tailwind.config.js](frontend/tailwind.config.js)

```javascript
colors: {
  primary: {
    DEFAULT: '#6C63FF',  // Your primary color
  },
  secondary: {
    DEFAULT: '#FF6584',  // Your secondary color
  },
}
```

## Documentation

- [START_HERE.md](START_HERE.md) - Quick launch guide
- [QUICKSTART.md](QUICKSTART.md) - Detailed setup instructions
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [MONGODB_SETUP.md](MONGODB_SETUP.md) - MongoDB setup guide
- [PHASE_3_COMPLETE.md](PHASE_3_COMPLETE.md) - Order system documentation
- [PRODUCTION_ROADMAP.md](PRODUCTION_ROADMAP.md) - Feature roadmap

## Technologies Explained

### Why Zustand?
- Lightweight (< 1KB)
- Simple API
- Built-in persistence
- No boilerplate
- TypeScript support

### Why Vite?
- Extremely fast HMR
- Optimized builds
- Native ES modules
- Better DX than CRA

### Why Tailwind?
- Utility-first approach
- Responsive design
- Consistent styling
- No CSS naming conflicts

## Deployment

### Backend (Railway/Render/Heroku)
1. Push code to GitHub
2. Connect repository
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Push code to GitHub
2. Connect repository
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Set environment variables
6. Deploy

## Troubleshooting

### CORS Issues
Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL

### Port Already in Use
Change port in backend `.env` or frontend `vite.config.ts`

### API Connection Failed
- Ensure backend is running
- Check `VITE_API_URL` in frontend `.env`
- Verify network/firewall settings

## License
MIT

## Support
For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using React, TypeScript, and Node.js**
