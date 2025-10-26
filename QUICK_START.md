# CartSaver - Quick Start Guide

Get CartSaver up and running in under 10 minutes!

## ⚡ Prerequisites

- ✅ Node.js 18+ installed
- ✅ PostgreSQL 14+ installed and running
- ✅ Terminal/Command Prompt access

## 🚀 Installation Steps

### 1️⃣ Database Setup (2 minutes)

```bash
# Open PostgreSQL command line
psql -U postgres

# Create database
CREATE DATABASE cartsaver_db;

# Exit PostgreSQL
\q
```

### 2️⃣ Backend Setup (3 minutes)

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file (use your favorite editor)
# Update these lines:
# DB_PASSWORD=your_postgres_password
# JWT_SECRET=your_random_secret_key

# Run database migrations
npm run migrate

# Seed with sample data
npm run seed

# Start backend server
npm run dev
```

✅ Backend running at `http://localhost:5000`

### 3️⃣ Frontend Setup (3 minutes)

**Open a NEW terminal window**

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start frontend application
npm start
```

✅ Frontend opens automatically at `http://localhost:3000`

### 4️⃣ Login & Test (2 minutes)

**Open browser:** `http://localhost:3000`

**Login with:**
- Email: `admin@cartsaver.com`
- Password: `admin123`

**Quick Test:**
1. Click "Scan" in sidebar
2. Enter: `RFID-00001`
3. Click "Scan"
4. Change status to "Maintenance"
5. Click "Update Status"

✅ **Success!** You're now using CartSaver!

---

## 🎯 What's Included?

After seeding, you'll have:

- **4 Stores** (Durbanville, Bellville, Century City, Tyger Valley)
- **100 Trolleys** with various statuses
- **3 Users** (1 admin, 2 staff)
- **Sample maintenance records**
- **Active alerts** for testing

---

## 🗺️ Explore the Features

### Dashboard
- Navigate to `/` (home)
- View trolley statistics
- Check recent activity
- See store summaries

### Scan Trolley
- Navigate to `/scan`
- Try scanning: `RFID-00001`, `RFID-00002`, etc.
- Update trolley statuses
- Add notes to status changes

### Map View
- Navigate to `/map`
- See all stores on interactive map
- Click markers for trolley counts
- Color-coded by availability

### View Trolleys
- Navigate to `/trolleys`
- Browse all trolleys
- Filter by status
- Search by RFID or barcode

### Alerts
- Navigate to `/alerts`
- View system notifications
- Resolve alerts
- Filter by status

---

## 🛠️ Common Commands

### Backend

```bash
# Start dev server
npm run dev

# Run migrations
npm run migrate

# Seed database
npm run seed

# View logs
cat logs/combined.log
```

### Frontend

```bash
# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test
```

---

## 🔍 Troubleshooting

### Backend won't start

**Error:** "Database connection failed"

**Fix:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `backend/.env`
3. Ensure database exists: `psql -U postgres -l`

---

**Error:** "Port 5000 already in use"

**Fix:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

---

### Frontend won't start

**Error:** "Port 3000 already in use"

**Fix:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

---

**Error:** "Cannot connect to API"

**Fix:**
1. Ensure backend is running
2. Check `REACT_APP_API_URL` in `frontend/.env`
3. Clear browser cache and reload

---

### Database issues

**Error:** "Role does not exist"

**Fix:**
```bash
psql -U postgres
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cartsaver_db TO your_username;
```

---

**Error:** "Permission denied"

**Fix:**
```bash
# Give your user superuser privileges temporarily
psql -U postgres
ALTER USER your_username WITH SUPERUSER;
```

---

## 📚 Next Steps

Once you're up and running, explore:

1. **[SETUP.md](./SETUP.md)** - Detailed installation guide
2. **[TESTING.md](./TESTING.md)** - Test scenarios
3. **[API_REFERENCE.md](./API_REFERENCE.md)** - API documentation
4. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database structure
5. **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Complete overview

---

## 🎓 Sample Workflows

### Workflow 1: Scan and Update Trolley

1. Go to `/scan`
2. Enter `RFID-00010`
3. Click "Scan"
4. Select "Maintenance"
5. Add note: "Wheel needs replacing"
6. Click "Update Status"
7. Go to `/trolleys/10` to see history

