# Quick Start Guide

Get your Algorithmic Acid e-commerce store running in 5 minutes!

## Step 1: Install Dependencies

Open **two terminal windows** in the project directory.

**Terminal 1 (Backend):**
```bash
cd backend
npm install
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
```

## Step 2: Set Up Environment Files

**Backend:**
```bash
cd backend
copy .env.example .env
```

**Frontend:**
```bash
cd frontend
copy .env.example .env
```

The default settings work out of the box for local development!

## Step 3: Start the Servers

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
╔════════════════════════════════════════╗
║   Algorithmic Acid API Server         ║
╠════════════════════════════════════════╣
║   Environment: development            ║
║   Port: 5000                          ║
║   URL: http://localhost:5000          ║
╚════════════════════════════════════════╝
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 4: Open Your Browser

Navigate to: **http://localhost:5173**

You should see your e-commerce store with 16 products ready to go!

## What You Can Do

1. **Browse Products** - View all 16 products across 5 categories
2. **Search** - Try searching for "code", "music", or "anime"
3. **Filter by Category** - Click on category links in the header
4. **Add to Cart** - Click "Add" on any product
5. **View Cart** - Click the shopping cart icon (top right)
6. **Adjust Quantities** - Use +/- buttons in the cart
7. **Test Checkout** - Click "Checkout" (demo mode)

## Verify Everything Works

### Test the Backend API
Open http://localhost:5000/api/health in your browser.

You should see:
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2025-..."
}
```

### Test Product API
Open http://localhost:5000/api/products

You should see JSON with all 16 products.

## Common Issues

### Backend won't start?
- Make sure nothing is using port 5000
- Check that Node.js is installed: `node --version`

### Frontend won't start?
- Make sure nothing is using port 5173
- Delete `node_modules` and run `npm install` again

### Products not loading?
- Make sure backend is running first
- Check browser console for errors
- Verify backend URL in frontend/.env

## Next Steps

1. **Customize Products** - Edit [backend/src/data/products.ts](backend/src/data/products.ts)
2. **Change Colors** - Edit [frontend/tailwind.config.js](frontend/tailwind.config.js)
3. **Add Features** - See README.md for full documentation

## Development Tips

- Both servers have **hot reload** - changes appear automatically
- Cart data **persists** in browser storage
- TypeScript provides **type safety** throughout
- All code is **well-commented** for easy learning

## Need Help?

Check the full [README.md](README.md) for:
- Detailed architecture
- API documentation
- Deployment guides
- Customization tips
- Troubleshooting

---

Happy coding! 🚀
