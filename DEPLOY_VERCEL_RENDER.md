# CartSaver Deployment: Vercel + Render (Step-by-Step)

Complete walkthrough to deploy CartSaver using Vercel (Frontend) + Render (Backend & Database).

**Total Time:** ~30 minutes
**Cost:** Free tier available (Development), ~$14/month (Production)

---

## Prerequisites

- [x] Code pushed to GitHub: https://github.com/dave4rea1/CartSaver
- [ ] GitHub account
- [ ] Email address for Render and Vercel accounts
- [ ] Computer with terminal/command prompt access

---

## Part 1: Deploy PostgreSQL Database (Render) - 5 minutes

### Step 1.1: Create Render Account

1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Click **"Sign up with GitHub"**
4. Authorize Render to access your GitHub account
5. Complete your profile (name, email verification)

### Step 1.2: Create PostgreSQL Database

1. Once logged in, click the **"New +"** button (top right)
2. Select **"PostgreSQL"** from the dropdown

3. **Configure Database:**
   ```
   Name: cartsaver-db
   Database: cartsaver_db
   User: cartsaver_user
   Region: Choose closest to your users (e.g., Oregon USA, Frankfurt EU, Singapore)
   PostgreSQL Version: 15 (or latest)
   Plan: Free (for testing) or Starter ($7/month for production)
   ```

4. Click **"Create Database"**
5. Wait 2-3 minutes for provisioning

### Step 1.3: Save Database Credentials

Once database is created, scroll down to **"Connections"** section and save these details:

**Internal Database URL (for Render services):**
```
postgresql://cartsaver_user:****@dpg-*****.oregon-postgres.render.com/cartsaver_db
```

**External Database URL (for local connections):**
```
postgresql://cartsaver_user:****@dpg-*****.oregon-postgres.render.com/cartsaver_db?ssl=true
```

