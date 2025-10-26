# CartSaver - Setup Guide

Complete installation and configuration guide for the CartSaver Trolley Management System.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 14.x or higher ([Download](https://www.postgresql.org/download/))
- **npm** or **yarn** package manager
- **Git** (optional, for version control)

## Quick Start

### 1. Clone or Download the Project

```bash
cd CartSaverDev
```

### 2. Database Setup

#### Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE cartsaver_db;

# Create user (optional)
CREATE USER cartsaver_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cartsaver_db TO cartsaver_user;

# Exit
\q
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your database credentials
# Update the following variables:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=cartsaver_db
# DB_USER=postgres
# DB_PASSWORD=your_password
# JWT_SECRET=your_secret_key_here

# Run database migrations
npm run migrate

# Seed database with sample data
npm run seed

# Start the server
npm run dev
```

The backend API will be running at `http://localhost:5000`

#### Backend Environment Variables

Edit `backend/.env` file:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cartsaver_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# CRON Job Configuration
INACTIVITY_THRESHOLD_DAYS=7
CRON_SCHEDULE=0 0 * * *

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 4. Frontend Setup

Open a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start the development server
npm start
```

The frontend application will open at `http://localhost:3000`

#### Frontend Environment Variables

Edit `frontend/.env` file:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_MAP_DEFAULT_LAT=-33.8830
REACT_APP_MAP_DEFAULT_LNG=18.6330
REACT_APP_MAP_DEFAULT_ZOOM=11
```

### 5. Login to the Application

Open your browser and navigate to `http://localhost:3000`

**Demo Credentials:**

- **Admin Account:**
  - Email: `admin@cartsaver.com`
  - Password: `admin123`

- **Staff Account:**
  - Email: `john@cartsaver.com`
  - Password: `staff123`

## Project Structure

```
CartSaverDev/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/       # Database and app configuration
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database models (Sequelize)
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth and validation
│   │   ├── services/     # Business logic
│   │   ├── jobs/         # CRON jobs
│   │   └── utils/        # Helper functions
│   ├── logs/             # Application logs
│   ├── .env              # Environment variables
│   ├── package.json
│   └── server.js         # Entry point
│
├── frontend/             # React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API calls
│   │   ├── utils/        # Helper functions
│   │   └── styles/       # CSS/Tailwind
│   ├── public/
│   ├── .env              # Environment variables
│   └── package.json
│
├── database/             # Database related files
│   ├── migrations/
│   └── seeds/
│
├── README.md             # Project overview
├── DATABASE_SCHEMA.md    # Database documentation
└── SETUP.md             # This file
```

## Testing the Application

### 1. Test Backend API

```bash
# Check health endpoint
curl http://localhost:5000/health

# Should return:
# {"status":"ok","timestamp":"...","uptime":...,"environment":"development"}
```

### 2. Test Trolley Scanning

1. Login to the frontend application
2. Navigate to "Scan" page
3. Enter a trolley RFID (e.g., `RFID-00001`)
4. Update the status
5. Check the status history

### 3. Test Automated Inactivity Detection

The CRON job runs daily at midnight. To test manually:

1. Open the backend code: `backend/src/jobs/inactivityCheck.js`
2. Import and call `checkInactiveTrolleys()` function
3. Or wait for the scheduled job to run

### 4. Test Map View

1. Navigate to "Map View" page
2. Verify that stores are displayed with markers
3. Click on markers to see trolley counts
4. Marker colors indicate trolley availability:
   - Green: ≥70% active trolleys
   - Yellow: 40-70% active trolleys
   - Red: <40% active trolleys

## Common Issues & Solutions

### Issue: Database Connection Failed

**Solution:**
- Verify PostgreSQL is running: `sudo service postgresql status` (Linux) or check Services (Windows)
- Check database credentials in `backend/.env`
- Ensure database exists: `psql -U postgres -l`

### Issue: Port Already in Use

**Solution:**
```bash
# Find process using port 5000 or 3000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# Linux/Mac:
lsof -ti:5000 | xargs kill -9
```

### Issue: CORS Errors

**Solution:**
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that backend is running on the correct port

### Issue: Map Not Loading

**Solution:**
- Verify internet connection (map tiles require internet)
- Check browser console for errors
- Ensure Leaflet CSS is loaded in `public/index.html`

## Production Deployment

### Backend Deployment

1. **Update Environment Variables:**
   ```env
   NODE_ENV=production
   DB_HOST=your_production_db_host
   JWT_SECRET=strong_random_secret_key
   ```

2. **Build and Run:**
   ```bash
   npm install --production
   npm start
   ```

3. **Use Process Manager (PM2):**
   ```bash
   npm install -g pm2
   pm2 start server.js --name cartsaver-api
   pm2 save
   pm2 startup
   ```

### Frontend Deployment

1. **Update Environment Variables:**
   ```env
   REACT_APP_API_URL=https://your-api-domain.com
   ```

2. **Build:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   - Upload `build/` folder to your hosting service
   - Configure web server (Nginx, Apache, etc.) to serve static files

### Database Backup

```bash
# Backup
pg_dump -U postgres cartsaver_db > backup.sql

# Restore
psql -U postgres cartsaver_db < backup.sql
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Trolleys
- `GET /api/trolleys` - List all trolleys
- `GET /api/trolleys/:id` - Get trolley details
- `POST /api/trolleys` - Create new trolley (Admin only)
- `PUT /api/trolleys/:id` - Update trolley (Admin only)
- `POST /api/trolleys/scan` - Scan and update trolley
- `GET /api/trolleys/:id/history` - Get status history

### Stores
- `GET /api/stores` - List all stores
- `GET /api/stores/:id` - Get store details
- `POST /api/stores` - Create store (Admin only)
- `PUT /api/stores/:id` - Update store (Admin only)
- `GET /api/stores/:id/trolleys` - Get trolleys by store

### Maintenance
- `GET /api/maintenance` - List maintenance records
- `POST /api/maintenance` - Create maintenance record
- `GET /api/maintenance/trolley/:id` - Get trolley maintenance

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/count` - Get unresolved count
- `PUT /api/alerts/:id/resolve` - Resolve alert

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/map` - Get map data
- `GET /api/dashboard/analytics` - Get analytics data

## Support

For issues or questions:
1. Check this setup guide
2. Review database schema in `DATABASE_SCHEMA.md`
3. Check application logs in `backend/logs/`
4. Review browser console for frontend errors

## License

MIT License - See LICENSE file for details
