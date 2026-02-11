# Architecture Overview — Void Vendor

## Production Infrastructure

```
Internet Traffic
      │
      ▼
┌─────────────────────────────────────────────────┐
│              Cloudflare (optional CDN)           │
│  DDoS mitigation, SSL termination, caching      │
└─────────────────────────────────────────────────┘
      │ HTTPS (443)
      ▼
┌─────────────────────────────────────────────────┐
│              Raspberry Pi Server                 │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │           Nginx (reverse proxy)           │  │
│  │  • Serves React SPA (static files)        │  │
│  │  • Proxies /api/* → localhost:5001        │  │
│  │  • Proxies honeypot paths → localhost:5001│  │
│  │  • SSL via Let's Encrypt                  │  │
│  │  • Gzip compression, static caching       │  │
│  └───────────────────────────────────────────┘  │
│           │                    │                 │
│    /api/* + honeypots    everything else         │
│           │                    │                 │
│           ▼                    ▼                 │
│  ┌──────────────────┐  ┌───────────────────┐    │
│  │  Express Backend │  │  Static Files     │    │
│  │  (PM2, port 5001)│  │  /voidvendor-     │    │
│  │  TypeScript      │  │  frontend/ (dist) │    │
│  └──────────────────┘  └───────────────────┘    │
│           │                                      │
│           ▼                                      │
│  ┌──────────────────────────────────────────┐   │
│  │           PostgreSQL Database            │   │
│  │  (127.0.0.1, user: wes, db: algo_acid)  │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  iptables kernel firewall (attacker IP bans)    │
└─────────────────────────────────────────────────┘
```

## Request Flow (API Request)

```
Browser
  │
  │  HTTPS request to voidvendor.com/api/products
  ▼
Nginx
  │  proxy_pass http://localhost:5001
  │  sets X-Real-IP, X-Forwarded-For headers
  ▼
Express Middleware Chain (server.ts)
  │
  ├─ 1. CORS check (allowedOrigins list)
  ├─ 2. JSON body parser (5MB limit)
  │
  ├─ 3. VoidTrap middleware (voidTrap.ts)
  │     ├─ Admin IP whitelist bypass (ADMIN_IPS env var)
  │     ├─ Blacklist check → slow-drip tarpit if banned
  │     ├─ Scanner User-Agent blocking
  │     ├─ Global rate limit (50 req/10s)
  │     ├─ Auth endpoint rate limit (10/min)
  │     ├─ Honeypot path detection
  │     ├─ URL pattern scanning (SQLi, path traversal, bad extensions)
  │     ├─ POST body scanning (SQLi, XSS, SSTI, cmd injection)
  │     └─ Oversized payload blocking (5MB)
  │
  ├─ 4. requestLogger middleware (requestLogger.ts)
  │     ├─ Admin IP check → writes to admin_traffic_logs
  │     ├─ JWT decode (if present) → identify user/admin
  │     └─ All other traffic → writes to traffic_logs
  │
  ├─ 5. Console logger (method + path)
  │
  └─ 6. Route handler
        └─ /api/products → ProductRepository → PostgreSQL → JSON response
```

## Backend Architecture

### Directory Structure
```
backend/src/
├── config/
│   └── postgres.ts          # pg Pool connection, query wrapper, schema init
├── database/
│   ├── schema.sql            # Full DB schema (tables, indexes, extensions)
│   ├── add_user_profiles.sql # Migration: bio, location, avatar_url on users
│   ├── add_ip_bans.sql       # Migration: ip_bans persistent ban table
│   └── add_admin_traffic.sql # Migration: admin_traffic_logs table
├── middleware/
│   ├── auth.ts               # JWT verification → req.user
│   ├── requestLogger.ts      # Traffic logging (user vs admin separation)
│   └── voidTrap.ts           # 8-layer active defense middleware
├── repositories/
│   ├── ProductRepository.ts  # Product CRUD + search
│   ├── UserRepository.ts     # User CRUD + profile methods
│   └── OrderRepository.ts    # Order management
├── routes/
│   ├── products.ts           # GET/POST/PUT /api/products
│   ├── auth.ts               # POST /api/auth/login|register, GET /api/auth/me
│   ├── orders.ts             # Order creation and management
│   ├── payments.ts           # Stripe card + crypto (BTC/XMR) payments
│   ├── downloads.ts          # Digital product download management
│   ├── blog.ts               # Forum posts and comments
│   ├── profile.ts            # User profiles + avatar upload (multer)
│   ├── inventory.ts          # Stock management
│   └── admin.ts              # Admin dashboard, traffic, security endpoints
├── types/
│   └── index.ts              # Shared TypeScript interfaces
├── utils/
│   └── jwt.ts                # JWT sign/verify helpers
└── server.ts                 # Express app, middleware chain, startup
```