**Individual credentials (you'll need these):**
```
Hostname: dpg-******.oregon-postgres.render.com
Port: 5432
Database: cartsaver_db
Username: cartsaver_user
Password: [long random string - SAVE THIS!]
```

⚠️ **IMPORTANT:** Copy and paste these to a secure text file. You'll need them in the next step!

---

## Part 2: Deploy Backend API (Render) - 10 minutes

### Step 2.1: Create Web Service

1. Click **"New +"** button again
2. Select **"Web Service"**
3. Click **"Build and deploy from a Git repository"** → **"Next"**
4. If this is your first time:
   - Click **"Connect account"** next to GitHub
   - Authorize Render to access your repositories
5. Find and select **"CartSaver"** from the list
6. Click **"Connect"**

### Step 2.2: Configure Web Service

Fill in the following settings:

**Basic Settings:**
```
Name: cartsaver-backend
Region: [Same as your database - e.g., Oregon]
Branch: master
Root Directory: backend
Runtime: Node
```

**Build & Deploy Settings:**
```
Build Command: npm install
Start Command: npm start
```

**Plan:**
```
Free (for testing - sleeps after 15 min inactivity)
OR
Starter ($7/month - always on, recommended for production)
```

### Step 2.3: Add Environment Variables

Scroll down to **"Environment Variables"** section and click **"Add Environment Variable"**

Add these one by one (click "+ Add" for each):

```env
NODE_ENV = production
PORT = 5000

# Database - Use the credentials from Part 1 Step 1.3
DB_HOST = dpg-******.oregon-postgres.render.com
DB_PORT = 5432
DB_NAME = cartsaver_db
DB_USER = cartsaver_user
DB_PASSWORD = [paste your database password here]

# JWT - Generate a secure secret
JWT_SECRET = [SEE BELOW - Generate this]
JWT_EXPIRES_IN = 7d

# Frontend URL - We'll update this after deploying frontend
FRONTEND_URL = http://localhost:3000

# Optional but recommended
DB_POOL_MAX = 20
DB_POOL_MIN = 5
LOG_LEVEL = info
ENABLE_HELMET = true
ENABLE_CORS = true

# Cron job settings
INACTIVITY_THRESHOLD_DAYS = 7
CRON_SCHEDULE = 0 0 * * *
```

**🔐 Generate JWT_SECRET:**

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
$bytes = New-Object byte[] 32
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**Or use an online tool:**
Go to https://generate-secret.vercel.app/32 and copy the generated string

Paste the generated string as your `JWT_SECRET` value.

### Step 2.4: Deploy Backend

1. Scroll to the bottom
2. Click **"Create Web Service"**
3. Wait for deployment (3-5 minutes)
4. Watch the logs - you should see:
   ```
   ==> Installing dependencies
   ==> Building...
   ==> Starting server...
   Server running on port 5000
   ```

### Step 2.5: Get Backend URL

Once deployed (status shows "Live" with green dot):

1. Look at the top of the page for your service URL:
   ```
   https://cartsaver-backend.onrender.com
   ```
2. **SAVE THIS URL** - you'll need it for the frontend!

### Step 2.6: Test Backend

Click on the URL to test. You might see:
- `Cannot GET /` - This is NORMAL (no route at root)

Test the health endpoint by adding `/api/health` to your URL:
```
https://cartsaver-backend.onrender.com/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

If you see this, your backend is working! 🎉

### Step 2.7: Run Database Migrations

Your backend is running but the database is empty. Let's set it up:

1. In your Render dashboard, click on **"cartsaver-backend"** service
2. Click the **"Shell"** tab (top navigation)
3. Wait for terminal to load (a command prompt will appear)
4. Run the following commands one by one:

```bash
# Navigate to backend directory (if needed)
cd backend

# Run database migrations to create tables
npm run migrate

# Seed the database with sample data (OPTIONAL)
npm run seed
```

**Expected output:**
```
✓ Migrations completed successfully
✓ Tables created: users, stores, trolleys, alerts, etc.
✓ Seeded 2 stores, 10 trolleys, 2 users
```

**Default admin credentials (if you ran seed):**
```
Email: admin@cartsaver.com
Password: admin123
```
⚠️ **Change this password immediately after first login!**

**If migrations fail:**
- Check that DB_HOST, DB_PASSWORD are correct in environment variables
- Make sure database is running (check PostgreSQL tab)
- Look at error messages carefully

---

## Part 3: Deploy Frontend (Vercel) - 10 minutes

### Step 3.1: Create Vercel Account

1. Go to **https://vercel.com**
2. Click **"Start Deploying"** or **"Sign Up"**
3. Click **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account
5. Complete profile setup

### Step 3.2: Import CartSaver Project

1. On Vercel dashboard, click **"Add New..."** → **"Project"**
2. You'll see your GitHub repositories
3. Find **"CartSaver"** and click **"Import"**

### Step 3.3: Configure Build Settings

Vercel should auto-detect it's a Create React App, but verify these settings:

**Configure Project:**
```
Framework Preset: Create React App
Root Directory: frontend
```

Click **"Edit"** next to Root Directory and select **"frontend"**

**Build Settings (should auto-fill):**
```
Build Command: npm run build
Output Directory: build
Install Command: npm install
Development Command: npm start
```

### Step 3.4: Add Environment Variables

Click on **"Environment Variables"** section:

Add these variables (click "Add" for each):

```env
REACT_APP_API_URL = https://cartsaver-backend.onrender.com

REACT_APP_MAP_DEFAULT_LAT = -33.8830
REACT_APP_MAP_DEFAULT_LNG = 18.6330
REACT_APP_MAP_DEFAULT_ZOOM = 11

GENERATE_SOURCEMAP = false
```

**⚠️ IMPORTANT:** Replace `https://cartsaver-backend.onrender.com` with YOUR actual backend URL from Part 2 Step 2.5

Make sure to include the `https://` and NO trailing slash!

### Step 3.5: Deploy Frontend

1. Click **"Deploy"**
2. Wait for build (2-4 minutes)
3. Watch the build logs:
   ```
   Installing dependencies...
   Building production bundle...
   Optimizing assets...
   Deployment ready!
   ```

### Step 3.6: Get Frontend URL

Once deployed (you'll see confetti 🎉):

1. Click **"Continue to Dashboard"**
2. Your live URL will be shown:
   ```
   https://cart-saver-xyz.vercel.app
   ```
3. Click **"Visit"** to open your app!

### Step 3.7: Test Frontend

Your app should load and show:
- Login page
- No errors in browser console (F12)

Try logging in with the seeded admin account:
```
Email: admin@cartsaver.com
Password: admin123
```

If login works and you see the dashboard - SUCCESS! 🎉

---

## Part 4: Update CORS Settings - 5 minutes

Now that frontend is deployed, update backend to allow requests from it:

### Step 4.1: Update Backend Environment Variable

1. Go back to **Render dashboard** (render.com)
2. Click on **"cartsaver-backend"** service
3. Click **"Environment"** in the left sidebar
4. Find `FRONTEND_URL` variable
5. Click the **Edit** button (pencil icon)
6. Change value from `http://localhost:3000` to your Vercel URL:
   ```
   https://cart-saver-xyz.vercel.app
   ```
7. Click **"Save Changes"**

### Step 4.2: Redeploy Backend

1. Backend will automatically redeploy (watch for "Deploying..." status)
2. Wait 1-2 minutes for redeployment
3. Once done (green "Live" dot), test your frontend again

---

## Part 5: Final Testing - 5 minutes

### Test Checklist

Go to your Vercel URL and test:

- [ ] **Login page loads** without errors
- [ ] **Login works** with admin credentials
- [ ] **Dashboard displays** with stats
- [ ] **Navigation works** (click sidebar items)
- [ ] **Trolley list loads** (even if empty)
- [ ] **Store list loads**
- [ ] **No console errors** (Press F12 → Console tab)

### Test API Directly

**Test 1: Health Check**
```
https://cartsaver-backend.onrender.com/api/health
```
Should return: `{"status":"ok",...}`

**Test 2: Login API**
```bash
curl -X POST https://cartsaver-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cartsaver.com","password":"admin123"}'
```

Should return a JWT token:
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": 1,
    "email": "admin@cartsaver.com",
    "role": "admin"
  }
}
```

---

## Part 6: Post-Deployment Tasks

### 6.1: Change Default Password

1. Log in to your app with admin credentials
2. Go to Profile/Settings (if implemented)
3. Change password from `admin123` to something secure
4. If no UI for password change, update directly in database:
   - Go to Render → PostgreSQL database
   - Click "Connect" → "External Connection"
   - Use a PostgreSQL client or command line
   - Run: `UPDATE users SET password = crypt('new_password', gen_salt('bf')) WHERE email = 'admin@cartsaver.com';`

### 6.2: Set Up Custom Domain (Optional)

**On Vercel:**
1. Go to Project Settings → Domains
2. Add your domain (e.g., cartsaver.com)
3. Follow DNS configuration instructions
4. Wait for SSL provisioning (automatic)

**Update Backend:**
1. Update `FRONTEND_URL` in Render environment variables to your custom domain
2. Redeploy backend

### 6.3: Enable Automatic Deployments

**Frontend (Vercel):**
- Already enabled by default!
- Every push to `master` branch automatically deploys

**Backend (Render):**
- Already enabled by default!
- Every push to `master` branch automatically deploys

### 6.4: Set Up Monitoring (Optional but Recommended)

**Free uptime monitoring:**
1. Sign up at **https://uptimerobot.com** (free)
2. Add monitors for:
   - Frontend: `https://your-app.vercel.app`
   - Backend health: `https://cartsaver-backend.onrender.com/api/health`
