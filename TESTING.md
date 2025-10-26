# CartSaver - Testing Guide

This document provides test scenarios and workflows to verify the CartSaver application functionality.

## Prerequisites

- Backend and frontend servers running
- Database seeded with sample data
- Logged in as admin or staff user

## Test Scenarios

### 1. Authentication & Authorization

#### Test 1.1: User Login
**Steps:**
1. Navigate to `http://localhost:3000`
2. Enter email: `admin@cartsaver.com`
3. Enter password: `admin123`
4. Click "Login"

**Expected Result:**
- Successful login
- Redirected to dashboard
- User name and role displayed in header

#### Test 1.2: Invalid Login
**Steps:**
1. Enter invalid credentials
2. Click "Login"

**Expected Result:**
- Error message displayed
- Remain on login page

#### Test 1.3: Token Persistence
**Steps:**
1. Login successfully
2. Refresh the page

**Expected Result:**
- User remains logged in
- No redirect to login page

---

### 2. Dashboard Functionality

#### Test 2.1: Dashboard Statistics
**Steps:**
1. Navigate to Dashboard (/)
2. Observe stat cards

**Expected Result:**
- Total Trolleys count displayed
- Active Trolleys count displayed
- Under Maintenance count displayed
- Unresolved Alerts count displayed
- All numbers are accurate

#### Test 2.2: Recent Activity
**Steps:**
1. View "Recent Activity" section
2. Verify entries show status changes

**Expected Result:**
- Recent status changes displayed
- Sorted by most recent first
- User name shown for manual changes

#### Test 2.3: Store Summary
**Steps:**
1. View "Store Summary" section
2. Check active vs total counts

**Expected Result:**
- All stores listed
- Active and total counts displayed
- Percentage calculated correctly

---

### 3. Trolley Management

#### Test 3.1: View Trolley List
**Steps:**
1. Navigate to Trolleys page
2. Observe table

**Expected Result:**
- All trolleys displayed in table
- RFID tag, barcode, store, status, last scanned shown
- Status badges with correct colors

#### Test 3.2: Search Trolley
**Steps:**
1. Enter RFID tag in search (e.g., "RFID-00001")
2. Click search

**Expected Result:**
- Only matching trolleys displayed
- Search is case-insensitive

#### Test 3.3: Filter by Status
**Steps:**
1. Select "Active" from status dropdown
2. Observe results

**Expected Result:**
- Only active trolleys shown
- Count updates accordingly

#### Test 3.4: View Trolley Details
**Steps:**
1. Click eye icon on any trolley
2. View detail page

**Expected Result:**
- Full trolley information displayed
- Status history shown
- Maintenance records visible (if any)
- Store information displayed

---

### 4. Trolley Scanning Workflow

#### Test 4.1: Scan Existing Trolley
**Steps:**
1. Navigate to Scan page
2. Enter RFID: `RFID-00001`
3. Click "Scan"

**Expected Result:**
- Trolley information displayed
- Current status shown
- Last scanned timestamp updated

#### Test 4.2: Update Trolley Status
**Steps:**
1. After scanning, select new status (e.g., "Maintenance")
2. Add notes: "Wheel damaged"
3. Click "Update Status"

**Expected Result:**
- Status updated successfully
- Success message shown
- New entry in status history
- Last scanned updated

#### Test 4.3: Scan Non-Existent Trolley
**Steps:**
1. Enter invalid RFID: `INVALID-TAG`
2. Click "Scan"

**Expected Result:**
- Error message: "Trolley not found"
- No trolley information displayed

#### Test 4.4: Recover Stolen Trolley
**Steps:**
1. Scan a stolen trolley
2. Select status "Recovered"
3. Update

**Expected Result:**
- Status changes to "Recovered"
- Default barcode removed (if it was auto-generated)
- Alert created for recovery
- is_default_barcode set to false

---

### 5. Automated Inactivity Detection

#### Test 5.1: Manual Trigger (Development)
**Steps:**
1. Create a test trolley with last_scanned > 7 days ago
2. Manually run the CRON job or wait for midnight
3. Check trolley status

**Expected Result:**
- Trolley status changed to "Stolen"
- Default barcode assigned: `STOLEN-{id}-{timestamp}`
- is_default_barcode set to true
- Alert created with type "inactivity"
- Status history entry created

#### Test 5.2: Verify Alert Generation
**Steps:**
1. Navigate to Alerts page
2. Look for inactivity alerts

**Expected Result:**
- Alert shows trolley RFID
- Store name displayed
- Severity is "warning"
- Message indicates inactivity

---

### 6. Map Visualization

#### Test 6.1: View Map
**Steps:**
1. Navigate to Map View page
2. Observe map

**Expected Result:**
- Map loads with all store markers
- Markers colored based on active trolley ratio:
  - Green: ≥70% active
  - Yellow: 40-70% active
  - Red: <40% active

#### Test 6.2: Click Store Marker
**Steps:**
1. Click on any store marker
2. View popup

**Expected Result:**
- Popup shows store name and address
- Trolley counts displayed:
  - Active (green icon)
  - Maintenance (yellow icon)
  - Stolen (red icon)
  - Total

#### Test 6.3: Select Store from List
**Steps:**
1. Click store in sidebar list
2. Observe map

**Expected Result:**
- Store highlighted in list
- Map centers on selected store (in real implementation)

