# VOID VENDOR - Complete Site Structure & Reference

**Domain:** https://www.voidvendor.com
**Brand:** Void Vendor (formerly Algorithmic Acid)
**Theme:** Cyberpunk / dark hacker aesthetic
**Stack:** TypeScript, React 18, Express 4, PostgreSQL, Stripe, Zustand, TailwindCSS, Vite

---

## Hosting & Deployment

| Detail | Value |
|--------|-------|
| Host machine | Raspberry Pi (`void@void.local`) |
| OS user (SSH) | `void` |
| App user | `wes` |
| Sudo password | `FinalFantasy420` |
| Database | PostgreSQL `algorithmic_acid` (user: `wes`, pass: `FinalFantasy420`) |
| Backend path | `/home/wes/voidvendor/backend` |
| Frontend build path | `/home/wes/voidvendor-frontend` (Nginx serves this) |
| Downloads directory | `/home/wes/voidvendor-downloads/` |
| Backend port | 5001 (PM2 process name: `api`) |
| Process manager | PM2 (runs as user `wes`) |
| Web server | Nginx (reverse proxy to backend, serves frontend static) |
| Deploy script | `deploy.ps1 [frontend|backend|all]` (PowerShell, runs from Windows) |
| CORS origins | `voidvendor.com`, `www.voidvendor.com`, `localhost:5173`, `localhost:3000` |

### Deploy Process
- **Frontend:** SCP src files -> `npm run build` on Pi -> sync dist to Nginx dir -> reload Nginx
- **Backend:** SCP src files -> `tsc` build on Pi -> PM2 restart `api`

---

## Directory Structure

```
Algorithmic_Acid/
├── backend/
│   └── src/
│       ├── config/
│       │   └── postgres.ts            # PG pool (max 20 clients, 30s idle, 2s connect timeout)
│       ├── database/
│       │   ├── schema.sql             # Main schema (all tables, enums, views, triggers)
│       │   ├── add_traffic_logs.sql
│       │   ├── create_blog_posts.sql
│       │   ├── create_crypto_payments.sql
│       │   ├── create_password_reset.sql
│       │   └── update_blog_for_forum.sql
│       ├── middleware/
│       │   ├── auth.ts                # protect (JWT verify) + admin (role check)
│       │   └── requestLogger.ts       # Logs all requests to traffic_logs table
│       ├── repositories/
│       │   ├── UserRepository.ts
│       │   ├── ProductRepository.ts
│       │   └── OrderRepository.ts
│       ├── routes/
│       │   ├── auth.ts                # Register, login, forgot/reset password
│       │   ├── products.ts            # CRUD + free downloads
│       │   ├── orders.ts              # Order creation & management
│       │   ├── payments.ts            # Stripe + crypto (BTC/XMR)
│       │   ├── inventory.ts           # AI-powered inventory management
│       │   ├── admin.ts               # Admin dashboard, stats, traffic
│       │   ├── blog.ts                # Forum posts, product reviews, comments
│       │   └── downloads.ts           # Purchased file download access
│       ├── scripts/
│       │   ├── seedPostgres.ts
│       │   ├── migrateTrafficLogs.ts
│       │   ├── addVoidGhost.sql       # V0ID_GHOST product insert
│       │   ├── addVHSTracker.sql
│       │   ├── addVoidFM.sql
│       │   ├── addWaveForge.sql
│       │   ├── updateDigitalRot.sql
│       │   └── runUpdateDigitalRot.ts
│       ├── services/
│       │   ├── InventoryAIService.ts  # Claude AI integration for forecasting
│       │   └── productServicePg.ts    # Product CRUD service
│       ├── types/
│       │   └── index.ts
│       ├── utils/
│       │   ├── jwt.ts                 # Token generation (7d expiry) & verification
│       │   └── email.ts              # SMTP email for password resets
│       └── server.ts                  # Express app + route mounting + startup
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Header.tsx             # Nav bar, search, cart icon, user menu
│       │   ├── Hero.tsx               # Landing hero section
│       │   ├── ProductCard.tsx        # Product display card (grid item)
│       │   ├── CartSidebar.tsx        # Slide-out shopping cart
│       │   ├── Checkout.tsx           # Full checkout flow (Stripe + crypto)
│       │   ├── AuthModal.tsx          # Login/register/forgot-password modal
│       │   ├── FreeVSTSection.tsx     # Free plugins showcase
│       │   ├── ProductBlog.tsx        # Product reviews & comments
│       │   ├── CryptoPayment.tsx      # (Legacy - replaced by inline in Checkout)
│       │   ├── XMRPayment.tsx         # Monero payment component
│       │   └── Footer.tsx             # Site footer with links
│       ├── pages/
│       │   ├── index.ts              # Barrel export for all pages
│       │   ├── Admin.tsx             # Admin dashboard (stats, orders, users, traffic)
│       │   ├── About.tsx
│       │   ├── Contact.tsx
│       │   ├── Donate.tsx
│       │   ├── Downloads.tsx         # Free downloads library
│       │   ├── FAQ.tsx
│       │   ├── Forum.tsx             # Community forum (CRUD posts, comments, likes)
│       │   ├── MyPurchases.tsx       # User's orders & download links
│       │   ├── ProductDetail.tsx     # Single product page + reviews
│       │   ├── ForgotPassword.tsx    # Standalone forgot password page
│       │   ├── ResetPassword.tsx     # Token-based password reset
│       │   ├── Privacy.tsx
│       │   └── Terms.tsx
│       ├── services/
│       │   ├── api.ts                # Axios client + productAPI helpers
│       │   ├── downloadApi.ts        # Download access checking & file streaming
│       │   ├── orderApi.ts           # Order CRUD
│       │   └── paymentApi.ts         # Stripe + crypto payment API calls
│       ├── store/
│       │   ├── cartStore.ts          # Zustand cart (persisted to localStorage)
│       │   └── authStore.ts          # Zustand auth (persisted to localStorage)
│       ├── types/
│       │   ├── index.ts              # Product, CartItem, ApiResponse, etc.
│       │   └── order.ts              # ShippingAddress type
│       ├── App.tsx                   # Router + HomePage component
│       ├── main.tsx                  # Entry point
│       └── vite-env.d.ts
│
├── deploy.ps1                        # PowerShell deploy script
├── deploy_seo.ps1
├── deploy_vhs_tracker.ps1
├── deploy_waveforge.ps1
└── SITE_STRUCTURE.md                 # This file
```

