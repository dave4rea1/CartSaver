# CartSaver Deployment Guide

Complete guide to deploy CartSaver to production hosting platforms.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Hosting Options](#hosting-options)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment Steps](#post-deployment-steps)

---

## Pre-Deployment Checklist

✅ **Completed:**
- [x] Removed sensitive data from repository
- [x] Added .env files to .gitignore
- [x] Created .env.example files for both frontend and backend
- [x] No hardcoded credentials in code
- [x] Added engine specifications to package.json
- [x] Created root package.json for monorepo
- [x] Pushed code to GitHub: https://github.com/dave4rea1/CartSaver

⚠️ **Before Deployment:**
- [ ] Generate a secure JWT_SECRET: `openssl rand -base64 32`
- [ ] Set up production database (PostgreSQL)
- [ ] Configure SMTP for email alerts (optional)
- [ ] Set up Redis for caching (recommended)
- [ ] Configure production environment variables

---

## Hosting Options

### Recommended Platforms

#### Option 1: Vercel (Frontend) + Render (Backend) ⭐ EASIEST
**Best for:** Quick deployment, free tier available

**Frontend (Vercel):**
- Free tier with excellent performance
- Automatic deployments from GitHub
- Built-in SSL certificates
- Global CDN

**Backend (Render):**
- Free tier (with some limitations)
- PostgreSQL database included
- Automatic SSL
- Easy environment variable management

**Cost:** Free tier available, ~$7-15/month for production

---

#### Option 2: Railway (Full Stack) ⭐ RECOMMENDED
**Best for:** Simplicity, all-in-one solution

**Features:**
- Deploy both frontend and backend
- PostgreSQL database included
- Redis caching available
- Automatic deployments from GitHub
- Great free tier ($5 credit monthly)

**Cost:** Pay-as-you-go, ~$10-20/month

---

#### Option 3: DigitalOcean App Platform
**Best for:** Scalability, production workloads

**Features:**
- Full stack deployment
- Managed PostgreSQL
- Redis available
- Auto-scaling
- Multiple regions

**Cost:** ~$12-25/month (no free tier)

---

#### Option 4: AWS / Google Cloud / Azure
**Best for:** Enterprise, full control

**Cost:** ~$15-50/month (complex pricing)

---

## Detailed Deployment Instructions

### Option 1: Vercel + Render (Recommended for Beginners)

#### Part A: Deploy PostgreSQL Database (Render)

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub
   - Connect your CartSaver repository

2. **Create PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - Database name: `cartsaver-db`
   - Plan: Free or Starter ($7/month)
   - Click "Create Database"
   - **Save the connection details:**
     - Internal Database URL
     - External Database URL
     - Host, Port, Database, User, Password

#### Part B: Deploy Backend API (Render)

1. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select "CartSaver"

2. **Configure Service:**
   ```
   Name: cartsaver-backend
   Environment: Node
   Build Command: cd backend && npm install
   Start Command: cd backend && npm start
   Plan: Free or Starter ($7/month)
   ```

3. **Add Environment Variables:**
   ```env
   NODE_ENV=production
   PORT=5000

   # Database (from step above)
   DB_HOST=<your-render-db-host>
   DB_PORT=5432
   DB_NAME=cartsaver_db
   DB_USER=<your-db-user>
   DB_PASSWORD=<your-db-password>

   # JWT (generate with: openssl rand -base64 32)
   JWT_SECRET=<your-generated-secret>
   JWT_EXPIRES_IN=7d

   # Frontend URL (will update after deploying frontend)
   FRONTEND_URL=https://your-app.vercel.app

   # Optional: Redis, SMTP
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (~3-5 minutes)
   - **Save your backend URL:** `https://cartsaver-backend.onrender.com`

5. **Run Database Migrations:**
   - Go to Shell tab in Render dashboard
   - Run: `cd backend && npm run migrate`
   - Run: `cd backend && npm run seed` (optional for demo data)

#### Part C: Deploy Frontend (Vercel)

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select "CartSaver" repository
   - Framework Preset: Create React App
   - Root Directory: `frontend`

3. **Configure Build Settings:**
   ```
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

4. **Add Environment Variables:**
   ```env
   REACT_APP_API_URL=https://cartsaver-backend.onrender.com
   REACT_APP_MAP_DEFAULT_LAT=-33.8830
   REACT_APP_MAP_DEFAULT_LNG=18.6330
   REACT_APP_MAP_DEFAULT_ZOOM=11
   GENERATE_SOURCEMAP=false
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait for build (~2-3 minutes)
   - **Your app is live!** `https://your-app.vercel.app`

6. **Update Backend CORS:**
   - Go back to Render backend settings
   - Update `FRONTEND_URL` to your Vercel URL
   - Redeploy backend

---

### Option 2: Railway (Full Stack)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose "CartSaver"

3. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway auto-configures connection

4. **Deploy Backend Service**
   - Click "New" → "GitHub Repo"
   - Root Directory: `/backend`
   - Start Command: `npm start`
   - Add Environment Variables (similar to Render setup)
   - Generate Domain for API

5. **Deploy Frontend Service**
   - Click "New" → "GitHub Repo"
   - Root Directory: `/frontend`
   - Build Command: `npm run build`
   - Start Command: `npx serve -s build -p $PORT`
   - Add Environment Variables
   - Generate Domain

6. **Run Migrations**
   - Click on backend service
   - Open Terminal
   - Run: `npm run migrate && npm run seed`

---

## Environment Variables Reference

### Backend (.env)

```env
# ========================================
# PRODUCTION ENVIRONMENT VARIABLES
# ========================================

# Application
NODE_ENV=production
PORT=5000
API_BASE_URL=https://your-backend-url.com

# Frontend (CORS)
FRONTEND_URL=https://your-frontend-url.com

# Database - PostgreSQL
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=cartsaver_db
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_POOL_MAX=20
DB_POOL_MIN=5

# JWT Authentication
# Generate: openssl rand -base64 32
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
JWT_EXPIRES_IN=7d

# Redis (Optional but Recommended)
REDIS_URL=redis://your-redis-url:6379
# OR
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# CRON Jobs
INACTIVITY_THRESHOLD_DAYS=7
CRON_SCHEDULE=0 0 * * *

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=cartsaver@yourdomain.com

# Logging
LOG_LEVEL=info

# Security
ENABLE_HELMET=true
ENABLE_CORS=true
```

### Frontend (.env)

```env
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_MAP_DEFAULT_LAT=-33.8830
REACT_APP_MAP_DEFAULT_LNG=18.6330
REACT_APP_MAP_DEFAULT_ZOOM=11
GENERATE_SOURCEMAP=false
```

---

## Post-Deployment Steps

### 1. Verify Deployment

**Backend Health Check:**
```bash
curl https://your-backend-url.com/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Test API Endpoints

```bash
# Test login
curl -X POST https://your-backend-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cartsaver.com","password":"admin123"}'

# Test trolleys endpoint (with token)
curl https://your-backend-url.com/api/trolleys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Create Admin User

**Option A: Using seed script**
```bash
# In backend terminal
npm run seed
```
Default admin credentials:
- Email: `admin@cartsaver.com`
- Password: `admin123`
**⚠️ Change immediately in production!**

**Option B: Manual creation**
```bash
# Connect to PostgreSQL
# Run SQL:
INSERT INTO users (email, password, role, first_name, last_name)
VALUES ('admin@yourdomain.com', '$2b$10$...hashed...', 'admin', 'Admin', 'User');
```

### 4. Configure SSL/HTTPS
- Vercel & Render: Automatic SSL ✅
- Railway: Automatic SSL ✅
- Custom domains: Configure in platform settings

### 5. Set Up Monitoring

**Recommended Tools:**
- **Sentry** - Error tracking (free tier)
- **LogRocket** - Session replay
- **UptimeRobot** - Uptime monitoring (free)

**Add Sentry (Optional):**
```bash
npm install @sentry/react @sentry/node
```

### 6. Enable Auto-Deployments
- Link GitHub repository
- Enable automatic deployments on push to `master`
- Set up staging environment on `develop` branch

### 7. Database Backups

**Render:**
- Automatic backups on Starter plan and above
- Manual backups in dashboard

**Railway:**
- Automatic daily backups
- Point-in-time recovery available

**Custom Backup Script:**
```bash
# Add to cron job
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## Performance Optimization

### 1. Enable Redis Caching

**Railway:**
- Add Redis plugin
- Set `REDIS_URL` environment variable

**Render:**
- Create Redis instance
- Update environment variables

### 2. CDN Configuration

**Cloudflare (Free):**
- Add your domain to Cloudflare
- Configure DNS
- Enable caching and compression

### 3. Database Optimization

```sql
-- Add indexes (already in migrations)
CREATE INDEX idx_trolleys_store_status ON trolleys(store_id, status);
CREATE INDEX idx_trolleys_last_scan ON trolleys(last_scan_at);

-- Analyze database
ANALYZE;
```

---

## Security Checklist

- [ ] Changed default admin password
- [ ] Generated secure JWT_SECRET (32+ chars)
- [ ] Enabled HTTPS/SSL
- [ ] Configured CORS properly
- [ ] Set secure database password
- [ ] Enabled Helmet security headers
- [ ] Rate limiting enabled
- [ ] Environment variables secured
- [ ] .env files not in git repository
- [ ] Database backups configured

---

## Troubleshooting

### Issue: Backend won't start

**Check:**
1. Environment variables set correctly
2. Database connection string valid
3. Port not already in use
4. Build command successful

**Logs:**
```bash
# Render: View in dashboard logs
# Railway: Click service → View logs
# Vercel: Check Functions tab
```

### Issue: Frontend can't connect to backend

**Check:**
1. `REACT_APP_API_URL` is correct
2. CORS configured with correct frontend URL
3. Backend is running and accessible
4. SSL/HTTPS enabled on both

### Issue: Database connection failed

**Check:**
1. Database is running
2. Connection string format: `postgresql://user:pass@host:port/db`
3. Firewall/security groups allow connections
4. SSL mode configured if required

### Issue: 502 Bad Gateway

**Possible causes:**
- Backend crashed (check logs)
- Out of memory (upgrade plan)
- Build failed (check build logs)

---

## Cost Estimates

### Free Tier (Development)
- **Vercel:** Free frontend hosting
- **Render:** Free backend + PostgreSQL (limited)
- **Total:** $0/month
- **Limitations:** Sleeps after inactivity, limited resources

### Production Starter
- **Render Backend:** $7/month
- **Render PostgreSQL:** $7/month
- **Vercel Pro:** $20/month (optional)
- **Redis:** $5-10/month
- **Total:** $14-44/month

### Production Scale
- **Railway:** $20-50/month (all-in-one)
- **DigitalOcean:** $24-48/month
- **AWS/GCP:** $30-100/month (variable)

---

## Support & Resources

### Platform Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app)

### CartSaver Resources
- **GitHub:** https://github.com/dave4rea1/CartSaver
- **Issues:** https://github.com/dave4rea1/CartSaver/issues
- **Setup Guide:** See [SETUP.md](./SETUP.md)
- **API Reference:** See [API_REFERENCE.md](./API_REFERENCE.md)

---

## Quick Deploy Commands

### Deploy to Vercel (Frontend)
```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Deploy to Railway (Full Stack)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Manual Server Deployment
```bash
# Clone repository
git clone https://github.com/dave4rea1/CartSaver.git
cd CartSaver

# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with production values

# Run migrations
cd backend && npm run migrate && npm run seed

# Build frontend
cd ../frontend && npm run build

# Start services
cd ../backend && npm start & # Backend on port 5000
# Serve frontend build with nginx/serve/etc
```

---

## Next Steps

After successful deployment:

1. **Custom Domain** - Add your domain in platform settings
2. **Email Setup** - Configure SMTP for alert notifications
3. **Analytics** - Add Google Analytics or similar
4. **Monitoring** - Set up error tracking with Sentry
5. **CI/CD** - Configure GitHub Actions for automated testing
6. **Documentation** - Update README with production URLs

---

**Deployment completed?** 🎉

Test your live application and update this checklist:
- [ ] Backend API accessible
- [ ] Frontend loads correctly
- [ ] Login works
- [ ] Database operations successful
- [ ] Real-time features working
- [ ] GPS tracking functional
- [ ] Admin panel accessible

**Need help?** Open an issue on GitHub or check the troubleshooting section above.

---

Generated with Claude Code
https://claude.com/claude-code