### Workflow 2: Check Store Trolley Counts

1. Go to `/map`
2. Click on "Shoprite Durbanville" marker
3. View trolley counts in popup
4. Go to `/stores` to see all stores
5. Note stores below threshold (yellow warning)

### Workflow 3: Resolve an Alert

1. Go to `/alerts`
2. Filter "Unresolved"
3. Find an inactivity alert
4. Click "Resolve"
5. Alert moves to resolved list

### Workflow 4: View Maintenance History

1. Go to `/trolleys`
2. Click eye icon on any trolley
3. Scroll to "Maintenance Records" section
4. Or go to `/maintenance` for all records

---

## 🔐 Default Credentials

**Admin Account:**
- Email: `admin@cartsaver.com`
- Password: `admin123`
- Can: Everything (create, update, delete)

**Staff Account 1:**
- Email: `john@cartsaver.com`
- Password: `staff123`
- Can: View, scan, update (no delete)

**Staff Account 2:**
- Email: `sarah@cartsaver.com`
- Password: `staff123`
- Can: View, scan, update (no delete)

**⚠️ Change these passwords in production!**

---

## 📊 Test Data Overview

### Stores (4)
- Shoprite Durbanville (Threshold: 50)
- Shoprite Bellville (Threshold: 60)
- Shoprite Century City (Threshold: 80)
- Shoprite Tyger Valley (Threshold: 70)

### Trolleys (100)
- ~75 Active
- ~10 Maintenance
- ~8 Stolen
- ~5 Decommissioned
- ~2 Recovered

### Sample RFID Tags
- `RFID-00001` through `RFID-00100`
- Try any of these for scanning

---

## ⏱️ Automated Features

### Daily Inactivity Check (CRON)
- **Runs:** Every day at midnight
- **Action:** Flags trolleys not scanned for 7+ days as "Stolen"
- **Test:** Wait for midnight or manually trigger

### Hourly Shortage Check (CRON)
- **Runs:** Every hour
- **Action:** Creates alerts for stores below active threshold
- **Test:** Mark many trolleys as stolen, wait 1 hour

---

## 🎨 Color Coding

### Status Badges
- 🟢 **Active** - Green
- 🟡 **Maintenance** - Yellow
- 🔴 **Stolen** - Red
- ⚫ **Decommissioned** - Gray
- 🔵 **Recovered** - Blue

### Alert Severity
- 🔵 **Info** - Blue
- 🟡 **Warning** - Yellow
- 🔴 **Critical** - Red

### Map Markers
- 🟢 **Good** - ≥70% active trolleys
- 🟡 **Warning** - 40-70% active
- 🔴 **Critical** - <40% active

---

## 📱 Mobile Testing

1. Find your computer's local IP:
   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig
   ```

2. Update `frontend/.env`:
   ```
   REACT_APP_API_URL=http://YOUR_LOCAL_IP:5000
   ```

3. Update `backend/.env`:
   ```
   FRONTEND_URL=http://YOUR_LOCAL_IP:3000
   ```

4. Restart both servers

5. Access from phone: `http://YOUR_LOCAL_IP:3000`

---

## 🆘 Get Help

**Check logs:**
- Backend: `backend/logs/combined.log`
- Frontend: Browser console (F12)

**Common issues:**
- Database not running
- Wrong credentials in `.env`
- Port conflicts
- Missing dependencies

**Still stuck?**
1. Check `SETUP.md` for detailed instructions
2. Review `TESTING.md` for test scenarios
3. Verify all prerequisites are installed

---

## ✅ Quick Verification Checklist

After setup, verify these work:

- [ ] Backend health check: `http://localhost:5000/health`
- [ ] Frontend loads: `http://localhost:3000`
- [ ] Can login with admin credentials
- [ ] Dashboard shows statistics
- [ ] Can scan a trolley
- [ ] Can update trolley status
- [ ] Map displays stores with markers
- [ ] Alerts page shows notifications
- [ ] Can logout and login again

---

## 🎉 You're Ready!

CartSaver is now running successfully on your machine!

**Next actions:**
1. Explore all pages
2. Test scanning different trolleys
3. Try different user roles
4. Check out the map visualization
5. Review the code structure

**Happy testing! 🚀**
