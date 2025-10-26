# CartSaver Debugging Guide

This guide helps you troubleshoot and fix common issues in the CartSaver application.

## Quick Fixes Applied

### 1. ✅ Fixed Rate Limiting Issue
**Problem:** API was blocking too many requests in development mode.

**Solution:** Updated rate limiting in `backend/server.js` to allow 1000 requests per 15 minutes in development (vs 100 in production).

### 2. ✅ Enhanced Error Handling
**Problem:** Generic error messages made debugging difficult.

**Solution:** Added detailed error logging and improved error responses in:
- `backend/src/controllers/storeController.js`
- `backend/src/controllers/dashboardController.js`
- `backend/src/controllers/maintenanceController.js`

### 3. ✅ Fixed Scan Feature (RFID & Barcode)
**Problem:** Scan feature wasn't working with case variations or whitespace.

**Solution:** Updated `backend/src/controllers/trolleyController.js` to:
- Use case-insensitive search (`Op.iLike`)
- Trim whitespace from input
- Add validation

### 4. ✅ Improved Frontend Error Handling
**Problem:** Dashboard showed repetitive error toasts and crashed on errors.

**Solution:** Updated `frontend/src/pages/Dashboard.js` to:
- Set empty fallback data on errors
- Only show toast for non-auth errors (401 redirects automatically)
- Display detailed error messages from backend

---

## Testing the Application

### Test Database Connection

Run this command to verify your database is properly configured:

```bash
cd backend
node test-db-connection.js
```

This will show:
- ✅ Connection status
- 📊 PostgreSQL version
- 📋 Available tables
- 📈 Record counts

### Test Backend API

1. **Check if backend is running:**
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-13T18:15:47.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

2. **Test authentication:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'
```

3. **Test stores endpoint (with auth token):**
```bash
curl http://localhost:5000/api/stores \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Common Issues & Solutions

### Issue 1: "Failed to load stores"

**Possible Causes:**
1. ❌ Backend not running
2. ❌ Database connection failed
3. ❌ Not authenticated
4. ❌ Rate limit exceeded

**Solutions:**

**A. Check if backend is running:**
```bash
netstat -ano | findstr :5000
```
If nothing shows up, start the backend:
```bash
cd backend
npm start
```

**B. Check database connection:**
```bash
cd backend
node test-db-connection.js
```

**C. Login to the application:**
- Navigate to `http://localhost:3000/login`
- Enter valid credentials
- Check browser console for auth token

**D. Reset rate limit:**
Restart the backend server or wait 15 minutes.

---

### Issue 2: "Failed to load dashboard data"

**Possible Causes:**
1. ❌ Authentication token expired
2. ❌ Database query error
3. ❌ Missing data in tables

**Solutions:**

**A. Clear localStorage and re-login:**
```javascript
// In browser console:
localStorage.clear();
window.location.href = '/login';
```

**B. Check backend logs:**
```bash
# If running in terminal, check the console output
# Look for errors starting with "Error in getDashboardStats:"
```

**C. Verify data exists:**
```bash
cd backend
node test-db-connection.js
```

---

### Issue 3: "Scan feature not working"

**Possible Causes:**
1. ❌ Trolley doesn't exist in database
2. ❌ Case mismatch in RFID/barcode
3. ❌ Extra whitespace in input

**Solutions:**

**A. The scan feature now handles:**
- ✅ Case-insensitive search
- ✅ Automatic whitespace trimming
- ✅ Both RFID and barcode matching

**B. Verify trolley exists:**
Check the trolleys table for your RFID tag or barcode.

**C. Check error message:**
The scan page now shows detailed error messages if trolley is not found.

---

### Issue 4: Backend won't start - "EADDRINUSE"

**Problem:** Port 5000 is already in use.

**Solutions:**

**A. Find and kill the process:**
```bash
# Find process on port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /F /PID <PID>
```

**B. Use a different port:**
Update `.env` file:
```
PORT=5001
```

Then update frontend `.env`:
```
REACT_APP_API_URL=http://localhost:5001
```

---

### Issue 5: Database connection failed

**Possible Causes:**
1. ❌ PostgreSQL not running
2. ❌ Wrong credentials
3. ❌ Database doesn't exist
4. ❌ Firewall blocking connection

**Solutions:**

**A. Check if PostgreSQL is running:**
```bash
netstat -ano | findstr :5432
```

If not running, start PostgreSQL service.

**B. Verify .env configuration:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cartsaver_db
DB_USER=postgres
DB_PASSWORD=your_password
```

**C. Create database if it doesn't exist:**
```bash
psql -U postgres
CREATE DATABASE cartsaver_db;
\q
```

**D. Run migrations:**
```bash
cd backend
npm run migrate
```

---

## Environment Variables Checklist

### Backend (.env)
- [ ] `NODE_ENV=development`
- [ ] `PORT=5000`
- [ ] `DB_HOST=localhost`
- [ ] `DB_PORT=5432`
- [ ] `DB_NAME=cartsaver_db`
- [ ] `DB_USER=postgres`
- [ ] `DB_PASSWORD=your_password`
- [ ] `JWT_SECRET=your_secret_key`
- [ ] `FRONTEND_URL=http://localhost:3000`

### Frontend (.env)
- [ ] `REACT_APP_API_URL=http://localhost:5000`

---

## Development Workflow

### Starting the Application

1. **Start PostgreSQL** (if not already running)

2. **Start Backend:**
```bash
cd backend
npm install
npm start
```

3. **Start Frontend (in new terminal):**
```bash
cd frontend
npm install
npm start
```

4. **Access Application:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health Check: http://localhost:5000/health

---

## Monitoring & Logs

### Backend Logs
Backend uses Winston logger. Check console output for:
- 🟢 `info` - Normal operations
- 🟡 `warn` - Warnings
- 🔴 `error` - Errors

### Frontend Logs
Open browser DevTools (F12):
- **Console tab:** JavaScript errors and logs
- **Network tab:** API request/response details
- **Application tab:** LocalStorage (tokens, selectedStoreId)

---

## Performance Issues

### Slow Dashboard Loading

**Optimizations Applied:**
1. ✅ Added loading states with skeleton UI
2. ✅ Optimized database queries
3. ✅ Reduced rate limiting in development

**Additional Tips:**
- Use the store filter to limit data
- Check database indexing
- Monitor query execution time in backend logs

---

## Need More Help?

### Debug Mode

Enable detailed logging:

**Backend:**
Set in `.env`:
```env
LOG_LEVEL=debug
```

**Frontend:**
Check browser console for detailed error messages (already enabled).

### Database Query Logging

Already enabled in development mode. Check terminal for SQL queries being executed.

---

## Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `backend/server.js` | Increased rate limit for dev | Prevent API blocking |
| `backend/src/controllers/storeController.js` | Enhanced error logging | Better debugging |
| `backend/src/controllers/dashboardController.js` | Enhanced error logging | Better debugging |
| `backend/src/controllers/maintenanceController.js` | Enhanced error logging | Better debugging |
| `backend/src/controllers/trolleyController.js` | Case-insensitive scan | Fix RFID/barcode search |
| `frontend/src/pages/Dashboard.js` | Improved error handling | Prevent UI crashes |
| `frontend/src/services/api.js` | Added params to dashboard | Support store filtering |

---

**Last Updated:** 2025-10-13
**Version:** 1.0.0
