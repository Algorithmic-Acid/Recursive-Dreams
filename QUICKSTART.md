# Quick Start Guide - Algorithmic Acid Void Vendor

## 5-Minute Setup

### 1. Install PostgreSQL

**Using Docker (Easiest):**
```bash
docker run --name algorithmic-acid-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=algorithmic_acid \
  -p 5432:5432 \
  -d postgres:15
```

**Or install locally:** Download from [postgresql.org](https://www.postgresql.org/download/)

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set:
```env
POSTGRES_PASSWORD=postgres  # Your PostgreSQL password
ANTHROPIC_API_KEY=sk-ant-... # Get from console.anthropic.com
INIT_SCHEMA=true  # Only for first run
```

### 3. Initialize & Seed Database

```bash
# Install dependencies
npm install

# Start server (will create schema automatically)
npm run dev

# Wait for "✅ Database schema initialized successfully"
# Then stop server (Ctrl+C)

# Set INIT_SCHEMA=false in .env
# Then seed the database
npm run seed:postgres

# Start server again
npm run dev
```

### 4. Test the API

**Get products:**
```bash
curl http://localhost:5000/api/products
```

**View inventory dashboard:**
```bash
curl http://localhost:5000/api/inventory/dashboard
```

**Generate AI forecast:**
```bash
curl -X POST http://localhost:5000/api/inventory/forecast \
  -H "Content-Type: application/json" \
  -d '{"horizonDays": 30}'
```

**Get purchase recommendations:**
```bash
curl -X POST http://localhost:5000/api/inventory/recommendations
```

---

## What You Get

✅ **15+ Products** - Digital soundscapes, music, software + Physical clothing & hardware
✅ **AI Inventory Management** - Forecasts, recommendations, alerts
✅ **2 Test Users** - Admin & regular user accounts
✅ **10 Sample Orders** - With sales history for AI training
✅ **Real-time Alerts** - Low stock, trending products
✅ **Auto-purchase Ready** - Toggle on/off for autonomous restocking

---

## Default Credentials

**Admin:** `admin@voidvendor.com` / `admin123`
**Test User:** `test@example.com` / `test123`

---

## Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/inventory/dashboard` | GET | Inventory health overview |
| `/api/inventory/forecast` | POST | Generate AI forecast |
| `/api/inventory/recommendations` | POST | Get purchase suggestions |
| `/api/inventory/alerts` | GET | Active inventory alerts |
| `/api/inventory/reports/daily` | POST | Generate AI report |
| `/api/products` | GET | List all products |
| `/api/orders` | GET | List orders |

---

## Next Steps

1. **Start Frontend:** `cd frontend && npm install && npm run dev`
2. **Explore API:** See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed API docs
3. **Customize Products:** Edit seed script or add via API
4. **Configure AI:** Adjust forecasting parameters in `InventoryAIService.ts`
5. **Enable Auto-purchase:** Set `auto_purchase_enabled = true` on recommendations

---

## Troubleshooting

**Port 5432 in use?**
```bash
# Change POSTGRES_PORT in .env
POSTGRES_PORT=5433
```

**Database connection failed?**
```bash
# Verify PostgreSQL is running
docker ps  # If using Docker
pg_isready  # If installed locally
```

**Need to reset database?**
```bash
# Drop and recreate
psql -U postgres
DROP DATABASE algorithmic_acid;
CREATE DATABASE algorithmic_acid;
\q

# Then run initialization again
INIT_SCHEMA=true npm run dev
```

---

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for complete documentation.
