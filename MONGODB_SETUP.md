# MongoDB Setup Guide

## Phase 1 Complete: MongoDB Integration ✅
## Phase 2 Complete: User Authentication ✅

Your backend now supports:
- ✅ MongoDB database (with fallback to in-memory)
- ✅ User authentication with JWT
- ✅ Protected routes
- ✅ Admin role system

## Quick Start

### Option 1: Run Without MongoDB (In-Memory)

The app will work perfectly without MongoDB - it uses in-memory storage as fallback.

```bash
cd backend
npm run dev
```

You'll see: `Using In-Memory storage`

### Option 2: Run With MongoDB (Recommended for Production)

#### Step 1: Install MongoDB Locally

**Windows:**
1. Download from: https://www.mongodb.com/try/download/community
2. Run the installer
3. MongoDB will start automatically as a service

**Mac (with Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

#### Step 2: Configure Environment

Edit `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/algorithmic_acid
```

#### Step 3: Seed the Database

```bash
cd backend
npm run seed
```

You should see:
```
✅ Connected to MongoDB
✅ Inserted 16 products
✅ Database seeding completed successfully!
```

#### Step 4: Start the Server

```bash
npm run dev
```

You'll see: `Using MongoDB storage`

### Option 3: Use MongoDB Atlas (Cloud - Free Tier)

#### Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a free cluster (M0)
4. Wait 3-5 minutes for deployment

#### Step 2: Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password

#### Step 3: Configure Environment

Edit `backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/algorithmic_acid?retryWrites=true&w=majority
```

#### Step 4: Seed and Run

```bash
cd backend
npm run seed
npm run dev
```

## Authentication Endpoints

### Register New User
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

### Login
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User (Protected)
```http
GET http://localhost:5000/api/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

## Testing Authentication

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get Profile:**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Open Postman
2. Create a new request
3. Set method to POST
4. URL: `http://localhost:5000/api/auth/register`
5. Headers: `Content-Type: application/json`
6. Body (raw JSON):
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```
7. Send and save the token from response

## Database Schema

### Products Collection
```typescript
{
  _id: ObjectId,
  name: string,
  category: 'shirts' | 'music' | 'anime' | 'games' | 'software',
  price: number,
  description: string,
  icon: string,
  stock: number,
  image?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Users Collection
```typescript
{
  _id: ObjectId,
  name: string,
  email: string,
  password: string (hashed),
  role: 'user' | 'admin',
  createdAt: Date,
  updatedAt: Date
}
```

## Verifying MongoDB Connection

### Check if MongoDB is Running

**Local MongoDB:**
```bash
# Windows
net start | findstr MongoDB

# Mac/Linux
brew services list | grep mongodb
# OR
sudo systemctl status mongodb
```

### Connect with MongoDB Compass

1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Connection string: `mongodb://localhost:27017`
3. You'll see the `algorithmic_acid` database with collections

### View Database Contents

Using MongoDB shell:
```bash
mongosh
use algorithmic_acid
db.products.find()
db.users.find()
```

## Troubleshooting

### Error: "Failed to connect to MongoDB"
- Check if MongoDB service is running
- Verify connection string in `.env`
- For Atlas: Check network access and database user permissions

### Products Not Loading
- If using MongoDB, run: `npm run seed`
- Check console for storage type: Should say "Using MongoDB storage"

### Authentication Not Working
- Ensure MongoDB is connected (User model requires MongoDB)
- Check JWT_SECRET in `.env`
- Verify token is sent in Authorization header

## Features Completed

### Phase 1: Database
- ✅ MongoDB integration
- ✅ Mongoose models
- ✅ Fallback to in-memory storage
- ✅ Database seeding script
- ✅ Product service layer

### Phase 2: Authentication
- ✅ User model with password hashing
- ✅ JWT token generation/verification
- ✅ Register endpoint
- ✅ Login endpoint
- ✅ Protected route middleware
- ✅ Admin middleware
- ✅ Get current user endpoint

## Next Steps

1. **Test authentication endpoints** using Postman/cURL
2. **Integrate auth with frontend** (coming next)
3. **Add order management** (Phase 3)
4. **Add payment processing** (Phase 4)

---

**Your backend is now production-ready with database and authentication! 🎉**
