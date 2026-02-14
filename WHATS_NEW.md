# What's New - Security Hardening Complete

## Feb 2026 — Full Security Hardening Pass

All major security weaknesses identified in the previous audit have been resolved and deployed to production.

---

### Auth: JWT → HttpOnly Cookies
- JWT is no longer stored in `localStorage` — it's set as an `HttpOnly` cookie on login/register
- `cookie-parser` added to Express; auth middleware reads cookie first, then Authorization header for backward compat
- `/api/auth/logout` endpoint clears the cookie server-side
- `withCredentials: true` added to all Axios requests so the cookie is sent cross-origin

### Signed Time-Limited Download URLs
- File downloads no longer use a bare 7-day JWT in the URL query string
- New endpoint `GET /api/downloads/link/:productId` generates a short-lived HMAC-signed token (60-minute TTL)
- Tokens are base64url-encoded and verified against HMAC-SHA256 — not full JWTs
- `GET /api/downloads/file/:productId?dltoken=<token>` accepts the signed token directly (no cookie needed), enabling native browser download links

### Session Invalidation on Password Reset
- `token_version` column added to the `users` DB table
- On every password reset, the version is incremented — all previously issued JWTs become invalid

### Avatar Upload: MIME Magic Byte Validation
- Previously only checked file extension (easily spoofed)
- Now reads the first 12 bytes of the saved file and validates against known magic bytes for JPEG, PNG, GIF, and WebP
- Invalid files are deleted before the response is sent

### VoidTrap: IPv6 Normalization
- IPs arriving as `::ffff:x.x.x.x` (IPv4-mapped IPv6) are now stripped to plain IPv4 before all ban/rate-limit lookups
- Prevents ban evasion by forcing a connection through IPv6 when already blocked on IPv4

### VoidTrap: AbuseIPDB Sync Pre-Check
- Previously AbuseIPDB lookups were fire-and-forget — the first request from a known-bad IP always slipped through
- Now checks the in-memory cache synchronously before every request; IPs with a cached score ≥ 80 are tarpitted immediately

### Nginx Security Headers
Added to the main HTTPS server block (live on www.voidvendor.com):
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self)`
- `Content-Security-Policy` — restricts scripts, styles, fonts, images, connections, and frames to known safe origins

### Account Enumeration Fix
- Registration no longer reveals whether an email is already registered — returns a generic failure message

### Password Minimum Length
- Enforced at 8 characters on registration and password reset (was 6)

### DB Backups
- **Pi**: nightly `pg_dump` via cron at 3am, gzipped to `/home/wes/voidvendor-backups/`, 7-day local retention
- **Windows**: `pull-db-backup.ps1` SCPs the latest backup from the Pi for off-site disaster recovery, keeps 14 copies

### npm audit
- All high and critical vulnerabilities resolved in both backend and frontend
- 2 moderate esbuild vulns remain — dev-server only, not present in production builds

---

## Previous Milestones

### VoidTrap Advanced Security Features
- 6-layer active defense middleware: robots.txt honeypot, fake token pivot detection, HTTP method abuse, hidden honeypot form field, content-type mismatch detection, AbuseIPDB pre-check
- Fake credential success (30% chance) on WP login honeypot — serves bogus auth cookie to waste attacker time
- Rotating status codes (200/403/404/401) on trap paths so scanners can't fingerprint responses
- In-memory credential harvest log (admin-viewable, max 500 entries, masked passwords)

### Admin Security Dashboard
- Threat alerts panel with dismissal
- Active ban list with offense count and escalating ban tiers
- Credential harvest log (WP login honeypot captures) with delete button
- Behavioral analysis: path scanner candidates, IP-rotation fingerprint suspects
- Heatmap of honeypot hit distribution

### Full E-Commerce Platform
- Stripe payment integration (client-confirm + server verify, no webhook needed)
- Digital product downloads (purchase-gated, signed URLs)
- Order management with full history
- User profiles with avatar upload
- Blog / content pages
- Free VST plugin downloads ("Steal It" button)
- Admin inventory management with AI-assisted restock suggestions

---

## Current Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite + Tailwind + Zustand |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL (pg) |
| Auth | JWT via HttpOnly cookie + bcryptjs |
| Payments | Stripe |
| Security | VoidTrap middleware + Nginx + AbuseIPDB |
| Hosting | Raspberry Pi 5, Nginx, PM2 |
| Backups | pg_dump cron (Pi) + PowerShell pull (Windows) |
