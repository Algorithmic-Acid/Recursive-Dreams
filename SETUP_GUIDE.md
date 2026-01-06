# Algorithmic Acid - Void Vendor E-Commerce Platform

## PostgreSQL + AI-Powered Inventory Management Setup Guide

This guide will help you set up your void vendor e-commerce platform with PostgreSQL database and advanced AI inventory management.

---

## 🎯 Features

### E-Commerce Core
- Product catalog (digital & physical items)
- User authentication & authorization
- Shopping cart & checkout
- Order management
- Payment processing (Stripe integration)

### AI-Powered Inventory Management
- **Real-time inventory tracking** with historical data
- **AI-powered sales forecasting** using Claude AI
- **Automated purchase recommendations** with priority levels
- **Smart alerts** for low stock, stockouts, and trending products
- **Sales velocity analysis** (7-day, 30-day, 90-day trends)
- **Daily AI reports** with actionable insights
- **Auto-purchase capability** (toggle on/off for autonomous restocking)

### Product Categories
- **Digital Products**: Soundscapes, Templates, Music, Software
- **Physical Products**: Clothing (Shirts, Hoodies, Pants), Hardware (Effects Pedals, MIDI Controllers, Synthesizers)

---

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **PostgreSQL** (v12 or higher)
3. **Anthropic API Key** (for AI features)
   - Sign up at [console.anthropic.com](https://console.anthropic.com/)
   - Create an API key from your account dashboard

---

## 🚀 Installation

### 1. Clone & Install Dependencies

```bash
# Navigate to the project
cd Algorithmic_Acid

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. PostgreSQL Database Setup

#### Option A: Local PostgreSQL Installation

**Windows:**
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Install with default settings (remember the password you set!)
3. PostgreSQL should start automatically

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Option B: Docker (Recommended for Development)

```bash
# Run PostgreSQL in Docker
docker run --name algorithmic-acid-db \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=algorithmic_acid \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps
```

#### Create the Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE algorithmic_acid;

# Exit
\q
```

### 3. Configure Environment Variables

```bash
cd backend

# Copy the example env file
cp .env.example .env

# Edit .env with your values
# Required:
#   - POSTGRES_PASSWORD (your PostgreSQL password)
#   - ANTHROPIC_API_KEY (your Claude API key)
#   - JWT_SECRET (any random secure string)
```

**Example `.env` file:**
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=algorithmic_acid
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword

INIT_SCHEMA=true  # Set to true for first run
ANTHROPIC_API_KEY=sk-ant-your-key-here
JWT_SECRET=your-random-secret-key-here
```

### 4. Initialize Database Schema

```bash
# Make sure INIT_SCHEMA=true in your .env file
npm run dev

# Wait for the message:
# "✅ Database schema initialized successfully"

# Then stop the server (Ctrl+C) and set INIT_SCHEMA=false in .env
```

### 5. Seed the Database

```bash
# Add seed script to package.json if not present
npm pkg set scripts.seed="ts-node --transpile-only src/scripts/seedPostgres.ts"

# Run the seed script
npm run seed
```

This will create:
- 4 suppliers
- 15+ products (digital & physical)
- 2 users (admin & test)
- 10 sample orders
- Initial sales velocity data

**Default Users:**
- Admin: `admin@voidvendor.com` / `admin123`
- Test User: `test@example.com` / `test123`

---

## 🎮 Running the Application

### Start Backend
```bash
cd backend
npm run dev
```

Server will start on [http://localhost:5000](http://localhost:5000)

### Start Frontend
```bash
cd frontend
npm run dev
```

Frontend will start on [http://localhost:5173](http://localhost:5173)

---

## 🤖 AI Inventory Management Usage

### API Endpoints

#### Dashboard Overview
```bash
GET /api/inventory/dashboard
```
Returns inventory health summary with stock status for all products.

#### Generate AI Forecast
```bash
POST /api/inventory/forecast
Content-Type: application/json

{
  "horizonDays": 30
}
```
Generates AI-powered sales forecasts for the next 30 days.

#### Get Purchase Recommendations
```bash
POST /api/inventory/recommendations
```
AI analyzes inventory and suggests what to reorder, when, and how much.

#### View Pending Recommendations
```bash
GET /api/inventory/recommendations
```
Returns all pending purchase recommendations sorted by priority.

#### Approve a Recommendation
```bash
POST /api/inventory/recommendations/{id}/approve
Content-Type: application/json

{
  "userId": "user-uuid"
}
```

#### Get Inventory Alerts
```bash
GET /api/inventory/alerts
```
Returns active alerts (low stock, stockouts, trending products).

#### Generate Daily AI Report
```bash
POST /api/inventory/reports/daily
```
Claude AI generates a comprehensive daily summary report.

#### Update Sales Velocity
```bash
POST /api/inventory/update-velocity
```
Manually refresh sales velocity calculations (normally runs automatically).

#### Product Analytics
```bash
GET /api/inventory/analytics/{productId}
```
Detailed analytics for a specific product including:
- Sales velocity trends
- Recent inventory events
- AI forecasts
- Active alerts

---

## 🔧 AI Configuration

### Auto-Purchase Feature

To enable autonomous purchasing:

1. Navigate to purchase recommendations
2. Find the recommendation you want to automate
3. Update the recommendation to enable auto-purchase:

```sql
UPDATE purchase_recommendations
SET auto_purchase_enabled = TRUE
WHERE id = 'recommendation-id';
```

**Note:** In a production system, you'd want to:
- Add supplier API integrations
- Implement approval workflows
- Set spending limits
- Add email notifications

### Customizing AI Behavior

Edit `backend/src/services/InventoryAIService.ts`:

- **Forecast horizon**: Adjust `horizonDays` parameter (default: 30 days)
- **Confidence thresholds**: Modify confidence level logic
- **Alert sensitivity**: Change low stock thresholds in the database
- **AI prompts**: Customize the prompts sent to Claude for different business logic

---

## 📊 Database Schema Highlights

### Key Tables

- **products**: Product catalog with inventory tracking
- **suppliers**: Supplier information and lead times
- **orders** & **order_items**: Order management
- **inventory_events**: Complete audit trail of stock changes
- **inventory_forecasts**: AI-generated predictions
- **purchase_recommendations**: AI suggestions for restocking
- **sales_velocity**: Rolling window sales metrics
- **inventory_alerts**: Real-time alerts and notifications
- **inventory_ai_reports**: Historical AI analysis reports

### Views

- **products_needing_reorder**: Real-time view of products requiring restock
- **inventory_health_summary**: Dashboard-ready inventory status

---

## 🎨 Product Categories & Types

### Digital Products (No Physical Inventory)
- **Soundscapes**: Ambient audio files
- **Templates**: Ableton/DAW project files
- **Music**: Full albums and tracks
- **Software**: VST plugins and tools

### Physical Products (Requires Inventory Management)
- **Clothing**: Shirts, Hoodies, Pants
- **Hardware**: Effects Pedals, MIDI Controllers, Synthesizers

---

## 🔍 Monitoring & Maintenance

### Daily Tasks
1. Check inventory dashboard: `GET /api/inventory/dashboard`
2. Review alerts: `GET /api/inventory/alerts`
3. Generate daily AI report: `POST /api/inventory/reports/daily`

### Weekly Tasks
1. Generate 30-day forecast: `POST /api/inventory/forecast`
2. Review purchase recommendations: `GET /api/inventory/recommendations`
3. Approve/reject recommendations as needed

### Automated Tasks (Set up cron jobs)

```bash
# Update sales velocity daily at 2 AM
0 2 * * * curl -X POST http://localhost:5000/api/inventory/update-velocity

# Generate forecast weekly on Mondays at 3 AM
0 3 * * 1 curl -X POST http://localhost:5000/api/inventory/forecast

# Generate purchase recommendations daily at 4 AM
0 4 * * * curl -X POST http://localhost:5000/api/inventory/recommendations

# Generate daily report at 6 AM
0 6 * * * curl -X POST http://localhost:5000/api/inventory/reports/daily
```

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
# Windows:
services.msc  # Look for "postgresql" service

# macOS/Linux:
pg_isready

# Test connection
psql -U postgres -d algorithmic_acid -c "SELECT version();"
```

### Schema Initialization Errors

```bash
# Drop and recreate database
psql -U postgres
DROP DATABASE algorithmic_acid;
CREATE DATABASE algorithmic_acid;
\q

# Set INIT_SCHEMA=true and restart server
```

### AI Features Not Working

1. Verify `ANTHROPIC_API_KEY` is set correctly in `.env`
2. Check API key has sufficient credits at [console.anthropic.com](https://console.anthropic.com/)
3. Review server logs for API errors
4. Ensure you're using Claude Sonnet 4 or later

### Port Already in Use

```bash
# Change PORT in .env file
PORT=5001

# Or kill the process using the port
# Windows:
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# macOS/Linux:
lsof -ti:5000 | xargs kill -9
```

---

## 📈 Scaling & Production

### Database Optimization

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_products_category_stock ON products(category, stock_quantity);
CREATE INDEX idx_orders_created_status ON orders(created_at, status);

-- Regular maintenance
VACUUM ANALYZE;
```

### Performance Tips

1. **Connection Pooling**: Already configured (max 20 connections)
2. **Caching**: Consider adding Redis for frequently accessed data
3. **Read Replicas**: Set up PostgreSQL read replicas for analytics
4. **Background Jobs**: Move AI forecasting to a job queue (Bull, BullMQ)

### Security Checklist

- [ ] Change all default passwords
- [ ] Use environment variables for all secrets
- [ ] Enable PostgreSQL SSL connections
- [ ] Set up rate limiting on API endpoints
- [ ] Implement proper authentication middleware
- [ ] Use HTTPS in production
- [ ] Regular security updates for dependencies

---

## 🎯 Next Steps

1. **Frontend Integration**: Connect the React frontend to inventory API endpoints
2. **Admin Dashboard**: Build UI for viewing forecasts and approving purchases
3. **Email Notifications**: Alert on critical inventory levels
4. **Supplier Integration**: Connect to supplier APIs for automated ordering
5. **Analytics Dashboard**: Visualize trends with charts and graphs
6. **Mobile App**: Build inventory management mobile app
7. **Multi-warehouse**: Extend schema for multiple warehouse locations

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Anthropic Claude API Docs](https://docs.anthropic.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)

---

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs in the console
3. Check PostgreSQL logs
4. Verify environment variables are set correctly

---

**Built with PostgreSQL, Node.js, Express, React, and Claude AI** 🚀