### Middleware Chain Detail

**VoidTrap** (`voidTrap.ts`) — 8 checks in order:

| # | Check | Action on Trigger |
|---|-------|-------------------|
| 1 | Blacklisted IP | Slow-drip tarpit (1 byte/3s, up to 10 min) |
| 2 | Scanner User-Agent | Instant ban (iptables + DB + AbuseIPDB) |
| 3 | Global rate limit (50 req/10s) | Instant ban |
| 4 | Auth brute-force (10/min on login/register) | Ban after 2 violations |
| 5 | Honeypot path hit | Deceptive response + ban |
| 6 | URL pattern match (SQLi, traversal, bad ext) | 403 or ban |
| 7 | POST body injection scan | 403 |
| 8 | Oversized payload (>5MB) | 413 |

**Deceptive honeypot responses by path:**
- `/.env` → Fake credentials file (Stripe keys, DB password)
- `/wp-login.php` → Fake WordPress login (harvests submitted credentials)
- `/phpmyadmin`, `/pma` → Fake phpMyAdmin interface
- `/api/v1/pods` → Fake Kubernetes API JSON
- `/actuator/env` → Fake Spring Boot actuator response
- All other honeypot paths → Glitch screen with fake error dump

**Ban pipeline** (`banIP()`):
```
banIP(ip, reason, hits)
  ├─ Skip: ::1, ::ffff:127.x, private IPs, ADMIN_IPS whitelist
  ├─ blacklist.set(ip, expiry)         — in-memory fast check
  ├─ db INSERT INTO ip_bans            — persist across restarts
  ├─ sudo /usr/local/bin/voidtrap ban  — iptables DROP rule at kernel level
  ├─ INSERT INTO traffic_logs          — record the event
  └─ POST api.abuseipdb.com/report     — report to global abuse DB
```

**requestLogger** (`requestLogger.ts`):
- Checks `ADMIN_IPS` env var first (IP-based, no JWT needed)
- Falls back to JWT decode for admin role detection
- Admin traffic → `admin_traffic_logs` table
- User/guest traffic → `traffic_logs` table

## Frontend Architecture

### Directory Structure
```
frontend/src/
├── components/
│   ├── Header.tsx          # Nav, search, cart icon, profile link, mobile menu
│   ├── ProductCard.tsx     # Product display with add-to-cart
│   ├── CartSidebar.tsx     # Slide-out cart with quantity controls
│   ├── AuthModal.tsx       # Login/register modal
│   ├── Avatar.tsx          # User avatar (image or letter fallback)
│   ├── StripeDonation.tsx  # Stripe Elements donation widget
│   ├── SEO.tsx             # Dynamic meta tags, Open Graph, structured data
│   └── Footer.tsx          # Links, socials, copyright
├── pages/
│   ├── Home.tsx            # Product catalog, hero, free downloads section
│   ├── ProductDetails.tsx  # Single product view with reviews
│   ├── Checkout.tsx        # Stripe card checkout flow
│   ├── Downloads.tsx       # User's purchased digital downloads
│   ├── Forum.tsx           # Community posts with avatars, comments
│   ├── UserProfile.tsx     # Own profile (editable) + public profiles
│   ├── Donate.tsx          # Card + BTC + XMR donation options
│   ├── Admin.tsx           # Admin dashboard (stats, users, orders, security)
│   └── About.tsx           # About page
├── store/
│   ├── cartStore.ts        # Zustand: cart items, add/remove/clear
│   └── authStore.ts        # Zustand: user session, login/logout
├── App.tsx                 # React Router routes
└── main.tsx                # Entry point, Stripe provider
```

### State Management

**Auth Store** (`authStore.ts` — Zustand + localStorage persist):
```typescript
User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'   // derived from isAdmin boolean from backend
  avatarUrl: string
}

AuthState {
  user: User | null
  token: string | null
  login(user, token) → void
  logout() → void
  updateProfile(partial) → void
}
```

