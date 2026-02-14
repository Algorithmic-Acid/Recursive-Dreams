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
- ✅ **Real-time threat dashboard** (attack timeline chart, honeypot heatmap)
- ✅ **Smart threat alerts** (credential stuffing, ban evasion, admin honeypot, IP rotation)
- ✅ **Behavioral analysis panel** (path scanner monitor, IP rotation detector)
- ✅ Blacklist management with escalating offense tracking
- ✅ Honeypot trap detection log
- ✅ Download/piracy analytics
- ✅ Revenue tracking

### Security Features
- ✅ **VoidTrap middleware** - Multi-layer active defense (16 checks per request)
- ✅ **Honeypot traps** - 50+ paths incl. robots.txt bait paths; catches WordPress/PHP/k8s/git/dependency scanners
- ✅ **Scanner UA blocking** - 20+ known tools (sqlmap, nikto, nuclei, gobuster...)
- ✅ **Deceptive responses** - Fake `.env`, WordPress login, phpMyAdmin, Kubernetes API, `.git/config`, `package.json`, GraphQL introspection, XML-RPC, debug config
- ✅ **Deception layering** - 15% of honeypot hits return `503`; rotating status codes (403→404→401→200) per path confuse scanners; 6 trap paths issue infinite 302 redirect loops
- ✅ **Fake credential success** - 30% of WP login POST attempts receive a fake `302 → /wp-admin/` with a bogus auth cookie, sending the attacker on a futile rabbit-hole
- ✅ **Credential harvesting** - WP login form captures attacker-submitted credentials; masked passwords stored in admin-visible `CRED_HARVEST_LOG` (clearable)
- ✅ **robots.txt honeypot** - Tempting `Disallow` paths in robots.txt lure scanners directly into TRAP_PATHS for instant ban
- ✅ **Fake token pivot detection** - Fake credentials served in honeypot responses pre-loaded into `fakeTokens`; any `Authorization: Bearer` reuse triggers instant ban
- ✅ **HTTP method abuse detection** - `TRACE`/`CONNECT` banned immediately; `PUT`/`DELETE`/`PATCH` on non-API paths triggers ban
- ✅ **Hidden honeypot form field** - CSS-hidden `_void` input in login/register form; bots that auto-fill fields get instantly banned
- ✅ **Content-type mismatch detection** - POST claiming `application/json` with unparseable body (scanner tell) triggers ban
- ✅ **AbuseIPDB pre-check** - First-seen IPs checked against AbuseIPDB; confidence ≥ 80% → instant ban (results cached 24h)
- ✅ **AbuseIPDB sync pre-check** - In-memory cache checked synchronously before every request; already-cached high-score IPs (≥80%) are tarpitted immediately without waiting for async lookup
- ✅ **JWT via HttpOnly cookie** - Auth token stored in HttpOnly cookie (not localStorage), preventing XSS-based token theft; `cookie-parser` reads it server-side
- ✅ **Signed time-limited download URLs** - File downloads use HMAC-signed tokens (60-min TTL) instead of bare JWTs; `GET /api/downloads/link/:productId` generates them; `?dltoken=` param accepted on file endpoint
- ✅ **Session invalidation on password reset** - `token_version` column incremented on every password reset; all previously issued JWTs become invalid
- ✅ **Avatar MIME magic byte validation** - First 12 bytes of uploaded files checked against known magic bytes (JPEG/PNG/GIF/WebP) — extension spoofing rejected before any DB write
- ✅ **IPv6 normalization** - `::ffff:x.x.x.x` IPv4-mapped addresses stripped to plain IPv4 before all ban/rate-limit lookups; prevents ban evasion via IPv6 connection
- ✅ **Nginx security headers** - HSTS (preload), Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy applied at edge
- ✅ **Account enumeration prevention** - Registration returns generic failure message regardless of whether email exists
- ✅ **Password minimum 8 characters** - Enforced at registration and password reset
- ✅ **Credential stuffing detection** - Same credentials from 3+ IPs in 10 min → CRITICAL alert
- ✅ **Smart threat alerts** - CREDENTIAL_STUFFING, BAN_EVASION, ADMIN_HONEYPOT, IP_ROTATION alerts surfaced in admin dashboard
- ✅ **Honeypot response delays** - 300–1200ms random delay slows scanner throughput
- ✅ **Slow-drip tarpit** - Holds banned connections open (1 byte/3s, up to 10min)
- ✅ **Escalating ban tiers** - offense 1: 30min → 2: 2hr → 3: 24hr → 4: 7 days → 5+: permanent
- ✅ **iptables integration** - Bans enforced at kernel level, survive server restarts
- ✅ **Persistent bans** - `ip_bans` DB table, reloaded on startup; offense history preserved across restarts
- ✅ **AbuseIPDB reporting** - Auto-reports with per-attack-type category codes; report includes attacker IP, geo location (city/country/ISP via ipinfo.io), user agent, and path
- ✅ **Geo location tracking** - Attack origin stored in `ip_bans.location` and displayed in admin dashboard ACTIVE_BANS table
- ✅ **AbuseIPDB webmaster verified** - voidvendor.com registered as webmaster at abuseipdb.com
- ✅ **Auth brute-force protection** - 10 attempts/min on login/register; ban after 2 violations
- ✅ **Low-and-slow scanner detection** - Bans IPs hitting >40 distinct paths in 2 minutes
- ✅ **IP rotation / fingerprint tracking** - Detects automated tools rotating IPs (missing accept-language + same fingerprint from 8+ IPs)
- ✅ **POST body injection scanning** - Recursive SQLi/XSS/SSTI/command injection detection
- ✅ **Traffic separation** - Admin traffic logged separately from user/guest
- ✅ **Admin IP whitelist** - Bypasses all VoidTrap checks; alerts on admin IP honeypot hits
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
- `users` - User accounts (email, password, is_admin, bio, location, avatar_url, token_version)
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