---

### 7. Store Management

#### Test 7.1: View Stores
**Steps:**
1. Navigate to Stores page
2. View store cards

**Expected Result:**
- All stores displayed in grid
- Name, address, coordinates shown
- Trolley counts by status displayed
- Active threshold shown

#### Test 7.2: Store Below Threshold
**Steps:**
1. Find store with active count < threshold
2. Observe warning

**Expected Result:**
- Yellow warning box: "⚠️ Below active threshold"
- Store should also have an alert

---

### 8. Maintenance Management

#### Test 8.1: View Maintenance Records
**Steps:**
1. Navigate to Maintenance page
2. View table

**Expected Result:**
- All maintenance records listed
- Date, trolley, description, technician, cost shown
- Sorted by date (newest first)

#### Test 8.2: View Trolley-Specific Maintenance
**Steps:**
1. Go to Trolley Details page
2. View "Maintenance Records" section

**Expected Result:**
- Only records for that trolley shown
- Most recent records displayed

---

### 9. Alert System

#### Test 9.1: View Unresolved Alerts
**Steps:**
1. Navigate to Alerts page
2. Filter: "Unresolved"

**Expected Result:**
- Only unresolved alerts shown
- Severity badges colored correctly:
  - Info: Blue
  - Warning: Yellow
  - Critical: Red

#### Test 9.2: Resolve Alert
**Steps:**
1. Click "Resolve" on any alert
2. Observe change

**Expected Result:**
- Alert marked as resolved
- "Resolved" badge shown
- Resolved by user and timestamp displayed
- Alert becomes slightly transparent

#### Test 9.3: Filter Alerts
**Steps:**
1. Select "Resolved" from dropdown
2. Observe results

**Expected Result:**
- Only resolved alerts shown
- Includes resolver info

#### Test 9.4: Alert Types
**Steps:**
1. View all alerts
2. Check types

**Expected Result:**
- Alert types include:
  - Shortage (active count below threshold)
  - Inactivity (trolley not scanned for 7+ days)
  - Recovered (stolen trolley found)

---

### 10. Shortage Detection

#### Test 10.1: Create Shortage Condition
**Steps:**
1. Mark multiple trolleys at a store as "Stolen" or "Maintenance"
2. Reduce active count below store threshold
3. Wait for hourly CRON job or trigger manually

**Expected Result:**
- Alert created with type "shortage"
- Message shows: "Active trolley count at {store} is below threshold: {count}/{threshold}"
- Severity:
  - Critical if count < 50% of threshold
  - Warning otherwise

#### Test 10.2: Verify Shortage Alert
**Steps:**
1. Navigate to Alerts page
2. Find shortage alert

**Expected Result:**
- Alert displayed with correct store
- No trolley_id (applies to store, not specific trolley)

---

## Performance Testing

### Test P1: Large Dataset
**Steps:**
1. Seed database with 1000+ trolleys
2. Navigate through pages
3. Use search and filters

**Expected Result:**
- Pages load in < 2 seconds
- Search responds quickly
- No UI freezing

### Test P2: Concurrent Users
**Steps:**
1. Open application in multiple browsers
2. Perform actions simultaneously

**Expected Result:**
- All actions complete successfully
- No data conflicts
- Real-time updates work

---

## Security Testing

### Test S1: Unauthorized Access
**Steps:**
1. Logout
2. Try to access `/trolleys` directly

**Expected Result:**
- Redirected to login page

### Test S2: Admin-Only Actions
**Steps:**
1. Login as staff user
2. Try to create/delete trolley (via API)

**Expected Result:**
- 403 Forbidden error
- Action not permitted

### Test S3: Token Expiration
**Steps:**
1. Login
2. Wait for token to expire (7 days by default)
3. Try to perform action

**Expected Result:**
- 401 Unauthorized
- Redirected to login

---

## Edge Cases

### Test E1: Empty Database
**Steps:**
1. Clear all trolleys
2. View trolleys page

**Expected Result:**
- "No trolleys found" message
- No errors

### Test E2: Trolley Never Scanned
**Steps:**
1. Create trolley with last_scanned = null
2. View trolley details

**Expected Result:**
- Last scanned shows "Never"
- Can still scan and update

### Test E3: Multiple Status Changes
**Steps:**
1. Scan trolley
2. Change status to "Maintenance"
3. Immediately change to "Active"
4. Change to "Decommissioned"

**Expected Result:**
- All changes recorded in history
- Correct order maintained
- All users logged

---

## Regression Testing Checklist

After any code changes, verify:

- [ ] Login/logout works
- [ ] Dashboard statistics accurate
- [ ] Trolley scanning updates status
- [ ] Map displays correctly
- [ ] Alerts are created and resolvable
- [ ] Search and filters work
- [ ] Maintenance records display
- [ ] Status history is accurate
- [ ] CRON jobs execute properly
- [ ] API returns correct data

---

## Bug Reporting Template

When reporting issues:

```
**Issue Title:** Brief description

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happened

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Frontend: localhost:3000
- Backend: localhost:5000

**Screenshots:**
[Attach if relevant]

**Console Errors:**
[Paste any errors from browser console]
```

---

## Conclusion

All tests should pass before deploying to production. Any failures should be investigated and fixed. Regular testing ensures system reliability and data integrity.