3. Get email alerts if site goes down

**Error tracking:**
1. Sign up at **https://sentry.io** (free tier)
2. Add Sentry to your frontend and backend
3. Get notified of JavaScript errors and API crashes

---

## Troubleshooting

### Issue: Frontend shows "Network Error" or "Failed to fetch"

**Causes:**
1. Backend not running (check Render logs)
2. Wrong `REACT_APP_API_URL` (must match exactly)
3. CORS not configured (check `FRONTEND_URL` in backend)

**Fix:**
1. Verify backend is "Live" (green dot) in Render
2. Check frontend environment variables in Vercel
3. Verify CORS settings in backend environment variables
4. Check browser console (F12) for exact error

### Issue: Login fails with 401 or 500 error

**Causes:**
1. Database not migrated
2. No user accounts exist
3. Wrong credentials

**Fix:**
1. Run migrations: `npm run migrate` in Render shell
2. Run seed script: `npm run seed`
3. Verify credentials: `admin@cartsaver.com` / `admin123`

### Issue: Backend shows "Connection refused" or "ECONNREFUSED"

**Causes:**
1. Wrong database credentials
2. Database not running
3. Network/firewall issue

**Fix:**
1. Check database status in Render (should be green "Available")
2. Verify `DB_HOST`, `DB_PASSWORD` match database credentials
3. Check database logs for errors
4. Try internal database URL instead of external

### Issue: Vercel build fails

**Common errors and fixes:**

**Error: "Can't find module 'react'"**
```bash
Fix: Root directory set wrong
Solution: Set Root Directory to "frontend" in Vercel project settings
```

