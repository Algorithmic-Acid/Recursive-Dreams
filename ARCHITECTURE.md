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
  │     ├─ Admin IP whitelist bypass (ADMIN_IPS env var) + ADMIN_HONEYPOT alert
  │     ├─ Blacklist check → slow-drip tarpit if banned + BAN_EVASION alert
  │     ├─ Scanner User-Agent blocking (20+ tools)
  │     ├─ Global rate limit (50 req/10s)
  │     ├─ Auth endpoint rate limit (10/min, ban after 2 violations)
  │     ├─ Credential stuffing detection → CREDENTIAL_STUFFING alert
  │     ├─ Low-and-slow scanner detection (>40 paths/2min)
  │     ├─ IP rotation fingerprint detection (no accept-language, 8+ IPs) + IP_ROTATION alert
  │     ├─ Redirect loop deception (6 trap paths cycle 302 redirects forever)
  │     ├─ Honeypot path detection → rotating status codes (403→404→401→200 per path) + 15% 503 + ban
  │     ├─ Fake WP credential success (30% of POST /wp-login.php → fake 302 + auth cookie)
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
│   └── voidTrap.ts           # 11-layer active defense middleware + smart alert system
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

**VoidTrap** (`voidTrap.ts`) — 16 checks in order:

| # | Check | Action on Trigger |
|---|-------|-------------------|
| 1 | Blacklisted IP | Slow-drip tarpit (1 byte/3s, up to 10 min) + BAN_EVASION alert at 50/200/500 hits |
| 1b | HTTP method abuse (TRACE/CONNECT; PUT/DELETE/PATCH on non-API paths) | Instant ban + 405 |
| 1c | Fake token pivot (Bearer token matches harvested honeypot credential) | Instant ban + 401 |
| 1d | Content-type mismatch (claims JSON, body fails to parse) | Instant ban + 400 |
| 1e | AbuseIPDB pre-check on first-seen IPs (confidence ≥ 80%) | Instant ban (async/cached 24h) |
| 2 | Scanner User-Agent | Instant ban (iptables + DB + AbuseIPDB) |
| 3 | Global rate limit (50 req/10s) | Instant ban |
| 4a | Auth brute-force (10/min on login/register) | Ban after 2 violations |
| 4b | Hidden honeypot form field (`_void`) non-empty on auth request | Instant ban + 401 |
| 4c | Credential stuffing (same creds from 3+ IPs/10min) | CREDENTIAL_STUFFING CRITICAL alert |
| 5 | Low-and-slow scanner (>40 distinct paths/2min) | Instant ban |
| 6 | IP rotation fingerprint (no accept-language, 8+ IPs same fingerprint) | Instant ban + IP_ROTATION alert |
| 7a | Redirect loop trap (6 paths cycle 302 → each other) | Ban + 302 redirect loop |
| 7b | Honeypot path hit (50+ paths incl. robots.txt bait paths) | Deceptive response (300–1200ms delay, 15% chance 503) + ban |
| 8 | URL pattern match (SQLi, traversal, bad ext) | 403 or ban |
| 9 | POST body injection scan | 403 |
| 10 | Oversized payload (>5MB) | 413 |

**Admin IP honeypot monitoring:** Admin IPs bypass all checks but trigger a CRITICAL `ADMIN_HONEYPOT` alert if they hit a trap path (indicates possible credential compromise).

**Smart Alert System** (in-memory, up to 100 alerts, exposed via `/api/admin/security/alerts`):

| Alert Type | Severity | Trigger |
|-----------|----------|---------|
| `CREDENTIAL_STUFFING` | CRITICAL | Same username+password from 3+ IPs in 10 min |
| `ADMIN_HONEYPOT` | CRITICAL | Whitelisted admin IP hits a honeypot path |
| `IP_ROTATION` | HIGH | Same tool fingerprint from 8+ distinct IPs |
| `BAN_EVASION` | HIGH/MEDIUM | Banned IP makes 50, 200, or 500+ post-ban requests |