**Cart Store** (`cartStore.ts` — Zustand + localStorage persist):
```typescript
CartState {
  items: CartItem[]
  addItem(product) → void
  removeItem(productId) → void
  updateQuantity(productId, qty) → void
  clearCart() → void
  getTotal() → number
  getItemCount() → number
}
```

### Component Hierarchy (current)
```
App (React Router)
├── Header
│   ├── Logo
│   ├── Nav links (Home, Forum, Downloads, Donate, About)
│   ├── Search bar
│   ├── Cart icon (count badge)
│   ├── Auth buttons (Login/Register) or Avatar + profile link
│   └── Mobile hamburger menu
│
├── CartSidebar (overlay, all pages)
│
├── AuthModal (portal overlay)
│
└── Pages (react-router-dom)
    ├── / → Home
    │   ├── Hero section
    │   ├── Free Downloads section (steal-it cards)
    │   └── Product Grid (ProductCard × N)
    ├── /products/:id → ProductDetails
    ├── /checkout → Checkout
    ├── /downloads → Downloads
    ├── /forum → Forum
    │   ├── Post list (Avatar + author link + content)
    │   └── Comment threads
    ├── /profile → UserProfile (own, editable)
    ├── /profile/:userId → UserProfile (public, read-only)
    ├── /donate → Donate
    ├── /admin → Admin (admin role required)
    │   ├── Dashboard stats
    │   ├── User management
    │   ├── Order management
    │   ├── Product/inventory control
    │   ├── Traffic monitoring (user vs admin)
    │   └── Security panel (bans, honeypot hits, blacklist)
    └── /about → About
```

## Database Schema (PostgreSQL)

### User & Auth
```sql
users (
  id UUID PK,
  name VARCHAR,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  is_admin BOOLEAN DEFAULT false,
  bio TEXT DEFAULT '',
  location VARCHAR(100) DEFAULT '',
  avatar_url VARCHAR(500) DEFAULT '',
  created_at TIMESTAMPTZ
)
```

### Products & Orders
```sql
products (
  id UUID PK, name, description, price DECIMAL,
  category VARCHAR, stock_quantity INT,
  product_type VARCHAR NOT NULL,  -- 'digital' or 'physical'
  image_url, is_active BOOLEAN, created_at
)

orders (id UUID PK, user_id UUID FK, status, total, created_at)
order_items (id UUID PK, order_id UUID FK, product_id UUID FK, quantity, price)
product_reviews (id UUID PK, product_id FK, user_id FK, rating, comment, created_at)
free_downloads (id UUID PK, name, slug UNIQUE, description, version, filename, platform[], download_count, is_active)
```

### Community
```sql
blog_posts (id UUID PK, user_id FK, title, content, created_at)
blog_comments (id UUID PK, post_id FK, user_id FK, content, created_at)
```

### Payments
```sql
crypto_payments (
  id UUID PK, order_id FK, currency VARCHAR,
  amount_usd, amount_crypto, wallet_address,
  tx_hash, status, created_at
)
```

### Traffic & Security
```sql
traffic_logs (
  id BIGSERIAL PK, ip_address, method, path,
  status_code, user_agent, user_id, is_admin BOOLEAN,
  created_at TIMESTAMPTZ
)

admin_traffic_logs (same schema as traffic_logs)

ip_bans (
  id SERIAL PK,
  ip_address VARCHAR(50) UNIQUE,
  reason TEXT,
  hits INT,
  banned_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
)
```

## Authentication Flow

```
Login POST /api/auth/login
  │
  ├─ UserRepository.findByEmail(email)
  ├─ bcryptjs.compare(password, hash)
  ├─ jwt.sign({ userId, email, role })   ← role: 'admin' | 'user'
  └─ Response: { id, name, email, isAdmin }
                        │
                        ▼
                  Frontend AuthModal
                  Maps isAdmin → role string
                  authLogin({ ...user, role: isAdmin ? 'admin' : 'user', avatarUrl })
                        │
                        ▼
                  Zustand authStore (persisted to localStorage)
                  All protected actions read from useAuthStore()
```

**Protected routes**: JWT sent as `Authorization: Bearer <token>` header.
`auth.ts` middleware decodes token → attaches `req.user = { userId, email, role }`.

## Payment Architecture

### Stripe (Cards)
```
POST /api/payments/create-intent → Stripe PaymentIntent
POST /api/payments/confirm → verify + create order + return download links
POST /api/payments/donate → separate donation PaymentIntent
```