---

## Frontend Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `HomePage` (in App.tsx) | Hero, free VSTs section, product grid |
| `/about` | `About` | About page |
| `/admin` | `Admin` | Admin dashboard (protected client-side) |
| `/contact` | `Contact` | Contact form |
| `/donate` | `Donate` | Donation/support page |
| `/downloads` | `Downloads` | Free VST download library |
| `/faq` | `FAQ` | Frequently asked questions |
| `/forgot-password` | `ForgotPassword` | Password reset request |
| `/forum` | `Forum` | Community forum |
| `/my-purchases` | `MyPurchases` | User's purchased products & downloads |
| `/privacy` | `Privacy` | Privacy policy |
| `/product/:slug` | `ProductDetail` | Individual product page with reviews |
| `/reset-password` | `ResetPassword` | Password reset form (with token param) |
| `/terms` | `Terms` | Terms of service |

### HomePage Layout (top to bottom)
1. **Header** - Logo, nav links (Downloads, Forum, About), search bar, cart icon, user menu
2. **Alpha Build Banner** - "ALPHA BUILD - Initializing the void..." with download link
3. **Hero** - Main landing section with cyberpunk styling
4. **FreeVSTSection** - Showcase of free VST plugins with download buttons
5. **Featured Products** - Grid of ProductCards (2 col mobile, 3 col tablet, 4 col desktop)
6. **Footer** - Links, copyright

### Modals & Sidebars (overlay on any page)
- **CartSidebar** - Slides in from right, shows cart items, checkout button
- **Checkout** - Full-screen modal with Stripe card form or crypto QR/address
- **AuthModal** - Login/register form with forgot password inline view