**Deceptive honeypot responses by path:**
- `/.env` → Fake credentials file (Stripe keys, DB password, JWT secret)
- `/wp-login.php`, `/wp-admin` → Fake WordPress login (harvests submitted credentials; 30% of POST attempts return fake `302 → /wp-admin/` with bogus auth cookie to waste attacker time)
- `/phpmyadmin`, `/pma` → Fake phpMyAdmin interface
- `/api/v1/pods` → Fake Kubernetes API JSON
- `/actuator/env` → Fake Spring Boot actuator response
- `/.git/config` → Fake git config with remote URL and author email
- `/package.json` → Fake package.json with dependency list
- `/graphql`, `/playground` → Fake GraphQL introspection schema (with tempting `adminConfig` query)
- `/xmlrpc.php` → Fake XML-RPC response / RSD discovery feed
- `/wp-includes/wlwmanifest.xml` → Fake Windows Live Writer manifest
- `/api/debug`, `/debug` → Fake debug config dump with fake credentials
- All other honeypot paths → Glitch screen with fake error dump

All honeypot responses include a 300–1200ms random delay to slow scanner throughput. Additionally:
- **15% chance**: `503 Service Temporarily Unavailable` with randomized `Retry-After` (makes scanner think server crashed)
- **Rotating status codes** (`trapPathCounter` Map): each trap path cycles through four response modes globally — `403 Forbidden`, `404 Not Found`, `401 Unauthorized` (with `WWW-Authenticate: Basic` header), then normal deceptive response — so different scanners probing the same path see different results and cannot fingerprint which response means "real endpoint"
- **Fake credential success**: 30% of POST attempts to `/wp-login.php` return a `302` redirect to `/wp-admin/` with a convincing but bogus `wordpress_logged_in_xxx` cookie, sending the attacker on a futile rabbit-hole trying to use it
- **Credential harvest log**: WP honeypot POST submissions stored in-memory (`credHarvests[]`, max 500, passwords partially masked), accessible in admin dashboard as `CRED_HARVEST_LOG` with one-click clear button
- **robots.txt bait paths**: `/wp-backup`, `/admin-secret`, `/database-backup`, `/old`, `/dev` listed as `Disallow` in `robots.txt` to attract scanners that read it; all five wired to TRAP_PATHS for instant ban on access
- **Fake token set** (`fakeTokens`): all fake credentials served in honeypot responses (JWT secrets, Stripe keys, K8s base64 values) are pre-loaded; any `Authorization: Bearer <fakeToken>` request triggers instant ban (pivot detection)

**Redirect loop deception** (`REDIRECT_CYCLE`): Six trap paths cycle infinite 302 redirects between pairs, wasting scanner threads:
- `/wp-admin/setup-config.php` ↔ `/wp-admin/install.php`
- `/setup.php` ↔ `/install.php`
- `/admin/install` ↔ `/admin/setup`

**Escalating ban tiers** (cumulative offense count persists across restarts via DB):

| Offense | Duration |
|---------|----------|
| 1st | 30 minutes |
| 2nd | 2 hours |
| 3rd | 24 hours |
| 4th | 7 days |
| 5th+ | Permanent (`expires_at = NULL` in DB) |

**Ban pipeline** (`banIP()`):
```
banIP(ip, reason, path, userAgent, abuseCategories)
  ├─ Skip: ::1, ::ffff:127.x, private IPs, ADMIN_IPS whitelist
  ├─ offenseCount.get(ip) + 1          — cumulative offense tracking
  ├─ getBanTier(offenses)              — escalate duration
  ├─ logTrapHit / banWithIptables      — log event + iptables DROP at kernel level
  └─ geoLookup(ip) → ipinfo.io (3s timeout)
       ├─ blacklist.set(ip, {expiresAt, location})  — in-memory fast check
       ├─ db UPSERT ip_bans (location column)        — persist across restarts
       └─ POST api.abuseipdb.com/report              — includes ip, location, ua, path
```

**AbuseIPDB category codes:**
- Scanner UA: `14,19,21` (Port Scan + Bad Web Bot + Web App Attack)
- Rate limit: `4,21` (DDoS + Web App Attack)
- Brute force: `18,21` (Brute-Force + Web App Attack)
- SQL injection: `16,21` (SQL Injection + Web App Attack)
- Hacking/honeypot: `15,21` (Hacking + Web App Attack)

**AbuseIPDB report comment format:**
```
VoidTrap [cats]: [offense #N → Xh] reason | ip: 1.2.3.4 | loc: City, Region, CC, AS | path: /wp-admin | ua: Mozilla/5.0...
```

