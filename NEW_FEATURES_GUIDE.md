# CartSaver - New Features Implementation Guide
**Date:** 2025-10-23
**Version:** 1.1.0

---

## Overview

Three major features have been added to enhance the CartSaver demonstration and usability:

1. **GPS Tracking & Geofence Breach Simulation** - Realistic trolley movement simulation
2. **QR Code Generation & Scanning** - Generate and scan QR codes for trolley identification
3. **Maintenance Record Management** - Edit and update maintenance records directly from the UI

---

## Feature 1: GPS Tracking & Geofence Breach Simulation 🌍

### Purpose
Simulate realistic GPS tracking and geofence breaches for demonstration purposes without physical trolleys.

### Implementation Files
- **Backend Service**: `backend/src/services/gpsSimulation.js`
- **Backend Controller**: `backend/src/controllers/gpsController.js` (simulation endpoints added)
- **Backend Routes**: `backend/src/routes/gpsRoutes.js`

### API Endpoints

#### 1. Simulate Single Trolley Movement
```http
POST /api/gps/simulate/single
Content-Type: application/json
Authorization: Bearer <token>

{
  "trolley_id": 1,
  "distance_meters": 50,
  "move_outside_geofence": false,
  "battery_level": 85,
  "signal_strength": 90
}
```

**Response:**
```json
{
  "message": "GPS location simulated successfully",
  "trolley": { /* trolley details */ },
  "location_history": { /* history record */ },
  "geofence_status": {
    "is_within_geofence": true,
    "distance_from_store": 45.5,
    "geofence_radius": 500,
    "breach_detected": false,
    "reentry_detected": false
  },
  "speed_kmh": 3.2
}
```

#### 2. Simulate Multiple Trolleys (Batch)
```http
POST /api/gps/simulate/multiple
Content-Type: application/json
Authorization: Bearer <token>

{
  "count": 10,
  "store_id": 1,
  "breach_percentage": 20
}
```

**Response:**
```json
{
  "message": "GPS simulation completed",
  "total": 10,
  "updated": 10,
  "breaches": 2,
  "errors": 0,
  "details": [
    {
      "trolley_id": 1,
      "rfid_tag": "RFID-00001",
      "success": true,
      "geofence_breach": false,
      "distance_from_store": 120.5
    }
    // ... more trolleys
  ]
}
```

#### 3. Simulate Specific Geofence Breach
```http
POST /api/gps/simulate/breach
Content-Type: application/json
Authorization: Bearer <token>

{
  "trolley_id": 5,
  "force_inside": false
}
```

**Parameters:**
- `force_inside: false` - Move trolley outside geofence
- `force_inside: true` - Move trolley back inside geofence

### Usage Examples

#### Using cURL
```bash
# Simulate movement for trolley ID 1
curl -X POST http://localhost:5000/api/gps/simulate/single \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"trolley_id": 1, "distance_meters": 100, "move_outside_geofence": false}'

# Simulate 20 trolleys with 30% breach rate
curl -X POST http://localhost:5000/api/gps/simulate/multiple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"count": 20, "breach_percentage": 30}'

# Force a geofence breach
curl -X POST http://localhost:5000/api/gps/simulate/breach \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"trolley_id": 5, "force_inside": false}'
```

#### Using JavaScript/Fetch
```javascript
// Simulate GPS tracking for multiple trolleys
const simulateGPS = async () => {
  const response = await fetch('http://localhost:5000/api/gps/simulate/multiple', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      count: 15,
      breach_percentage: 25
    })
  });

  const data = await response.json();
  console.log(`Updated ${data.updated} trolleys, ${data.breaches} breaches detected`);
};
```

### Continuous Simulation (Testing)

For automated testing, you can start continuous simulation:

```javascript
const { startContinuousSimulation } = require('./src/services/gpsSimulation');

// Start simulation
const intervalId = startContinuousSimulation({
  count: 10,              // Number of trolleys
  intervalSeconds: 30,    // Update every 30 seconds
  breachPercentage: 15,   // 15% breach rate
  storeId: null           // All stores (or specify store_id)
});

// Stop simulation later
clearInterval(intervalId);
```

### How It Works

1. **Movement Algorithm**: Calculates realistic GPS movement based on:
   - Current position (or store center if no GPS data)
   - Random direction and distance
   - Geofence awareness

2. **Geofence Detection**: Automatically:
   - Calculates distance from store
   - Detects breaches
   - Creates alerts when trolley leaves geofence
   - Resolves alerts when trolley returns

3. **Realistic Data**: Includes:
   - Battery levels (40-100%)
   - Signal strength (50-100%)
   - Speed calculation (km/h)
   - Movement patterns

---

## Feature 2: QR Code Generation & Scanning 📱

### Purpose
Generate QR codes for trolleys and scan them for quick identification and status updates.

### Implementation Files
- **Backend**: `backend/src/controllers/trolleyController.js` (QR endpoints added)
- **Backend Routes**: `backend/src/routes/trolleyRoutes.js`
- **Frontend**: `frontend/src/pages/ScanTrolley.js` (QR scanning already implemented)
- **Package**: `qrcode` (backend), `html5-qrcode` (frontend - already installed)