---

## Backend API Endpoints

All routes prefixed with `/api/`

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | - | Create account (name, email, password 6+ chars) |
| POST | `/login` | - | Login (returns JWT + user) |
| GET | `/me` | protect | Get current user |
| POST | `/forgot-password` | - | Send password reset email |
| POST | `/reset-password` | - | Reset password with token |

### Products (`/api/products`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | - | List all active products (supports ?category, ?search) |
| GET | `/:id` | - | Get product by ID |
| POST | `/` | admin | Create product |
| PUT | `/:id` | admin | Update product |
| DELETE | `/:id` | admin | Delete product |
| GET | `/free-downloads/list` | - | List free VST plugins |
| POST | `/free-downloads/:id/download` | - | Track free download |

### Orders (`/api/orders`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | protect | Create order |
| GET | `/my-orders` | protect | User's order history |
| GET | `/:id` | protect | Order details |
| PATCH | `/:id/status` | admin | Update order status |
| PATCH | `/:id/cancel` | protect | Cancel pending order |
| GET | `/` | admin | All orders |

### Payments (`/api/payments`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/create-intent` | protect | Create Stripe PaymentIntent |
| POST | `/confirm` | protect | Confirm Stripe payment |
| GET | `/config` | - | Get Stripe publishable key |
| POST | `/crypto/create` | protect | Create crypto payment order |
| POST | `/crypto/submit-tx` | protect | Submit TX hash |
| GET | `/crypto/status/:paymentId` | protect | Poll payment status |
| POST | `/crypto/admin-confirm/:paymentId` | admin | Manual XMR confirmation |
| GET | `/crypto/pending` | admin | Pending crypto payments |

### Downloads (`/api/downloads`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/my-downloads` | protect | User's purchased products |
| GET | `/check/:productId` | protect | Check download access |
| GET | `/file/:productId` | protect | Stream purchased file |

### Blog & Forum (`/api/blog`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/forum` | - | Get forum posts (?category, ?limit, ?offset) |
| POST | `/forum` | protect | Create forum post |
| GET | `/product/:productId` | - | Get product reviews |
| POST | `/product/:productId` | protect | Create product review |
| PUT | `/:postId` | protect | Edit own post |
| DELETE | `/:postId` | protect | Delete own post |
| POST | `/:postId/like` | protect | Like/unlike post |
| GET | `/:postId/comments` | - | Get comments |
| POST | `/:postId/comments` | protect | Add comment |
| DELETE | `/:postId/comments/:commentId` | protect | Delete own comment |

### Inventory AI (`/api/inventory`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | admin | Inventory health summary |
| GET | `/alerts` | admin | Active alerts |
| POST | `/alerts/:id/resolve` | admin | Resolve alert |
| POST | `/forecast` | admin | Generate AI forecast |
| GET | `/forecast/:productId` | admin | Get product forecasts |
| POST | `/recommendations` | admin | Generate purchase recommendations |
| GET | `/recommendations` | admin | Get pending recommendations |
| POST | `/recommendations/:id/approve` | admin | Approve recommendation |
| POST | `/recommendations/:id/reject` | admin | Reject recommendation |
| POST | `/reports/daily` | admin | Generate daily AI report |
| GET | `/reports` | admin | Recent AI reports |
| POST | `/update-velocity` | admin | Update sales velocity |
| GET | `/products-needing-reorder` | admin | Products below reorder point |
| GET | `/analytics/:productId` | admin | Detailed product analytics |

### Admin (`/api/admin`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users` | admin | All users |
| PATCH | `/users/:id/admin` | admin | Toggle admin status |
| DELETE | `/users/:id` | admin | Delete user |
| GET | `/stats` | admin | Site statistics (users, orders, revenue) |
| GET | `/orders` | admin | All orders with details |
| PATCH | `/orders/:id/status` | admin | Update order status |
| GET | `/download-stats` | admin | Download statistics |
| GET | `/download-logs` | admin | Download logs with IP tracking |
| GET | `/downloads` | admin | All free downloads |
| POST | `/downloads` | admin | Create free download |
| PUT | `/downloads/:id` | admin | Update free download |
| DELETE | `/downloads/:id` | admin | Delete free download |
| GET | `/traffic/stats` | admin | Traffic statistics |
| GET | `/traffic/logs` | admin | Paginated request logs |
| GET | `/traffic/trends` | admin | Traffic trends over time |
| POST | `/traffic/cleanup` | admin | Delete old logs |
| DELETE | `/traffic/logs` | admin | Clear in-memory logs |

