# Algorithmic Acid / Void Vendor — Project Summary

Live at: **https://www.voidvendor.com**

---

## What It Is

A full-stack cyberpunk-themed e-commerce platform selling digital music production tools (VST plugins, sample packs, presets). Hosted on a Raspberry Pi 5 behind Nginx with an active-defense security layer called VoidTrap.

---

## Architecture

### Frontend
- **React 18 + TypeScript** — component-based SPA
- **Vite** — build tool / dev server
- **Tailwind CSS** — utility-first styling (cyberpunk dark theme)
- **Zustand** — global auth + cart state
- **Axios** — HTTP client with `withCredentials: true` for cookie auth
- **react-router-dom** — SPA routing

### Backend
- **Node.js + Express + TypeScript**
- **PostgreSQL** (via `pg`) — orders, users, products, bans, traffic logs
- **bcryptjs** — password hashing
- **jsonwebtoken** — JWT generation; delivered as HttpOnly cookie
- **cookie-parser** — reads HttpOnly auth cookie
- **multer** — avatar file upload with MIME magic byte validation
- **Stripe** — payment processing (client-confirm + server verify)
- **express-validator** — input validation

### Infrastructure
- **Raspberry Pi 5** — production host
- **PM2** — process manager for Node (`api` process, port 5001)
- **Nginx** — reverse proxy + SSL termination + rate limiting + security headers
- **Let's Encrypt** — TLS certificate

---

## Security Architecture

### VoidTrap Middleware (`backend/src/middleware/voidTrap.ts`)
Active-defense Express middleware that runs before every request:

| Layer | What it does |
|-------|-------------|
| Blacklist | Bans served via slow-drip tarpit (wastes attacker threads) |
| HTTP method abuse | TRACE/CONNECT + non-API PUT/DELETE → instant ban |
| Fake token pivot | Bearer tokens harvested from honeypot responses → instant ban |
| Content-type mismatch | Claimed JSON but unparseable body → ban |
| AbuseIPDB pre-check | Async lookup + sync cache check; score ≥ 80 → tarpit |
| Scanner UA | 20+ known scanner patterns → instant ban |
| Global rate limit | 50 req/10s per IP → ban |
| Auth rate limit | 10 req/min on login/register; 2 violations → ban |
| Honeypot form field | Hidden `_void` field in auth forms; bots fill it → ban |
| Credential stuffing | Same creds from 3+ IPs in 10 min → CRITICAL alert |
| Path enumeration | 40+ distinct paths in 2 min → ban (low-and-slow scanner) |
| IP rotation | Same tool fingerprint from 8+ IPs → ban + HIGH alert |
| Redirect loop | Certain paths cycle forever to waste scanner threads |
| Honeypot paths | 60+ trap paths serve convincing fake content (WP login, .env, phpMyAdmin, K8s API, Spring Actuator, GraphQL, etc.) |
| Body injection scan | SQL injection + XSS patterns in POST body → ban |

**Escalating ban tiers**: 30min → 2h → 24h → 7d → permanent (based on offense count, survives restarts via DB)

**Deceptive responses**: fake `.env` with plausible credentials, fake WP login that logs submitted creds + optionally issues a bogus auth cookie, fake Kubernetes secrets, Spring Actuator env, GraphQL introspection, etc.

### Nginx Security Headers
- `Strict-Transport-Security` (HSTS, preload)
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`

### Auth Security
- JWT in HttpOnly cookie (not localStorage) — XSS-safe
- Short-lived HMAC-signed download tokens (60min, not full JWTs)
- Session invalidation on password reset via `token_version`
- Generic error messages on registration (no email enumeration)
- Password minimum 8 characters
- MIME magic byte validation on avatar uploads

---

## API Routes

```
/api/auth        register, login, logout, me, forgot-password, reset-password
/api/products    CRUD (admin-gated writes), search, category filter
/api/orders      create, history, confirm payment
/api/payments    create-intent, confirm
/api/downloads   my-downloads, check/:id, link/:id (signed URL), file/:id
/api/profile     get/:userId, update, avatar upload
/api/blog        posts CRUD
/api/inventory   admin: stock management + AI restock suggestions
/api/admin       security dashboard, ban management, traffic logs, cred harvests
```

---

## File Structure

```
Algorithmic_Acid/
├── backend/
│   └── src/
│       ├── config/postgres.ts          # DB connection + schema init
│       ├── middleware/
│       │   ├── voidTrap.ts             # Active-defense security middleware
│       │   ├── auth.ts                 # JWT protect() + admin() middleware
│       │   └── requestLogger.ts        # Traffic log (last 100 req in memory)
│       ├── repositories/UserRepository.ts
│       ├── routes/
│       │   ├── auth.ts, products.ts, orders.ts, payments.ts
│       │   ├── downloads.ts, profile.ts, blog.ts
│       │   ├── inventory.ts, admin.ts
│       ├── utils/
│       │   ├── jwt.ts                  # generateToken, verifyToken, generateDownloadToken
│       │   └── email.ts                # Password reset emails
│       └── server.ts                   # App bootstrap
├── frontend/
│   └── src/
│       ├── components/                 # AuthModal, Navbar, Cart, etc.
│       ├── pages/                      # Home, Shop, Admin, Profile, etc.
│       ├── store/                      # Zustand: useAuthStore, useCartStore
│       ├── services/api.ts             # Axios instance (withCredentials: true)
│       └── types/
├── deploy.ps1                          # One-command deploy: frontend + backend to Pi
├── pull-db-backup.ps1                  # Pull latest DB backup from Pi to Windows
└── db-backups/                         # Off-site backup storage (gitignored)
```

---

## Deployment

```powershell
# Deploy everything
powershell -ExecutionPolicy Bypass -File deploy.ps1 all

# Frontend only
powershell -ExecutionPolicy Bypass -File deploy.ps1 frontend

# Backend only
powershell -ExecutionPolicy Bypass -File deploy.ps1 backend

# Pull latest DB backup to this machine
powershell -ExecutionPolicy Bypass -File pull-db-backup.ps1
```

Pi: `void@void.local` | Backend: PM2 process `api` on port 5001 | DB: PostgreSQL `algorithmic_acid`

---

## Database Backups

- **Pi**: nightly cron at 3am → `pg_dump | gzip` → `/home/wes/voidvendor-backups/` (7-day retention)
- **Windows**: `pull-db-backup.ps1` SCPs latest backup (14-copy retention)

---

## Environment Variables (Pi `/home/wes/voidvendor/backend/.env`)

```
PORT=5001
NODE_ENV=production
JWT_SECRET=...
JWT_EXPIRE=7d
DATABASE_URL=...
STRIPE_SECRET_KEY=...
ABUSEIPDB_API_KEY=...
ADMIN_IPS=...
DOWNLOADS_DIR=/home/wes/voidvendor-downloads
UPLOADS_DIR=/home/wes/voidvendor-uploads/avatars
```
