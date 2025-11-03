# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              React Frontend (Port 5173)               │  │
│  │                                                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │   Header    │  │     Hero     │  │   Footer    │ │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘ │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │         Product Grid (ProductCard)           │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  │                                                       │  │
│  │  ┌──────────────┐                                    │  │
│  │  │ CartSidebar  │◄───── Zustand Store (Cart State)  │  │
│  │  └──────────────┘                                    │  │
│  │         ▲                                             │  │
│  └─────────┼─────────────────────────────────────────────┘  │
│            │                                                 │
│            │ HTTP Requests (Axios)                           │
│            │                                                 │
└────────────┼─────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│               Express Backend (Port 5000)                    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │                  server.ts                         │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │     │
│  │  │   CORS   │  │   JSON   │  │  Logger  │        │     │
│  │  └──────────┘  └──────────┘  └──────────┘        │     │
│  └────────────────────────────────────────────────────┘     │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │              API Routes                            │     │
│  │  /api/products (GET, POST, PUT, DELETE)           │     │
│  │  /api/health                                       │     │
│  └────────────────────────────────────────────────────┘     │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │            Product Model (In-Memory)               │     │
│  │  - findAll()                                       │     │
│  │  - findById()                                      │     │
│  │  - findByCategory()                                │     │
│  │  - search()                                        │     │
│  │  - create(), update(), delete()                    │     │
│  └────────────────────────────────────────────────────┘     │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │             Product Data Array                     │     │
│  │  [{ id, name, price, category, ... }]             │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

### Product Loading Flow
```
1. User opens browser
   ↓
2. React App renders
   ↓
3. useEffect hook triggers
   ↓
4. productAPI.getAll() called (Axios)
   ↓
5. GET /api/products request
   ↓
6. Express route handler
   ↓
7. ProductModel.findAll()
   ↓
8. Returns product array
   ↓
9. Response sent as JSON
   ↓
10. React state updated
    ↓
11. Products rendered on page
```

### Add to Cart Flow
```
1. User clicks "Add" button
   ↓
2. ProductCard calls addItem()
   ↓
3. Zustand store updates
   ↓
4. Cart items array updated
   ↓
5. localStorage saves cart
   ↓
6. Cart count updates in header
   ↓
7. Toast notification shows
```

### Search Flow
```
1. User types in search box
   ↓
2. User clicks "Search" button
   ↓
3. handleSearch() called
   ↓
4. productAPI.search(query)
   ↓
5. GET /api/products?search=query
   ↓
6. ProductModel.search(query)
   ↓
7. Filters products by name/description/category
   ↓
8. Returns filtered results
   ↓
9. Products state updated
   ↓
10. Filtered products displayed
```

## Component Hierarchy

```
App
├── Header
│   ├── Logo
│   ├── Navigation (Category Links)
│   ├── Search Bar
│   └── Cart Icon (with count badge)
│
├── Hero
│   └── CTA Button
│
├── Products Section
│   └── ProductCard (multiple instances)
│       ├── Product Image/Icon
│       ├── Category Badge
│       ├── Product Name
│       ├── Description
│       ├── Price
│       └── Add to Cart Button
│
├── Footer
│   ├── About Section
│   ├── Quick Links
│   └── Social Icons
│
└── CartSidebar (overlay)
    ├── Cart Header (with close button)
    ├── Cart Items
    │   └── CartItem (multiple)
    │       ├── Product Info
    │       ├── Quantity Controls (+/-)
    │       └── Remove Button
    └── Cart Footer
        ├── Total Display
        ├── Checkout Button
        └── Clear Cart Button
```

## State Management

### Zustand Cart Store
```typescript
CartState {
  items: CartItem[]

  Methods:
  - addItem(product)
  - removeItem(productId)
  - updateQuantity(productId, quantity)
  - clearCart()
  - getTotal()
  - getItemCount()
}
```

### React Component State
```typescript
App.tsx:
- products: Product[]
- filteredProducts: Product[]
- loading: boolean
- isCartOpen: boolean
```

## API Structure

### Request/Response Flow

```
Client Request:
GET /api/products?category=shirts

↓

Express Middleware Chain:
1. CORS check
2. JSON parser
3. Logger

↓

Route Handler:
routes/products.ts

↓

Model Method:
ProductModel.findByCategory('shirts')

↓

Response:
{
  success: true,
  data: [{ product objects }]
}
```

## TypeScript Types

### Shared Types

Both frontend and backend use similar types:

```typescript
Product {
  id: string
  name: string
  category: ProductCategory
  price: number
  description: string
  icon: string
  stock: number
}

ProductCategory =
  'shirts' | 'music' | 'anime' | 'games' | 'software'

CartItem {
  product: Product
  quantity: number
}

ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
```

## File Responsibilities

### Backend

| File | Responsibility |
|------|---------------|
| `server.ts` | Express app setup, middleware, server start |
| `routes/products.ts` | Product API endpoints |
| `models/Product.ts` | Product CRUD operations |
| `data/products.ts` | Initial product seed data |
| `types/index.ts` | TypeScript type definitions |

### Frontend

| File | Responsibility |
|------|---------------|
| `main.tsx` | React app entry point |
| `App.tsx` | Main app component, routing logic |
| `components/Header.tsx` | Navigation, search, cart icon |
| `components/Hero.tsx` | Hero section with CTA |
| `components/ProductCard.tsx` | Individual product display |
| `components/CartSidebar.tsx` | Shopping cart UI |
| `components/Footer.tsx` | Footer section |
| `services/api.ts` | Axios HTTP client |
| `store/cartStore.ts` | Zustand cart state |
| `types/index.ts` | TypeScript types |

## Build Process

### Development

```
Frontend (Vite):
1. TypeScript compilation
2. Hot Module Replacement (HMR)
3. CSS processing (Tailwind)
4. Serve at localhost:5173

Backend (ts-node + nodemon):
1. TypeScript compilation (on-the-fly)
2. Watch for file changes
3. Auto-restart on changes
4. Serve at localhost:5000
```

### Production

```
Frontend:
1. TypeScript → JavaScript
2. Tailwind CSS purge
3. Asset optimization
4. Bundle splitting
5. Output to /dist

Backend:
1. TypeScript → JavaScript
2. Output to /dist
3. Node.js runs compiled JS
```

## Security Layers

```
┌────────────────────────────────────┐
│          Frontend                  │
│  • Input validation               │
│  • XSS prevention (React escaping)│
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│          Network                   │
│  • HTTPS (production)             │
│  • CORS policies                  │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│          Backend                   │
│  • Environment variables          │
│  • Input validation (planned)     │
│  • Rate limiting (planned)        │
│  • Helmet.js (planned)            │
└────────────────────────────────────┘
```

## Scalability Path

### Current (v1.0)
```
Frontend: React SPA
Backend: Express + In-Memory
Database: Array in memory
```

### Next Phase (v2.0)
```
Frontend: React SPA
Backend: Express + MongoDB
Database: MongoDB Atlas
Auth: JWT tokens
Payment: Stripe
```

### Future (v3.0)
```
Frontend: Next.js (SSR)
Backend: GraphQL + REST
Database: MongoDB + Redis cache
Auth: OAuth2
CDN: CloudFront
Microservices: Product/User/Order services
```

---

This architecture is designed to be:
- ✅ **Scalable** - Easy to add features
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Type-safe** - TypeScript throughout
- ✅ **Modern** - Latest best practices
- ✅ **Production-ready** - With minor additions