### API Endpoints

#### 1. Generate QR Code for Single Trolley
```http
GET /api/trolleys/:id/qrcode
Authorization: Bearer <token>
```

**Response:**
```json
{
  "trolley": {
    "id": 1,
    "rfid_tag": "RFID-00001",
    "barcode": "BC-00001",
    "store_name": "Shoprite Durbanville"
  },
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUh...",
  "qr_data": "{\"id\":1,\"rfid_tag\":\"RFID-00001\",\"type\":\"cartsaver_trolley\"}"
}
```

#### 2. Generate QR Codes in Bulk
```http
POST /api/trolleys/qrcodes/bulk
Content-Type: application/json
Authorization: Bearer <token>

{
  "store_id": 1,
  "limit": 50
}
```

OR

```json
{
  "trolley_ids": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "count": 50,
  "qr_codes": [
    {
      "trolley_id": 1,
      "rfid_tag": "RFID-00001",
      "barcode": "BC-00001",
      "store_name": "Shoprite Durbanville",
      "qr_code": "data:image/png;base64,..."
    }
    // ... more QR codes
  ]
}
```

### QR Code Data Format

Each QR code contains JSON data:
```json
{
  "id": 1,
  "rfid_tag": "RFID-00001",
  "barcode": "BC-00001",
  "store_id": 1,
  "store_name": "Shoprite Durbanville",
  "type": "cartsaver_trolley"
}
```

### Usage Examples

#### Generate and Display QR Code (HTML)
```html
<!DOCTYPE html>
<html>
<body>
  <h1>Trolley QR Code</h1>
  <img id="qrcode" alt="QR Code" />

  <script>
    async function generateQR() {
      const response = await fetch('http://localhost:5000/api/trolleys/1/qrcode', {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN'
        }
      });
      const data = await response.json();
      document.getElementById('qrcode').src = data.qr_code;
    }
    generateQR();
  </script>
</body>
</html>
```

#### Generate Bulk QR Codes and Print
```javascript
const generateBulkQR = async (storeId) => {
  const response = await fetch('http://localhost:5000/api/trolleys/qrcodes/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      store_id: storeId,
      limit: 100
    })
  });

  const { qr_codes } = await response.json();

  // Display or print QR codes
  qr_codes.forEach(qr => {
    const img = document.createElement('img');
    img.src = qr.qr_code;
    img.alt = qr.rfid_tag;
    document.body.appendChild(img);
  });
};
```

### Scanning QR Codes

The `ScanTrolley` page (`frontend/src/pages/ScanTrolley.js`) already includes QR scanning functionality:

1. Click the **"QR Scan"** button
2. Allow camera access
3. Point camera at QR code
4. System automatically searches for the trolley
5. Update status as needed

**QR Scanner Features:**
- Uses device camera
- Supports mobile and desktop
- Auto-focuses on QR codes
- Extracts trolley data automatically
- Immediately searches system

### Printing QR Code Labels

For physical labels, you can:

1. Generate QR codes via API
2. Display in a print-friendly layout
3. Use browser print (Ctrl+P)
4. Print on label paper

**Example Print Layout:**
```html
<div class="qr-label" style="width: 2in; height: 2in; page-break-after: always;">
  <img src="[QR_CODE_DATA_URL]" />
  <p>RFID-00001</p>
  <p>Shoprite Durbanville</p>
</div>
```

---

## Feature 3: Maintenance Record Management ✏️

### Purpose
Allow staff to edit and update maintenance records directly from the UI without backend access.

### Implementation Files
- **Frontend**: `frontend/src/pages/MaintenanceList.js` (enhanced with edit functionality)
- **Backend**: `backend/src/controllers/maintenanceController.js` (update endpoint already exists)

### Features

#### Editable Fields
- ✅ **Description** - Full maintenance description
- ✅ **Technician** - Technician name
- ✅ **Cost** - Maintenance cost (ZAR)
- ✅ **Status After** - Trolley status after maintenance (active, maintenance, recovered, decommissioned)

#### UI Features
- **Inline Editing** - Click "Edit" button on any record
- **Real-time Validation** - Validates input before saving
- **Cancel Option** - Cancel changes without saving
- **Visual Feedback** - Success/error messages
- **Loading States** - Shows spinner during save

### Usage

#### Edit a Maintenance Record

1. Navigate to **Maintenance Records** page
2. Find the record you want to edit
3. Click the **"Edit"** button in the Actions column
4. Modify any of the fields:
   - Description (textarea)
   - Technician (text input)
   - Cost (number input)
   - Status After (dropdown)
5. Click **"Save"** to commit changes
6. Or click **"Cancel"** to discard changes

#### API Endpoint Used

```http
PUT /api/maintenance/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "description": "Replaced damaged wheel and lubricated joints",
  "technician": "Mike Williams",
  "cost": 150.50,
  "status_after": "active"
}
```

### Example Screenshots