### Static Downloads
| Path | Description |
|------|-------------|
| `/downloads/:filename` | Direct static file serving from downloads dir (for "Steal It" free downloads) |

---

## Database Schema

### Enums
```sql
product_type:       'digital' | 'physical'
product_category:   'soundscapes' | 'templates' | 'music' | 'software' |
                    'shirts' | 'hoodies' | 'pants' | 'effects_pedals' |
                    'midi_controllers' | 'synthesizers'
order_status:       'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
payment_status:     'pending' | 'paid' | 'failed' | 'refunded'
payment_method:     'card' | 'paypal' | 'cash' | 'xmr'
inventory_event_type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'damaged' | 'restock'
forecast_confidence:  'low' | 'medium' | 'high'
```

### Core Tables

**users**
- `id` UUID PK, `email` UNIQUE, `password_hash`, `name`, `is_admin` BOOLEAN, timestamps

**products**
- `id` UUID PK, `name`, `slug` UNIQUE, `category` (enum), `product_type` (digital|physical)
- `price` DECIMAL, `description`, `icon`, `image_url`, `is_active`
- `stock_quantity`, `low_stock_threshold`, `optimal_stock_level`, `reorder_point`
- `download_url`, `file_size_mb`, `sku` UNIQUE, `cost_price`
- `supplier_id` FK, `physical_attributes` JSONB, `metadata` JSONB, timestamps

**orders**
- `id` UUID PK, `user_id` FK, `order_number` UNIQUE, `total_amount`
- `status` (enum), `payment_status` (enum), `payment_method` (enum)
- `payment_intent_id` (Stripe), shipping fields, `tracking_number`, `notes`, timestamps

**order_items**
- `id` UUID PK, `order_id` FK, `product_id` FK
- `product_name`, `product_icon`, `quantity`, `unit_price`, `total_price`

**free_downloads**
- `id` UUID PK, `name`, `slug` UNIQUE, `description`, `version`, `file_size`
- `filename`, `platform` VARCHAR[], `download_count`, `is_active`, timestamps

### Blog & Community Tables

**blog_posts**
- `id` UUID PK, `user_id` FK, `product_id` FK (nullable - NULL = forum post)
- `title`, `content`, `category` (general|lore|support|announcements|reviews)
- `rating` (1-5, for reviews), `is_verified_download`, `is_pinned`
- `view_count`, `likes_count`, timestamps

**blog_comments** - `id`, `post_id` FK, `user_id` FK, `content`, timestamps
**blog_post_likes** - `id`, `post_id` FK, `user_id` FK

### Payment Tables

**crypto_payments**
- `id` UUID PK, `order_id` FK, `user_id` FK, `crypto_type` (xmr|btc)
- `amount_usd`, `wallet_address`, `tx_hash`
- `status` (pending|confirming|confirmed|expired), `confirmations`
- `confirmed_at`, `expires_at`, timestamps

**password_reset_tokens**
- `id` UUID PK, `user_id` FK, `token` (SHA256 hashed), `expires_at`, `used` BOOLEAN

### Inventory Management Tables

**inventory_events** - Stock change log (event_type, qty_change, qty_before/after, cost)
**inventory_snapshots** - Daily stock snapshots (stock, sales, avg_daily_sales, days_until_stockout)
**sales_velocity** - Rolling sales metrics (7/30/90d), trend direction & percentage
**inventory_forecasts** - AI-generated forecasts (predicted sales/stock, reorder qty, confidence, reasoning)
**purchase_recommendations** - AI reorder suggestions (qty, date, cost, priority, status: pending/approved/rejected)
**inventory_alerts** - Stock alerts (low_stock|stockout|overstock|trending, severity, resolved status)
**inventory_ai_reports** - AI analysis reports (daily_summary, weekly_forecast, metrics JSONB)
**suppliers** - Supplier info (name, contact, website, lead_time_days, min_order_qty)

