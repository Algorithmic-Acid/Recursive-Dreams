# Void Vendor - Cyberpunk VST Plugin Marketplace

A full-stack e-commerce platform for VST plugins with cyberpunk aesthetics. Features free downloads, premium plugins, crypto payments, user profiles, community forum, and a multi-layer active defense security system.

🌐 **Live Site**: [https://www.voidvendor.com](https://www.voidvendor.com)

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Lightning fast build tool
- **Tailwind CSS** - Cyberpunk theme with cyan/purple/pink gradients
- **Zustand** - State management with persistence
- **React Router** - Client-side routing
- **Recharts** - Analytics visualizations
- **Stripe Elements** - Secure payment processing
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Backend
- **Node.js** with TypeScript
- **Express** - Web framework
- **PostgreSQL** - Relational database (pg driver)
- **JWT** - Authentication & authorization
- **bcryptjs** - Password hashing
- **Multer** - File uploads (avatars)
- **Stripe** - Payment processing
- **PM2** - Process management

### Security & Infrastructure
- **Nginx** - Reverse proxy & static file serving
- **Let's Encrypt** - SSL/TLS certificates
- **VoidTrap** - Custom multi-layer active defense middleware
- **iptables** - Kernel-level IP banning (survives restarts)
- **AbuseIPDB** - Auto-reporting of attackers to global abuse database
- **Cloudflare** (optional) - CDN & additional DDoS protection

## Features

### E-Commerce Core
- ✅ Product catalog with free & premium VST plugins
- ✅ Shopping cart with persistent storage
- ✅ Stripe card payment integration
- ✅ Cryptocurrency payments (Bitcoin, Monero)
- ✅ Digital product downloads
- ✅ Order management & history
- ✅ Stock inventory tracking
- ✅ Product reviews & ratings

### User Features
- ✅ User authentication (JWT-based)
- ✅ User profiles with avatars
- ✅ Bio & location customization
- ✅ Forum/community discussions
- ✅ Post creation & commenting
- ✅ Profile linking in forum posts
- ✅ Download tracking

### Donations
- ✅ Stripe card donations
- ✅ Bitcoin (BTC) donations
- ✅ Monero (XMR) donations
- ✅ QR code generation
- ✅ Anonymous donation support
- ✅ Live BTC/XMR ↔ USD price converter (CoinGecko, auto-refreshes)

### Admin Panel
- ✅ Comprehensive dashboard
- ✅ User management
- ✅ Order management
- ✅ Product inventory control
- ✅ Free download management
- ✅ **Traffic monitoring (separated user/admin)**
- ✅ **Security monitoring with VoidTrap**
- ✅ **Behavioral analysis panel** (path scanner monitor, IP rotation detector)
- ✅ Blacklist management with escalating offense tracking
- ✅ Honeypot trap detection log
- ✅ Download/piracy analytics
- ✅ Revenue tracking

### Security Features
- ✅ **VoidTrap middleware** - Multi-layer active defense (10 checks per request)
- ✅ **Honeypot traps** - 50+ paths; catches WordPress/PHP/k8s/git/dependency scanners
- ✅ **Scanner UA blocking** - 20+ known tools (sqlmap, nikto, nuclei, gobuster...)
- ✅ **Deceptive responses** - Fake `.env`, WordPress login, phpMyAdmin, Kubernetes API, `.git/config`, `package.json`, GraphQL introspection, XML-RPC, debug config
- ✅ **Credential harvesting** - WP login form captures attacker-submitted credentials
- ✅ **Honeypot response delays** - 300–1200ms random delay slows scanner throughput
- ✅ **Slow-drip tarpit** - Holds banned connections open (1 byte/3s, up to 10min)
- ✅ **Escalating ban tiers** - offense 1: 30min → 2: 2hr → 3: 24hr → 4: 7 days → 5+: permanent
- ✅ **iptables integration** - Bans enforced at kernel level, survive server restarts
- ✅ **Persistent bans** - `ip_bans` DB table, reloaded on startup; offense history preserved across restarts
- ✅ **AbuseIPDB reporting** - Auto-reports with per-attack-type category codes (Port Scan, DDoS, Brute-Force, SQLi, Hacking, Bad Web Bot)
- ✅ **Auth brute-force protection** - 10 attempts/min on login/register; ban after 2 violations
- ✅ **Low-and-slow scanner detection** - Bans IPs hitting >40 distinct paths in 2 minutes
- ✅ **IP rotation / fingerprint tracking** - Detects automated tools rotating IPs (missing accept-language + same fingerprint from 8+ IPs)
- ✅ **POST body injection scanning** - Recursive SQLi/XSS/SSTI/command injection detection
- ✅ **Traffic separation** - Admin traffic logged separately from user/guest
- ✅ **Admin IP whitelist** - Bypasses all VoidTrap checks for known admin IPs
- ✅ **SQL injection protection** - URL and body pattern matching
- ✅ **XSS prevention** - Headers and body scanning
- ✅ **Path traversal detection**
- ✅ **Automatic log rotation** - Traffic logs pruned after 3 months (both tables)

### SEO & Performance
- ✅ Complete meta tags (Open Graph, Twitter Card)
- ✅ Structured data (JSON-LD)
- ✅ Sitemap.xml & robots.txt
- ✅ Google Search Console verified
- ✅ CDN-ready headers
- ✅ Static asset caching
- ✅ Image optimization

## Project Structure

```
Algorithmic_Acid/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── postgres.ts          # PostgreSQL connection
│   │   ├── database/
│   │   │   └── *.sql                # Database migrations
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT authentication
│   │   │   ├── requestLogger.ts     # Traffic logging + log rotation
│   │   │   └── voidTrap.ts          # Multi-layer active defense
│   │   ├── repositories/
│   │   │   ├── ProductRepository.ts
│   │   │   ├── UserRepository.ts
│   │   │   └── OrderRepository.ts
│   │   ├── routes/
│   │   │   ├── products.ts
│   │   │   ├── auth.ts
│   │   │   ├── orders.ts
│   │   │   ├── payments.ts          # Stripe & crypto
│   │   │   ├── blog.ts              # Forum
│   │   │   ├── profile.ts           # User profiles
│   │   │   ├── downloads.ts
│   │   │   └── admin.ts             # Admin panel API
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── jwt.ts
│   │   └── server.ts
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── sitemap.xml
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── CartSidebar.tsx
│   │   │   ├── AuthModal.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── StripeDonation.tsx
│   │   │   ├── CryptoConverter.tsx
│   │   │   ├── SEO.tsx
│   │   │   └── Footer.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── ProductDetails.tsx
│   │   │   ├── Checkout.tsx
│   │   │   ├── Downloads.tsx
│   │   │   ├── Forum.tsx
│   │   │   ├── UserProfile.tsx
│   │   │   ├── Donate.tsx
│   │   │   ├── Admin.tsx
│   │   │   └── About.tsx
│   │   ├── store/
│   │   │   ├── cartStore.ts
│   │   │   └── authStore.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   └── package.json
│
└── README.md
```

## Database Schema (PostgreSQL)

### Core Tables
- `users` - User accounts (email, password, is_admin, bio, location, avatar_url)
- `products` - VST plugins (name, price, description, category, stock, product_type)
- `orders` - Customer orders
- `order_items` - Order line items
- `blog_posts` - Forum posts
- `blog_comments` - Forum comments
- `product_reviews` - Product reviews
- `free_downloads` - Free VST downloads

### Traffic & Security
- `traffic_logs` - User/guest traffic (excludes admin); auto-pruned after 3 months
- `admin_traffic_logs` - Admin traffic (separate monitoring); auto-pruned after 3 months
- `ip_bans` - Persistent IP ban list with offense history (`expires_at NULL` = permanent)
- `crypto_payments` - BTC/XMR payment tracking

## Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- PM2 (production)
- Nginx (production)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Algorithmic-Acid/Recursive-Dreams.git
   cd Recursive-Dreams
   ```

2. **Setup PostgreSQL Database**
   ```bash
   createdb algorithmic_acid
   psql algorithmic_acid < backend/src/database/schema.sql
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run dev
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Set VITE_API_URL to http://localhost:5001
   npm run dev
   ```

### Environment Variables

**Backend (.env)**
```env
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/algorithmic_acid
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
UPLOADS_DIR=/path/to/uploads
DOWNLOADS_DIR=/path/to/downloads
ABUSEIPDB_API_KEY=your_abuseipdb_key   # optional - auto-reports attackers
ADMIN_IPS=1.2.3.4,5.6.7.8             # comma-separated admin IP whitelist
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5001
```

## Deployment (Raspberry Pi / Linux)

The included `deploy.ps1` script automates deployment:

```powershell
# Deploy frontend only
.\deploy.ps1 frontend

# Deploy backend only
.\deploy.ps1 backend

# Deploy everything
.\deploy.ps1 all
```

### Manual Deployment Steps

1. **Backend**
   ```bash
   cd /home/wes/voidvendor/backend
   npm install
   npm run build
   pm2 restart api
   ```

2. **Frontend**
   ```bash
   cd /home/wes/voidvendor/frontend
   npm install
   npm run build
   sudo cp -r dist/* /home/wes/voidvendor-frontend/
   sudo systemctl reload nginx
   ```

## API Endpoints

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/donate` - Create donation payment
- `POST /api/payments/crypto/create` - Create crypto payment
- `POST /api/payments/crypto/submit-tx` - Submit transaction hash

### Profile
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile` - Update own profile
- `POST /api/profile/avatar` - Upload avatar

### Forum
- `GET /api/blog/posts` - Get forum posts
- `POST /api/blog/posts` - Create post
- `POST /api/blog/posts/:id/comments` - Add comment

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/traffic/stats` - Traffic statistics
- `GET /api/admin/traffic/logs` - User traffic logs
- `GET /api/admin/traffic/admin` - Admin traffic logs
- `GET /api/admin/security/blacklist` - Banned IPs + behavioral analysis data
- `POST /api/admin/security/ban` - Ban IP address
- `DELETE /api/admin/security/ban/:ip` - Unban IP address
- `GET /api/admin/security/trapped` - Honeypot hits

## Security Architecture

### VoidTrap Middleware (Active Defense)

Requests pass through 10 checks in order:

1. **Blacklist + Slow-drip tarpit** — Banned IPs get a connection held open (1 byte/3s, up to 10min), draining scanner connection pools
2. **Scanner UA blocking** — 20+ known tools (sqlmap, nikto, nuclei, gobuster, etc.) banned on first request
3. **Global rate limiting** — 50 req/10s per IP; violations trigger ban + iptables DROP rule
4. **Auth brute-force protection** — 10 login attempts/min; IP banned after 2 violations
5. **Low-and-slow scanner detection** — Bans IPs that visit >40 distinct paths in 2 minutes (catches slow directory enumeration that stays under rate limits)
6. **IP rotation / fingerprint detection** — Tracks tool fingerprints (UA + headers); IPs with no `accept-language` header (real browsers always send it) from 8+ distinct IPs are banned
7. **Honeypot paths** — 50+ trap paths return convincing fake responses with a 300–1200ms delay:
   - `/.env` → Fake credentials file (Stripe keys, DB password, JWT secret)
   - `/wp-login.php` → Fake WordPress login (logs any credentials submitted)
   - `/phpmyadmin` → Fake phpMyAdmin interface
   - `/api/v1/pods` → Fake Kubernetes API JSON
   - `/actuator/env` → Fake Spring Boot actuator response
   - `/.git/config` → Fake git config with remote URL
   - `/package.json` → Fake package.json with dependency list
   - `/graphql` → Fake GraphQL introspection schema with tempting `adminConfig` query
   - `/xmlrpc.php` → Fake XML-RPC / RSD discovery response
   - `/wp-includes/wlwmanifest.xml` → Fake Windows Live Writer manifest
   - `/api/debug` → Fake debug config dump with fake credentials
   - Everything else → Glitch screen with fake error dump
8. **URL pattern matching** — PHP/ASP/JSP extensions, SQLi patterns, path traversal
9. **POST body scanning** — Recursive SQLi, XSS, SSTI, command injection detection
10. **Oversized payload blocking** — 5MB limit

**Escalating ban tiers** (offense count persists across restarts):
| Offense | Duration |
|---------|----------|
| 1st | 30 minutes |
| 2nd | 2 hours |
| 3rd | 24 hours |
| 4th | 7 days |
| 5th+ | **Permanent** |

All bans: written to `ip_bans` DB table + iptables DROP rule (survive restarts) + AbuseIPDB report with category-specific codes.

**AbuseIPDB category codes used:**
- Scanner UA: 14 (Port Scan) + 19 (Bad Web Bot) + 21 (Web App Attack)
- Rate limit: 4 (DDoS Attack) + 21
- Brute force: 18 (Brute-Force) + 21
- SQL injection: 16 (SQL Injection) + 21
- Hacking/honeypot: 15 (Hacking) + 21

### Traffic Separation
- Admin IPs → `admin_traffic_logs` table (whitelisted in `ADMIN_IPS` env var)
- User/guest traffic → `traffic_logs` table
- VoidTrap completely skips admin IPs (no rate limiting, no honeypot)
- Both log tables auto-pruned after 3 months

## SEO Configuration

### Google Search Console
1. Visit https://search.google.com/search-console
2. Add property: `www.voidvendor.com`
3. Submit sitemap: `https://www.voidvendor.com/sitemap.xml`

### Structured Data
- Organization schema
- WebSite schema with SearchAction
- SoftwareApplication schema for each product
- Product reviews with aggregate ratings

## CDN Setup (Cloudflare)

1. Sign up at https://dash.cloudflare.com
2. Add site: `voidvendor.com`
3. Update nameservers at domain registrar
4. Configure SSL/TLS: **Full (strict)**
5. Enable optimizations:
   - Auto Minify (JS, CSS, HTML)
   - Brotli compression
   - Rocket Loader
6. Create page rules for static asset caching

## Legal & Compliance

See [LEGAL.md](LEGAL.md) for full details. Summary:

### Data Retention
- Traffic logs auto-purged after **90 days** (configurable via `LOG_RETENTION_DAYS` env var)
- Security ban records retained permanently for repeat/serious offenders (required for iptables enforcement and legal evidence)

### IP Anonymization (GDPR Privacy-by-Design)
- **`traffic_logs`**: Last IPv4 octet zeroed before storage (`192.168.1.123` → `192.168.1.0`). Individual visitors are not identifiable.
- **`ip_bans` / `admin_traffic_logs`**: Full IPs retained — required for active defense and audit trail.

### Active Defense Posture
All VoidTrap measures are purely defensive — reactive to traffic that reaches our own servers. No offensive operations against external infrastructure. Honeypots on your own servers are lawful in the US and EU. Full legal rationale in [LEGAL.md](LEGAL.md).

### AbuseIPDB Reporting
Good-faith reporting under AbuseIPDB ToS. Reports include only IPs that demonstrated hostile behavior against our infrastructure.

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

## License

MIT

## Credits

Built with 💜 by **Algorithmic Acid**

**Powered by**: React • TypeScript • PostgreSQL • Stripe • Express • Tailwind CSS

---

*Void Vendor - Professional VST plugins for the digital void*