**Behavioral analysis state** (in-memory, reported via `/api/admin/security/blacklist`):
- `pathTracker` Map — tracks distinct paths per IP in a 2-min window (flags scanners)
- `fingerprintMap` Map — tracks tool fingerprints (UA+headers) across IPs (flags IP rotation)
- `credentialMap` Map — tracks credential attempts per IP across IPs (flags stuffing attacks)
- `alerts` Array — up to 100 smart alerts (CREDENTIAL_STUFFING, BAN_EVASION, ADMIN_HONEYPOT, IP_ROTATION)
- `BannedIP.location` — geo string stored on each ban entry (city, region, country, ISP via ipinfo.io)
- `trapPathCounter` Map — global hit counter per trap path; drives rotating status code responses
- All exposed via dedicated admin API endpoints with dismiss support

**requestLogger** (`requestLogger.ts`):
- Checks `ADMIN_IPS` env var first (IP-based, no JWT needed)
- Falls back to JWT decode for admin role detection
- Admin traffic → `admin_traffic_logs` table
- User/guest traffic → `traffic_logs` table
- `startTrafficLogCleanup()` — runs daily, prunes both tables after 3 months

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
│   ├── CryptoConverter.tsx # Live BTC/XMR ↔ USD two-way converter (CoinGecko)
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
    ├── /donate → Donate (Stripe + BTC + XMR + CryptoConverter per coin)
    ├── /admin → Admin (admin role required)
    │   ├── Dashboard stats
    │   ├── User management
    │   ├── Order management
    │   ├── Product/inventory control
    │   ├── Traffic monitoring (user vs admin)
    │   └── Security panel
    │       ├── Threat alerts (CREDENTIAL_STUFFING, BAN_EVASION, ADMIN_HONEYPOT, IP_ROTATION)
    │       ├── Attack timeline chart (24h stacked bar: honeypot/rate-limit/blocked/cred-harvest)
    │       ├── Honeypot heatmap (top 20 trap paths by all-time hit count)
    │       ├── Credential harvest log (CRED_HARVEST_LOG — WP honeypot submissions, masked pw, clearable)
    │       ├── Stats: active bans, permanent, tracked IPs, rate limit
    │       ├── Manual ban / unban
    │       ├── Active bans table (IP, reason, hits, offense#, expires, location)
    │       ├── Honeypot trap log (last 50 hits)
    │       └── Behavioral analysis panel
    │           ├── Path scanner monitor (IPs near 40-path threshold)
    │           └── IP rotation detector (fingerprints from multiple IPs)
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
  hits INT,                       -- cumulative offense count (seeds offenseCount on restart)
  banned_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,         -- NULL = permanent ban; rows kept 90 days after expiry
  location TEXT DEFAULT 'unknown' -- geo string from ipinfo.io (city, region, country, ISP)
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

### CryptoConverter (frontend only)
```
CryptoConverter component (CryptoConverter.tsx)
  ├─ Fetches live price: GET https://api.coingecko.com/api/v3/simple/price
  │   ?ids=bitcoin|monero&vs_currencies=usd
  ├─ Auto-refreshes every 60 seconds
  ├─ Two-way input: USD ↔ BTC or USD ↔ XMR
  ├─ Rendered inside Donate.tsx (one per coin card)
  └─ Rendered inside Checkout.tsx (below crypto address, before Pay button)
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
| GET /api/admin/security/blacklist | Admin | Banned IPs + behavioral data |
| POST /api/admin/security/ban | Admin | Manually ban IP |
| DELETE /api/admin/security/ban/:ip | Admin | Unban IP |
| GET /api/admin/security/trapped | Admin | Honeypot hits (last 100) |
| GET /api/admin/security/alerts | Admin | Smart threat alerts |
| DELETE /api/admin/security/alerts/:id | Admin | Dismiss single alert |
| DELETE /api/admin/security/alerts | Admin | Dismiss all alerts |
| GET /api/admin/security/honeypot-heatmap | Admin | Top 20 trap paths by hit count |
| GET /api/admin/security/attack-timeline | Admin | 24h attack events grouped by hour |
| GET /api/admin/security/cred-harvests | Admin | In-memory WP honeypot credential harvest log |
| DELETE /api/admin/security/cred-harvests | Admin | Clear credential harvest log |

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