### Crypto (BTC / XMR)
```
POST /api/payments/crypto/create → record crypto_payments row with wallet address
POST /api/payments/crypto/submit-tx → user submits tx hash → admin reviews
```

## API Endpoints Reference

| Route | Auth | Description |
|-------|------|-------------|
| GET /api/products | - | List all active products |
| GET /api/products/:id | - | Single product + reviews |
| POST /api/products | Admin | Create product |
| PUT /api/products/:id | Admin | Update product |
| POST /api/auth/register | - | Create account |
| POST /api/auth/login | - | Get JWT token |
| GET /api/auth/me | JWT | Current user info |
| GET /api/profile/:userId | - | Public user profile |
| PUT /api/profile | JWT | Update own profile |
| POST /api/profile/avatar | JWT | Upload avatar (500KB max) |
| GET /api/blog/posts | - | Forum posts |
| POST /api/blog/posts | JWT | Create post |
| POST /api/blog/posts/:id/comments | JWT | Add comment |
| POST /api/payments/create-intent | JWT | Stripe PaymentIntent |
| POST /api/payments/donate | - | Donation PaymentIntent |
| POST /api/payments/crypto/create | JWT | Crypto payment |
| GET /api/admin/stats | Admin | Dashboard statistics |
| GET /api/admin/traffic/logs | Admin | User traffic logs |
| GET /api/admin/traffic/admin | Admin | Admin traffic logs |
| GET /api/admin/security/blacklist | Admin | Banned IPs |
| POST /api/admin/security/ban | Admin | Manually ban IP |
| GET /api/admin/security/trapped | Admin | Honeypot hits |

## File Serving

```
/uploads/avatars/*  → express.static → /home/wes/voidvendor-uploads/avatars/
                       maxAge: 7d, dotfiles: deny

/downloads/*        → express.static → /home/wes/voidvendor-downloads/
                       Content-Disposition: attachment (force download)

All other paths     → Nginx serves /home/wes/voidvendor-frontend/ (React dist)
                       try_files $uri /index.html (SPA routing)
```

## Deployment

### Stack on Pi
```
OS:       Raspberry Pi OS (Linux)
Runtime:  Node.js 18 (backend) + Nginx (static + proxy)
Process:  PM2 (process name: "api", auto-restart on crash)
SSL:      Let's Encrypt (certbot)
DB:       PostgreSQL 14 (systemd service)
Firewall: iptables (VoidTrap writes DROP rules for attackers)
```

### Deploy Script (`deploy.ps1`)
```powershell
.\deploy.ps1 frontend   # build Vite → rsync dist/* to Pi → nginx reload
.\deploy.ps1 backend    # rsync src/ to Pi → npm install → tsc build → pm2 restart
.\deploy.ps1 all        # both of the above
```

### Environment Variables (Pi backend .env)
```env
PORT=5001
DATABASE_URL=postgresql://wes:password@127.0.0.1:5432/algorithmic_acid
JWT_SECRET=<secret>
STRIPE_SECRET_KEY=sk_live_...
UPLOADS_DIR=/home/wes/voidvendor-uploads/avatars
DOWNLOADS_DIR=/home/wes/voidvendor-downloads
ABUSEIPDB_API_KEY=<key>          # auto-reports attackers to global DB
ADMIN_IPS=<ip1>,<ip2>            # comma-separated; bypasses VoidTrap + logs as admin
NODE_ENV=production
```

## Build Process

### Frontend (Vite)
```
npm run build
  → TypeScript compilation
  → Tailwind CSS purge + minify
  → Asset fingerprinting + bundle splitting
  → Output: /dist (index.html + assets/)
```

### Backend (tsc)
```
npm run build
  → TypeScript → JavaScript (strict mode)
  → Output: /dist
  → PM2 runs: node dist/server.js
```

## SEO & Analytics

- **Sitemap**: `/sitemap.xml` (static, lists all public pages + products)
- **Robots**: `/robots.txt` (allows crawlers, discloses sitemap)
- **Meta tags**: Per-page via `SEO.tsx` component (Open Graph + Twitter Card)
- **Structured data**: JSON-LD — Organization, WebSite, SoftwareApplication, Product schemas
- **Google Search Console**: Verified via meta tag, sitemap submitted
- **Traffic analytics**: All requests logged to PostgreSQL with IP, path, status code

---

*Void Vendor — Production architecture as of 2026*