### Traffic & Monitoring

**traffic_logs**
- `id` UUID PK, `timestamp`, `method`, `path`, `status_code`, `response_time`
- `ip_address`, `user_agent`, `user_id` FK
- Indexed on: timestamp, path, status_code, user_id, method

### Views
- `products_needing_reorder` - Products below reorder point with supplier info
- `inventory_health_summary` - Stock status overview for all active products

---

## Current Product Catalog

### Paid Products
| Name | Price | Icon | Download File |
|------|-------|------|---------------|
| Digital Rot | $25.00 | :skull: | DigitalRot.zip |
| The Shadow | $20.00 | :bust_in_silhouette: | TheShadow.zip |
| V0ID TALKER | $30.00 | :microphone: | VoidTalker.zip |
| V0ID_GHOST | $45.00 | :ghost: | V0ID_GHOST.zip |
| VHS Tracker | $15.00 | :vhs: | VHSTracker.zip |
| Void Mod | $25.00 | :package: | VoidMod.zip |
| VoidSynth Bundle | $50.00 | :package: | VoidSynth-v1.0-Bundle.zip |

### Free Products (in products table, $0)
| Name | Price | Download File |
|------|-------|---------------|
| Void FM | $0.00 | VoidFM.zip |

### Free Downloads (separate table)
| Name | Filename | Size |
|------|----------|------|
| Formant Filter VST3 | FormantFilter.zip | 4.5 MB |
| GrainStorm | GrainStorm.zip | 1.9 MB |
| Lo-Fi Degrader VST3 | LoFiDegrader.zip | 1.9 MB |
| Tape Wobble VST3 | TapeWobble.zip | 1.9 MB |
| Void FM | VoidFM.zip | 1.6 MB |
| WaveForge | WaveForge.zip | 1.9 MB |

All products are `digital` / `software` category / VST3 format / Windows platform.

---

## Payment System

### Stripe (Card)
1. Frontend loads Stripe.js with publishable key
2. `POST /api/payments/create-intent` creates a PaymentIntent on the backend
3. Stripe CardElement collects card details on frontend
4. `stripe.confirmCardPayment()` processes the payment client-side
5. Backend verifies via `stripe.paymentIntents.retrieve()` - status must be `succeeded`
6. Order marked as `paid`

**Keys stored in backend `.env`:**
- `STRIPE_SECRET_KEY` (sk_live_...)
- `STRIPE_PUBLISHABLE_KEY` (pk_live_...)

### Bitcoin (BTC)
1. User selects BTC, sees QR code + wallet address immediately
2. `POST /api/payments/crypto/create` creates pending order (2hr expiry)
3. User sends BTC, then submits TX hash
4. Backend verifies via Blockstream API (`blockstream.info/api/tx/:txid`)
5. Checks output was sent to the BTC address
6. Auto-confirms on verification

**Wallet:** `bc1qce33yheyq24l7x90zer5q866nx6tyx2j5atp2y`

### Monero (XMR)
1. Same flow as BTC but manual verification
2. User submits TX hash, status moves to `confirming`
3. Admin manually confirms via `POST /api/payments/crypto/admin-confirm/:id`

**Wallet:** `84SyqhuxFyg7n4VEvuRq6P1CjUVXYgSca6s9oB6RAmnL4qwNRk3YVQJNKF5WZtcQDjBHFEfv6t6NBYqHzcYuVsNEBkqUiVE`

