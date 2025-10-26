# Quick Start - New Features

## 🎉 What's New

Three powerful features have been added to CartSaver:

1. **GPS Tracking Simulation** - Demonstrate live trolley tracking
2. **QR Code Generation & Scanning** - Physical trolley identification
3. **Maintenance Record Management** - Edit records from the UI

---

## 🚀 Quick Test (5 Minutes)

### Prerequisites
```bash
# Backend must be running
cd backend
npm run dev

# Frontend must be running (separate terminal)
cd frontend
npm start
```

### Test 1: GPS Simulation (2 min)

**Option A: Using Browser Console**
1. Log in to CartSaver (http://localhost:3000)
2. Open browser DevTools (F12)
3. Run this in console:

```javascript
// Get your token
const token = localStorage.getItem('token');

// Simulate 10 trolleys with 20% breach rate
fetch('http://localhost:5000/api/gps/simulate/multiple', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    count: 10,
    breach_percentage: 20
  })
})
.then(r => r.json())
.then(d => console.log('GPS Simulated:', d));
```

4. Go to Dashboard - you should see GPS updates!
5. Check for geofence breach alerts

**Option B: Using cURL**
```bash
# Login first to get token
TOKEN="your_token_here"

# Simulate GPS
curl -X POST http://localhost:5000/api/gps/simulate/multiple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"count": 10, "breach_percentage": 20}'
```

### Test 2: QR Code Generation (1 min)

1. In browser console:
```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:5000/api/trolleys/1/qrcode', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  // Display QR code
  const img = document.createElement('img');
  img.src = data.qr_code;
  img.style.cssText = 'position:fixed;top:100px;right:20px;z-index:9999;border:4px solid #C8102E;';
  document.body.appendChild(img);
  console.log('QR Code generated!');
});
```

2. QR code appears on screen
3. Use your phone to scan it (contains trolley data)

### Test 3: Maintenance Editing (2 min)

1. Go to http://localhost:3000/maintenance
2. Click **"Edit"** on any record
3. Change the description or cost
4. Click **"Save"**
5. ✅ Success toast appears
6. Refresh page - changes persist!

---

## 📖 Detailed Usage

### GPS Simulation - Command Reference

```javascript
// Simulate single trolley
fetch('/api/gps/simulate/single', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    trolley_id: 1,
    distance_meters: 50,
    move_outside_geofence: false
  })
});

// Simulate multiple trolleys
fetch('/api/gps/simulate/multiple', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    count: 20,                  // Number of trolleys
    breach_percentage: 30,      // 30% will breach geofence
    store_id: 1                 // Optional: filter by store
  })
});

// Force a geofence breach
fetch('/api/gps/simulate/breach', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    trolley_id: 5,
    force_inside: false  // false = breach, true = return inside
  })
});
```

### QR Code Generation - Examples

```javascript
// Single QR code
fetch(`/api/trolleys/${trolleyId}/qrcode`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  document.getElementById('qr').src = data.qr_code;
});

// Bulk QR codes for a store
fetch('/api/trolleys/qrcodes/bulk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    store_id: 1,
    limit: 50
  })
})
.then(r => r.json())
.then(data => {
  console.log(`Generated ${data.count} QR codes`);
  // data.qr_codes contains array of QR code images
});
```

---

## 💡 Demo Scenarios

### Scenario 1: Live GPS Tracking Demo

```javascript
// Continuous GPS simulation (updates every 30 seconds)
setInterval(() => {
  fetch('/api/gps/simulate/multiple', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      count: 15,
      breach_percentage: 15
    })
  });
}, 30000);
```

### Scenario 2: Trolley Recovery Demo

```javascript
// 1. Simulate trolley leaving geofence (theft)
fetch('/api/gps/simulate/breach', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    trolley_id: 5,
    force_inside: false
  })
});

// 2. Wait 10 seconds, then simulate recovery
setTimeout(() => {
  fetch('/api/gps/simulate/breach', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      trolley_id: 5,
      force_inside: true  // Return to store
    })
  });
}, 10000);
```

### Scenario 3: QR Code Workflow

```javascript
// 1. Generate QR code
const qrData = await fetch('/api/trolleys/1/qrcode', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// 2. Display QR code
const img = document.createElement('img');
img.src = qrData.qr_code;
document.body.appendChild(img);

// 3. Scan with phone camera on /scan page
// 4. System automatically identifies trolley
// 5. Update status as needed
```

---

## 🎯 Testing Checklist

### GPS Simulation
- [ ] Can simulate single trolley movement
- [ ] Can simulate multiple trolleys
- [ ] Geofence breaches create alerts
- [ ] Trolley returning inside resolves alerts
- [ ] Dashboard shows updated GPS data
- [ ] Speed calculation works
- [ ] Battery/signal levels vary

### QR Code Features
- [ ] Can generate QR for single trolley
- [ ] Can generate bulk QR codes
- [ ] QR contains correct trolley data
- [ ] QR code is scannable with phone
- [ ] Scanning on /scan page works
- [ ] Auto-search after scan works

### Maintenance Management
- [ ] Can click Edit button
- [ ] All fields are editable
- [ ] Save button works
- [ ] Cancel button works
- [ ] Changes persist after save
- [ ] Toast notifications appear
- [ ] Loading states show correctly

---

## 🐛 Troubleshooting

### "Can only simulate GPS for active trolleys"
**Fix**: The trolley must have status 'active' or 'recovered'. Change status first.

### "Failed to generate QR code"
**Fix**: Run `npm install` in backend directory to ensure qrcode package is installed.

### GPS updates not showing on dashboard
**Fix**: Refresh the dashboard or check console for errors. Ensure backend is running.

### QR scanner not working
**Fix**:
- Allow camera permissions
- Use HTTPS in production
- Check browser compatibility

---

## 📚 Full Documentation

For complete API documentation and advanced usage:
- See **NEW_FEATURES_GUIDE.md** (comprehensive guide)
- See **API_REFERENCE.md** (all API endpoints)
- See **DEPLOYMENT_CHECKLIST.md** (production setup)

---

## ✅ Success!

You now have:
- ✅ GPS tracking simulation working
- ✅ QR code generation functional
- ✅ Maintenance records editable from UI
- ✅ Real-time dashboard updates
- ✅ Geofence breach detection

**Ready for demonstration!** 🎉

---

**Need help?** Check the NEW_FEATURES_GUIDE.md or open an issue.