**Error: "REACT_APP_API_URL is not defined"**
```bash
Fix: Environment variable not set
Solution: Add REACT_APP_API_URL in Vercel environment variables
```

**Error: "npm ERR! missing script: build"**
```bash
Fix: Wrong root directory
Solution: Make sure Root Directory is "frontend"
```

### Issue: Render backend shows "Module not found"

**Fix:**
1. Check "Root Directory" is set to `backend`
2. Verify `package.json` exists in backend folder
3. Check build logs for npm install errors

### Issue: Free tier backend "sleeps"

**Behavior:**
- Free tier on Render sleeps after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up (cold start)

**Solutions:**
1. **Upgrade to Starter plan** ($7/month - always on)
2. **Use a ping service** (free):
   - UptimeRobot to ping your backend every 5 minutes
   - Keeps it awake during business hours
3. **Accept the limitation** for development/testing

---

## Cost Summary

### Free Tier (Development)
```
✓ Vercel Frontend: $0
✓ Render Backend: $0 (with sleep limitation)
✓ Render PostgreSQL: $0 (90 days free, then expires)
✓ SSL Certificates: $0 (included)
Total: $0/month
```

**Limitations:**
- Backend sleeps after 15 min inactivity (30-60s wake time)
- Free database expires after 90 days
- Limited bandwidth and build minutes

### Production Tier (Recommended)
```
✓ Vercel Frontend: $0 (or $20/month Pro for team features)
✓ Render Backend: $7/month (Starter - always on)
✓ Render PostgreSQL: $7/month (Starter - 256MB RAM)
✓ SSL Certificates: $0 (included)
Total: $14-34/month
```

**Benefits:**
- No sleep/cold starts
- Daily backups
- More resources
- Better performance

---

## Next Steps

After successful deployment:

1. **[ ] Add sample data** - Create stores, trolleys via admin panel
2. **[ ] Test all features** - GPS tracking, scanning, maintenance
3. **[ ] Configure email** - Add SMTP settings for alerts
4. **[ ] Set up Redis** - Add Redis on Render for better caching
5. **[ ] Add monitoring** - UptimeRobot + Sentry
6. **[ ] Custom domain** - Add your own domain name
7. **[ ] Backup strategy** - Schedule database backups
8. **[ ] Documentation** - Update README with your live URLs

---

## Quick Reference

### Your Deployment URLs

```
Frontend (Vercel): https://_____.vercel.app
Backend (Render): https://cartsaver-backend.onrender.com
Database: dpg-_____.oregon-postgres.render.com:5432
GitHub: https://github.com/dave4rea1/CartSaver
```

### Important Credentials

```
Database: [saved in secure location]
JWT Secret: [saved in secure location]
Admin Login: admin@cartsaver.com / admin123 (CHANGE THIS!)
```

### Useful Commands

```bash
# Vercel CLI (optional)
npm i -g vercel
vercel --prod

# Test backend health
curl https://cartsaver-backend.onrender.com/api/health

# View logs
# Render: Dashboard → Service → Logs tab
# Vercel: Dashboard → Project → Deployments → Click deployment → Logs

# Redeploy
# Render: Click "Manual Deploy" → "Deploy latest commit"
# Vercel: Automatic on git push, or click "Redeploy" in dashboard
```

---

## Support

**Need help?**
- Check logs in Render/Vercel dashboards
- Review troubleshooting section above
- Open issue on GitHub: https://github.com/dave4rea1/CartSaver/issues
- Render docs: https://render.com/docs
- Vercel docs: https://vercel.com/docs

**Common resources:**
- [Main Deployment Guide](./DEPLOYMENT_GUIDE.md) - All hosting options
- [Setup Guide](./SETUP.md) - Local development setup
- [API Reference](./API_REFERENCE.md) - API endpoints documentation

---

## Congratulations! 🎉

Your CartSaver application is now live on the internet!

**What you've accomplished:**
- ✅ Deployed PostgreSQL database
- ✅ Deployed Node.js backend API
- ✅ Deployed React frontend
- ✅ Configured CORS and security
- ✅ Set up SSL/HTTPS
- ✅ Enabled automatic deployments

**Share your app:**
- Frontend: `https://your-app.vercel.app`
- Test it on mobile, tablet, desktop
- Share with team members or clients

**Remember:**
- Change default admin password
- Monitor your application
- Keep dependencies updated
- Set up backups

---

Generated with Claude Code
https://claude.com/claude-code