**QR codes** generated via: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={prefix}{address}`

---

## Authentication

- **Method:** JWT Bearer tokens (7-day expiry)
- **Payload:** `{ userId, email, role }` where role is `'user'` or `'admin'`
- **Storage:** `localStorage` keys `token` and `user`
- **Header:** `Authorization: Bearer <token>`
- **Middleware:** `protect` (verify token) and `admin` (check role)
- **Password hashing:** bcryptjs
- **Password reset:** Random token emailed, SHA256 hashed in DB, 1-hour expiry, single-use

---

## State Management (Zustand)

### cartStore
- `items: CartItem[]` (product + quantity + optional variant)
- Actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `getTotal`, `getItemCount`
- Persisted to `localStorage` key `cart-storage`

### authStore
- `user: { id, name, email, role } | null`, `token: string | null`
- Actions: `login`, `logout`, `isAuthenticated`, `isAdmin`
- Persisted to `localStorage` key `auth-storage`

---

## Middleware

### requestLogger
- Logs every HTTP request to `traffic_logs` table
- IP extraction chain: `cf-connecting-ip` -> `x-real-ip` -> `x-forwarded-for` -> socket
- Keeps last 100 requests in memory for quick admin access
- Auto-cleanup: deletes logs older than 3 months (runs on interval)

### auth (protect + admin)
- `protect`: Extracts Bearer token, verifies JWT, attaches decoded payload to `req.user`
- `admin`: Checks `req.user.role === 'admin'`, returns 403 if not

---

## Forum System

- Posts with `product_id = NULL` are forum posts (general discussions)
- Posts with `product_id` set are product reviews
- Categories: `general`, `lore`, `support`, `announcements`, `reviews`
- Features: pinned posts, view count, like/unlike, comments, edit own posts
- Verified download badge on reviews (checks order history)

---

## Inventory AI (Claude Integration)

Uses Anthropic Claude API via `InventoryAIService.ts` for:
- **Sales forecasting** - Predicts sales volume and stock levels
- **Purchase recommendations** - Auto-suggests reorder quantities with priority levels
- **Daily summary reports** - AI-generated inventory health analysis
- **Sales velocity tracking** - 7/30/90-day rolling averages with trend direction

---

## Design System

- **Colors:** Dark background (`bg-dark-bg`, `bg-dark-card`), cyan/purple/pink gradients
- **Accent colors:** Cyan (`#06b6d4`), purple (`#a855f7`), pink (`#ec4899`)
- **Font style:** Monospace for UI labels (e.g., `[ SYSTEM_STATUS ]`, `> ACCESS_GRANTED <`)
- **CSS framework:** TailwindCSS with custom dark theme
- **Icons:** Lucide React
- **Toasts:** react-hot-toast (top-right position)
- **Responsive breakpoints:** Mobile-first (sm:640px, md:768px, lg:1024px, xl:1280px)
- **Product grid:** 2 col mobile, 3 col tablet, 4 col desktop

---

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=5001
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=algorithmic_acid
POSTGRES_USER=wes
POSTGRES_PASSWORD=FinalFantasy420
JWT_SECRET=[secret]
ANTHROPIC_API_KEY=[key]
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
FRONTEND_URL=https://www.voidvendor.com
DOWNLOADS_DIR=/home/wes/voidvendor-downloads
```

### Frontend (.env.production)
```
VITE_API_URL=https://www.voidvendor.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Quick Reference: Adding a New Product

1. Build the VST3, zip it
2. SCP zip to `void@void.local:~/`
3. Move to downloads dir: `sudo -u wes cp ~/Product.zip /home/wes/voidvendor-downloads/`
4. Write SQL insert:
   ```sql
   INSERT INTO products (name, slug, description, price, category, product_type, icon, metadata)
   VALUES (
     'PRODUCT_NAME', 'product-slug', 'Description here',
     25.00, 'software', 'digital', '🎵',
     '{"download_file": "Product.zip", "file_size": "X.X MB", "format": "VST3", "platform": "Windows", "version": "1.0.0"}'::jsonb
   ) RETURNING id, name, price;
   ```
5. Execute: `PGPASSWORD=FinalFantasy420 psql -h 127.0.0.1 -U wes -d algorithmic_acid -f ~/insert.sql`
6. Set stock: `UPDATE products SET stock_quantity = 99999 WHERE slug = 'product-slug';`
7. Product appears automatically in the frontend product grid