# Pull latest DB backup from Pi to local db-backups/ folder
.\pull-db-backup.ps1
```

### Database Backups
- **Pi**: nightly `pg_dump | gzip` via cron at 3am → `/home/wes/voidvendor-backups/` (7-day retention)
- **Windows**: `pull-db-backup.ps1` SCPs latest backup to `db-backups/` (14-copy retention)

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
- `POST /api/auth/register` - Register user (sets HttpOnly cookie)
- `POST /api/auth/login` - Login user (sets HttpOnly cookie)
- `POST /api/auth/logout` - Logout (clears HttpOnly cookie)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token (invalidates all sessions)

### Downloads
- `GET /api/downloads/my-downloads` - List purchased downloads
- `GET /api/downloads/link/:productId` - Generate signed 60-min download URL
- `GET /api/downloads/file/:productId` - Download file (cookie or `?dltoken=`)

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
- `GET /api/admin/security/alerts` - Smart threat alerts
- `DELETE /api/admin/security/alerts/:id` - Dismiss single alert
- `DELETE /api/admin/security/alerts` - Dismiss all alerts
- `GET /api/admin/security/honeypot-heatmap` - Top 20 trap paths by hit count
- `GET /api/admin/security/attack-timeline` - 24h attack events by hour
- `GET /api/admin/security/cred-harvests` - WP honeypot credential harvest log
- `DELETE /api/admin/security/cred-harvests` - Clear credential harvest log

## Security Architecture

### VoidTrap Middleware (Active Defense)

Requests pass through 11 checks in order:

1. **Blacklist + Slow-drip tarpit** — Banned IPs get a connection held open (1 byte/3s, up to 10min). BAN_EVASION alert fires at 50/200/500 post-ban hits
2. **Scanner UA blocking** — 20+ known tools (sqlmap, nikto, nuclei, gobuster, etc.) banned on first request
3. **Global rate limiting** — 50 req/10s per IP; violations trigger ban + iptables DROP rule
4. **Auth brute-force protection** — 10 login attempts/min; IP banned after 2 violations
4b. **Credential stuffing detection** — Same username+password from 3+ IPs in 10 min → CRITICAL CREDENTIAL_STUFFING alert
5. **Low-and-slow scanner detection** — Bans IPs that visit >40 distinct paths in 2 minutes
6. **IP rotation / fingerprint detection** — Same tool fingerprint from 8+ IPs → ban + IP_ROTATION alert
7a. **Redirect loop traps** — 6 paths cycle infinite 302 redirects (e.g. `/wp-admin/setup-config.php` ↔ `/wp-admin/install.php`) to freeze scanner threads
7b. **Honeypot paths** — 50+ trap paths return convincing fake responses with:
   - 300–1200ms delay to slow scanner throughput
   - 15% chance `503 Service Unavailable` (simulates server crash)
   - Rotating status codes per path: `403 Forbidden` → `404 Not Found` → `401 Unauthorized` → normal response → repeat (prevents fingerprinting)
   - `/.env` → Fake credentials file (Stripe keys, DB password, JWT secret)
   - `/wp-login.php` → Fake WordPress login (logs credentials; **30% of POSTs return fake `302 + auth cookie`** to create a rabbit-hole)
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

All bans: written to `ip_bans` DB table (with geo location) + iptables DROP rule (survive restarts) + AbuseIPDB report.

**AbuseIPDB report format:**
```
VoidTrap [cats]: [offense #N → Xh] reason | ip: 1.2.3.4 | loc: City, Region, CC, ISP | path: /wp-admin | ua: Mozilla/5.0...
```

**AbuseIPDB category codes used:**
- Scanner UA: 14 (Port Scan) + 19 (Bad Web Bot) + 21 (Web App Attack)
- Rate limit: 4 (DDoS Attack) + 21
- Brute force: 18 (Brute-Force) + 21
- SQL injection: 16 (SQL Injection) + 21
- Hacking/honeypot: 15 (Hacking) + 21

### Smart Alert System

Four alert types surfaced in Admin → Security tab:
| Type | Severity | Trigger |
|------|----------|---------|
| `CREDENTIAL_STUFFING` | CRITICAL | Same creds from 3+ IPs in 10 min |
| `ADMIN_HONEYPOT` | CRITICAL | Admin IP hits a honeypot path |
| `IP_ROTATION` | HIGH | Same fingerprint from 8+ IPs |
| `BAN_EVASION` | HIGH/MEDIUM | Banned IP makes 50/200/500+ requests |

Alerts are dismissible per-item or all at once from the security dashboard.

### Traffic Separation
- Admin IPs → `admin_traffic_logs` table (whitelisted in `ADMIN_IPS` env var)
- User/guest traffic → `traffic_logs` table
- VoidTrap skips rate limiting / banning for admin IPs, but still alerts on honeypot hits
- Both log tables auto-pruned after 90 days (`LOG_RETENTION_DAYS`)

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