```
+------------------------------------------------------------------+
|  Maintenance Records                                              |
|  Track and manage trolley maintenance and repairs                 |
+------------------------------------------------------------------+
| Date       | Trolley    | Description    | Tech    | Cost | Status | Actions |
+------------+------------+----------------+---------+------+--------+---------+
| 2025-10-15 | RFID-00001 | [textarea...] | [input] | [#]  | [▼]    | Save Cancel |
| 2025-10-14 | RFID-00002 | Wheel repair   | Mike    | R150 | active | Edit    |
+------------+------------+----------------+---------+------+--------+---------+
```

---

## Testing Guide 🧪

### 1. Test GPS Simulation

```bash
# Start backend
cd backend
npm run dev

# In another terminal, test simulation
curl -X POST http://localhost:5000/api/gps/simulate/multiple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"count": 10, "breach_percentage": 30}'

# Check dashboard for GPS updates
# Go to http://localhost:3000/dashboard
```

### 2. Test QR Code Generation

```bash
# Generate QR code for trolley ID 1
curl http://localhost:5000/api/trolleys/1/qrcode \
  -H "Authorization: Bearer YOUR_TOKEN" > qr.json

# Extract and view QR code
cat qr.json | jq -r '.qr_code' | sed 's/data:image\/png;base64,//' | base64 -d > qr.png
```

### 3. Test Maintenance Editing

1. Go to http://localhost:3000/maintenance
2. Click "Edit" on any record
3. Modify fields
4. Click "Save"
5. Verify toast notification
6. Refresh page to confirm changes persist

---

## Integration Tips 💡

### GPS Simulation in Dashboard

You can add a "Simulate GPS" button to your dashboard:

```javascript
import { gpsAPI } from '../services/api';

const Dashboard = () => {
  const handleSimulate = async () => {
    try {
      const response = await gpsAPI.simulateMultiple({
        count: 20,
        breach_percentage: 20
      });
      toast.success(`Simulated ${response.updated} trolleys!`);
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      toast.error('Simulation failed');
    }
  };

  return (
    <button onClick={handleSimulate} className="btn btn-primary">
      Simulate GPS Updates
    </button>
  );
};
```

### Add QR Code to Trolley Details

In your trolley details page:

```javascript
const [qrCode, setQRCode] = useState(null);

const generateQR = async () => {
  try {
    const response = await trolleyAPI.generateQRCode(trolleyId);
    setQRCode(response.qr_code);
  } catch (error) {
    toast.error('Failed to generate QR code');
  }
};

return (
  <div>
    <button onClick={generateQR}>Generate QR Code</button>
    {qrCode && <img src={qrCode} alt="Trolley QR Code" />}
  </div>
);
```

---

## API Service Helpers (Frontend)

Add these to your `frontend/src/services/api.js`:

```javascript
// GPS Simulation
export const gpsAPI = {
  simulateSingle: (data) => api.post('/gps/simulate/single', data),
  simulateMultiple: (data) => api.post('/gps/simulate/multiple', data),
  simulateBreach: (data) => api.post('/gps/simulate/breach', data),
};

// QR Code Generation
export const trolleyAPI = {
  // ... existing methods
  generateQRCode: (id) => api.get(`/trolleys/${id}/qrcode`),
  generateBulkQR: (data) => api.post('/trolleys/qrcodes/bulk', data),
};

// Maintenance already has update method
export const maintenanceAPI = {
  // ... existing methods
  update: (id, data) => api.put(`/maintenance/${id}`, data),
};
```

---

## Production Considerations ⚠️

### GPS Simulation
- ❗ **Disable in production** or restrict to admin users only
- Consider adding a feature flag: `ENABLE_GPS_SIMULATION`
- Log all simulation requests for audit

### QR Codes
- ✅ Safe for production
- Consider caching generated QR codes
- Rate limit bulk generation (current limit: 100)

### Maintenance Editing
- ✅ Safe for production
- Already has authentication
- Consider adding audit logging for changes
- Add permission check (admin/staff only)

---

## Troubleshooting 🔧

### GPS Simulation Not Working
```
Error: Can only simulate GPS for active or recovered trolleys
```
**Solution**: Ensure the trolley status is 'active' or 'recovered', not 'stolen' or 'decommissioned'.

### QR Code Not Displaying
```
Error: Failed to generate QR code
```
**Solution**: Check that qrcode package is installed: `npm install qrcode`

### Maintenance Update Fails
```
Error: Maintenance record not found
```
**Solution**: Verify the record ID exists and user has permission.

---

## Summary

All three features are now fully implemented and ready for demonstration:

✅ **GPS Simulation** - Realistic trolley movements and geofence breaches
✅ **QR Code Generation** - Create and scan QR codes for trolleys
✅ **Maintenance Management** - Edit records directly from the UI

**Next Steps:**
1. Test each feature thoroughly
2. Run the backend: `cd backend && npm run dev`
3. Run the frontend: `cd frontend && npm start`
4. Simulate GPS: Use the API endpoints provided
5. Generate QR codes and test scanning
6. Edit maintenance records from the UI

For questions or issues, refer to the API documentation or check the implementation files listed in each section.
