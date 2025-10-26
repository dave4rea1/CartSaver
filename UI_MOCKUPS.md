# CartSaver - UI Mockups & Wireframes

This document provides text-based wireframes and descriptions of the CartSaver user interface.

---

## 1. Login Page

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    [Cart Icon]                      │
│                                                     │
│                    CartSaver                        │
│             Trolley Management System               │
│                                                     │
│    ┌───────────────────────────────────────┐      │
│    │ Email                                  │      │
│    │ [your.email@example.com            ]  │      │
│    │                                        │      │
│    │ Password                               │      │
│    │ [••••••••                          ]  │      │
│    │                                        │      │
│    │         [      Login      ]           │      │
│    └───────────────────────────────────────┘      │
│                                                     │
│    ┌───────────────────────────────────────┐      │
│    │ Demo Credentials:                      │      │
│    │ Admin: admin@cartsaver.com / admin123  │      │
│    │ Staff: john@cartsaver.com / staff123   │      │
│    └───────────────────────────────────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Clean, centered layout
- Gradient background (blue)
- Demo credentials visible for easy testing
- Form validation
- Loading state on submit

---

## 2. Dashboard (Home)

```
┌──────────────────────────────────────────────────────────────────┐
│ ☰ CartSaver                         Welcome, Admin User [Logout] │
├──────────────────────────────────────────────────────────────────┤
│ SIDEBAR          │  MAIN CONTENT                                 │
│                  │                                                │
│ [📊] Dashboard   │  Dashboard                                    │
│ [🛒] Trolleys    │  Overview of trolley management system        │
│ [📷] Scan        │                                                │
│ [🏪] Stores      │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ [🔧] Maintenance │  │Total     │ │Active    │ │Maint.    │      │
│ [🔔] Alerts      │  │Trolleys  │ │Trolleys  │ │          │      │
│ [🗺️] Map View   │  │   100    │ │    75    │ │    10    │      │
│                  │  └──────────┘ └──────────┘ └──────────┘      │
│                  │  ┌──────────┐                                 │
│                  │  │Unresolved│                                 │
│                  │  │Alerts    │                                 │
│                  │  │     5    │                                 │
│                  │  └──────────┘                                 │
│                  │                                                │
│                  │  Status Breakdown           Store Summary     │
│                  │  ┌───────────────┐         ┌─────────────┐   │
│                  │  │ Active     75 │         │Shoprite DB  │   │
│                  │  │ Maintenance10 │         │50 / 80      │   │
│                  │  │ Stolen      8 │         │             │   │
│                  │  │ Decom.      5 │         │Shoprite BV  │   │
│                  │  │ Recovered   2 │         │25 / 60      │   │
│                  │  └───────────────┘         └─────────────┘   │
│                  │                                                │
│                  │  Recent Activity (Last 24 Hours)              │
│                  │  ┌──────────────────────────────────────────┐│
│                  │  │ RFID-00001: active → maintenance         ││
│                  │  │ by John Smith - 2 hours ago              ││
│                  │  │                                           ││
│                  │  │ RFID-00023: stolen → recovered           ││
│                  │  │ by Sarah Johnson - 5 hours ago           ││
│                  │  └──────────────────────────────────────────┘│
│                  │                                                │
│                  │  Quick Actions                                │
│                  │  ┌────────┐ ┌────────┐ ┌────────┐           │
│                  │  │ Scan   │ │ Map    │ │ Alerts │           │
│                  │  │ Trolley│ │ View   │ │        │           │
│                  │  └────────┘ └────────┘ └────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- Responsive sidebar navigation
- 4 key metric cards at top
- Status breakdown pie/bar visualization
- Store summary with progress indicators
- Recent activity timeline
- Quick action buttons
- Mobile: Hamburger menu for sidebar

---

## 3. Scan Trolley Page

```
┌──────────────────────────────────────────────────────────────────┐
│ ☰ CartSaver                         Welcome, Admin User [Logout] │
├──────────────────────────────────────────────────────────────────┤
│ SIDEBAR          │  MAIN CONTENT                                 │
│                  │                                                │
│ [📊] Dashboard   │  Scan Trolley                                 │
│ [🛒] Trolleys    │  Update trolley status using RFID or barcode  │
│ [📷] Scan ✓      │                                                │
│ [🏪] Stores      │  ┌──────────────────────────────────────────┐│
│ [🔧] Maintenance │  │ RFID Tag or Barcode                       ││
│ [🔔] Alerts      │  │ [Enter RFID tag or barcode...        ]    ││
│ [🗺️] Map View   │  │                          [🔍 Scan]         ││
│                  │  └──────────────────────────────────────────┘│
│                  │                                                │
│                  │  ┌──────────────────────────────────────────┐│
│                  │  │ Trolley Information                       ││
│                  │  │ RFID: RFID-00001          [Active]        ││
│                  │  │                                            ││
│                  │  │ Barcode: BC-00001                          ││
│                  │  │ Store: Shoprite Durbanville                ││
│                  │  │ Last Scanned: Oct 6, 2025 14:30           ││
│                  │  │ Default Barcode: No                        ││
│                  │  │                                            ││
│                  │  │ ─────────────────────────────────────────││
│                  │  │                                            ││
│                  │  │ Update Status                              ││
│                  │  │                                            ││
│                  │  │ New Status:                                ││
│                  │  │ [  Active  ] [Maintenance] [Decommission] ││
│                  │  │ [Recovered ]                               ││
│                  │  │                                            ││
│                  │  │ Notes (Optional):                          ││
│                  │  │ [Add any additional notes...           ]  ││
│                  │  │ [                                      ]  ││
│                  │  │                                            ││
│                  │  │ [  Update Status  ] [Reset]                ││
│                  │  │                                            ││
│                  │  │ ✓ Trolley updated successfully!            ││
│                  │  └──────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- Large, accessible input field
- Auto-focus on RFID input
- Real-time trolley lookup
- Current status displayed with badge
- Status selection with buttons (not dropdown)
- Optional notes field
- Clear success/error messages
- Reset button to scan another trolley

---

## 4. Map View

```
┌──────────────────────────────────────────────────────────────────┐
│ ☰ CartSaver                         Welcome, Admin User [Logout] │
├──────────────────────────────────────────────────────────────────┤
│ SIDEBAR          │  MAIN CONTENT                                 │
│                  │                                                │
│ [📊] Dashboard   │  Map View                                     │
│ [🛒] Trolleys    │  Trolley distribution across stores           │
│ [📷] Scan        │                                                │
│ [🏪] Stores      │  ┌────────┐  ┌─────────────────────────────┐ │
│ [🔧] Maintenance │  │Stores  │  │                              │ │
│ [🔔] Alerts      │  │        │  │    ┌────────────────┐        │ │
│ [🗺️] Map View ✓ │  │Shoprite│  │    │ Shoprite DB    │        │ │
│                  │  │DB      │  │    │ 50 active      │  📍    │ │
│                  │  │🟢 50/80│  │    └────────────────┘        │ │
│                  │  │        │  │                              │ │
│                  │  │Shoprite│  │                              │ │
│                  │  │BV      │  │          📍 Shoprite BV      │ │
│                  │  │🟡 25/60│  │                              │ │
│                  │  │        │  │                              │ │
│                  │  │Shoprite│  │                    📍        │ │
│                  │  │CC      │  │              Shoprite CC     │ │
│                  │  │🔴 15/80│  │                              │ │
│                  │  │        │  │                              │ │
│                  │  │Shoprite│  │                              │ │
│                  │  │TV      │  │        📍 Shoprite TV        │ │
│                  │  │🟢 55/70│  │                              │ │
│                  │  └────────┘  └─────────────────────────────┘ │
│                  │                                                │
│                  │  Legend:                                      │
│                  │  🟢 Good (≥70% active)                         │
│                  │  🟡 Warning (40-70% active)                    │
│                  │  🔴 Critical (<40% active)                     │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- Split view: Store list (left) + Interactive map (right)
- Color-coded store markers
- Clickable markers show popup with:
  - Store name and address
  - Active trolley count (green)
  - Maintenance count (yellow)
  - Stolen count (red)
  - Total count
- Selecting store in list highlights on map
- Legend for marker colors
- Responsive: Stack vertically on mobile

---

## 5. Trolley List

```
┌──────────────────────────────────────────────────────────────────┐
│ ☰ CartSaver                         Welcome, Admin User [Logout] │
├──────────────────────────────────────────────────────────────────┤
│ SIDEBAR          │  MAIN CONTENT                                 │
│                  │                                                │
│ [📊] Dashboard   │  Trolleys                                     │
│ [🛒] Trolleys ✓  │  Manage trolley inventory                     │
│ [📷] Scan        │                                                │
│ [🏪] Stores      │  ┌──────────────────────────────────────────┐│
│ [🔧] Maintenance │  │ Search: [              ] [🔍]             ││
│ [🔔] Alerts      │  │ Status: [All Statuses ▾]                  ││
│ [🗺️] Map View   │  └──────────────────────────────────────────┘│
│                  │                                                │
│                  │  ┌──────────────────────────────────────────┐│
│                  │  │ RFID Tag │Barcode│Store   │Status│Last.. ││
│                  │  ├──────────┼───────┼────────┼──────┼───────┤│
│                  │  │RFID-00001│BC-0001│Shop DB │Active│2h ago ││
│                  │  │RFID-00002│BC-0002│Shop BV │Maint │1d ago ││
│                  │  │RFID-00003│STOLEN │Shop CC │Stolen│10d ago││
│                  │  │RFID-00004│BC-0004│Shop TV │Active│5m ago ││
│                  │  │RFID-00005│BC-0005│Shop DB │Active│1h ago ││
│                  │  │...       │...    │...     │...   │...    ││
│                  │  └──────────────────────────────────────────┘│
│                  │                                                │
│                  │  Showing 100 trolley(s)                        │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- Search by RFID or barcode
- Filter by status dropdown
- Sortable table columns
- Status badges with color coding
- Relative time stamps
- Eye icon to view details
- Responsive table (horizontal scroll on mobile)
- Pagination (if many trolleys)

---

## 6. Trolley Details

```
┌──────────────────────────────────────────────────────────────────┐
│ ☰ CartSaver                         Welcome, Admin User [Logout] │
├──────────────────────────────────────────────────────────────────┤
│ SIDEBAR          │  MAIN CONTENT                                 │
│                  │                                                │
│ [📊] Dashboard   │  ← Back to Trolleys                           │
│ [🛒] Trolleys ✓  │                                                │
│ [📷] Scan        │  Trolley RFID-00001              [Active]     │
│ [🏪] Stores      │  Barcode: BC-00001                            │
│ [🔧] Maintenance │                                                │
│ [🔔] Alerts      │  ┌──────────────────────┐ ┌─────────────────┐│
│ [🗺️] Map View   │  │ Basic Information    │ │ Maintenance     ││
│                  │  │                      │ │ Records         ││
│                  │  │ RFID Tag: RFID-00001 │ │                 ││
│                  │  │ Barcode: BC-00001    │ │ Oct 1, 2025     ││
│                  │  │ Status: Active       │ │ Wheel replaced  ││
│                  │  │ Last Scanned:        │ │ Tech: Mike      ││
│                  │  │   Oct 6, 2025 14:30  │ │                 ││
│                  │  │                      │ │ Sep 15, 2025    ││
│                  │  │ 🗺️ Store Info        │ │ Basket repair   ││
│                  │  │ Shoprite Durbanville │ │ Tech: Sarah     ││
│                  │  │ 123 Main Rd, DB      │ │                 ││
│                  │  │                      │ │ Quick Actions   ││
│                  │  │ 📅 Status History    │ │ [Scan & Update] ││
│                  │  │                      │ └─────────────────┘│
│                  │  │ Oct 1: active→maint  │                    │
│                  │  │   by John Smith      │                    │
│                  │  │   "Wheel damaged"    │                    │
│                  │  │                      │                    │
│                  │  │ Oct 5: maint→active  │                    │
│                  │  │   by Sarah Johnson   │                    │
│                  │  │   "Repair complete"  │                    │
│                  │  └──────────────────────┘                    │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- Breadcrumb navigation
- Status badge
- 3-column layout:
  - Left: Basic info + Store + Status history
  - Right: Maintenance records + Quick actions
- Timeline-style status history with user attribution
- Click through to maintenance details
- Quick "Scan & Update" button

---

## 7. Alerts Page

```
┌──────────────────────────────────────────────────────────────────┐
│ ☰ CartSaver                         Welcome, Admin User [Logout] │
├──────────────────────────────────────────────────────────────────┤
│ SIDEBAR          │  MAIN CONTENT                                 │
│                  │                                                │
│ [📊] Dashboard   │  Alerts                [Unresolved ▾]         │
│ [🛒] Trolleys    │  System notifications and warnings            │
│ [📷] Scan        │                                                │
│ [🏪] Stores      │  ┌──────────────────────────────────────────┐│
│ [🔧] Maintenance │  │ [Warning] [Inactivity]                    ││
│ [🔔] Alerts ✓    │  │                                            ││
│ [🗺️] Map View   │  │ Trolley RFID-00003 at Shoprite CC has     ││
│                  │  │ been flagged as stolen due to inactivity   ││
│                  │  │ (last seen: Sep 25, 2025)                  ││
│                  │  │                                            ││
│                  │  │ Store: Shoprite Century City               ││
│                  │  │ Trolley: RFID-00003                        ││
│                  │  │ Created: Oct 6, 2025 00:01                ││
│                  │  │                                            ││
│                  │  │                          [Resolve]         ││
│                  │  └──────────────────────────────────────────┘│
│                  │                                                │
│                  │  ┌──────────────────────────────────────────┐│
│                  │  │ [Critical] [Shortage]                     ││
│                  │  │                                            ││
│                  │  │ Active trolley count at Shoprite CC is    ││
│                  │  │ below threshold: 15/80                     ││
│                  │  │                                            ││
│                  │  │ Store: Shoprite Century City               ││
│                  │  │ Created: Oct 6, 2025 10:00                ││
│                  │  │                                            ││
│                  │  │                          [Resolve]         ││
│                  │  └──────────────────────────────────────────┘│
│                  │                                                │
│                  │  ┌──────────────────────────────────────────┐│
│                  │  │ [Info] [Recovered] [Resolved]             ││
│                  │  │                                            ││
│                  │  │ Trolley RFID-00010 has been recovered at  ││
│                  │  │ Shoprite Durbanville                       ││
│                  │  │                                            ││
│                  │  │ Resolved by: Sarah Johnson                 ││
│                  │  │ Oct 5, 2025 16:30                          ││
│                  │  └──────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- Filter dropdown (All/Unresolved/Resolved)
- Alert cards with:
  - Severity badge (Info/Warning/Critical) - color coded
  - Type badge (Shortage/Inactivity/Recovered)
  - Message
  - Related store and trolley (if applicable)
  - Timestamp
  - Resolve button (if unresolved)
  - Resolver info (if resolved)
- Resolved alerts slightly transparent
- Sort by: resolved status, severity, date

---

## 8. Stores Page

```
┌──────────────────────────────────────────────────────────────────┐
│ ☰ CartSaver                         Welcome, Admin User [Logout] │
├──────────────────────────────────────────────────────────────────┤
│ SIDEBAR          │  MAIN CONTENT                                 │
│                  │                                                │
│ [📊] Dashboard   │  Stores                                       │
│ [🛒] Trolleys    │  Manage store locations                       │
│ [📷] Scan        │                                                │
│ [🏪] Stores ✓    │  ┌─────────────┐ ┌─────────────┐            │
│ [🔧] Maintenance │  │ Shoprite    │ │ Shoprite    │            │
│ [🔔] Alerts      │  │ Durbanville │ │ Bellville   │            │
│ [🗺️] Map View   │  │             │ │             │            │
│                  │  │ 📍 123 Main │ │ 📍 456 Voor │            │
│                  │  │    Road, DB │ │    Rd, BV   │            │
│                  │  │             │ │             │            │
│                  │  │ Coords:     │ │ Coords:     │            │
│                  │  │ -33.84,18.65│ │ -33.88,18.63│            │
│                  │  │             │ │             │            │
│                  │  │ Threshold:  │ │ Threshold:  │            │
│                  │  │ 50 trolleys │ │ 60 trolleys │            │
│                  │  │             │ │             │            │
│                  │  │ 🛒 Trolleys │ │ 🛒 Trolleys │            │
│                  │  │ Active: 50  │ │ Active: 25  │            │
│                  │  │ Maint:   5  │ │ Maint:   3  │            │
│                  │  │ Stolen:  2  │ │ Stolen:  5  │            │
│                  │  │ Total:  80  │ │ Total:  60  │            │
│                  │  │             │ │             │            │
│                  │  │             │ │ ⚠️ Below    │            │
│                  │  │             │ │ threshold   │            │
│                  │  └─────────────┘ └─────────────┘            │
│                  │                                                │
│                  │  [More stores in grid...]                     │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- Grid layout of store cards
- Store name and address
- GPS coordinates
- Active threshold setting
- Trolley count breakdown by status
- Warning indicator if below threshold
- Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)

---

## 9. Maintenance Page

```
┌──────────────────────────────────────────────────────────────────┐
│ ☰ CartSaver                         Welcome, Admin User [Logout] │
├──────────────────────────────────────────────────────────────────┤
│ SIDEBAR          │  MAIN CONTENT                                 │
│                  │                                                │
│ [📊] Dashboard   │  Maintenance Records                          │
│ [🛒] Trolleys    │  Track trolley maintenance and repairs        │
│ [📷] Scan        │                                                │
│ [🏪] Stores      │  ┌──────────────────────────────────────────┐│
│ [🔧] Maint. ✓    │  │ Date   │Trolley│Description│Tech  │Cost  ││
│ [🔔] Alerts      │  ├────────┼───────┼───────────┼──────┼──────┤│
│ [🗺️] Map View   │  │Oct 6   │00001  │Wheel rep. │Mike  │R150  ││
│                  │  │Oct 5   │00015  │Basket fix │Sarah │R200  ││
│                  │  │Oct 3   │00023  │Handle rep.│Mike  │R100  ││
│                  │  │Oct 1   │00008  │Full serv. │John  │R350  ││
│                  │  │Sep 28  │00034  │Wheel rep. │Sarah │R150  ││
│                  │  │...     │...    │...        │...   │...   ││
│                  │  └──────────────────────────────────────────┘│
│                  │                                                │
│                  │  Showing 50 record(s)                          │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- Table view of all maintenance
- Columns: Date, Trolley, Description, Technician, Cost, Status After
- Truncated descriptions (hover for full)
- Sortable columns
- Filter by date range (optional)
- Click row for full details
- Add new record button (staff+)

---

## Color Scheme

### Primary Colors
- **Primary Blue:** #0ea5e9 (buttons, links, active states)
- **Success Green:** #10b981 (active status, success messages)
- **Warning Yellow:** #f59e0b (maintenance status, warnings)
- **Danger Red:** #ef4444 (stolen status, critical alerts)
- **Info Blue:** #3b82f6 (recovered status, info alerts)

### Status Badge Colors
- **Active:** Green background, dark green text
- **Maintenance:** Yellow background, dark yellow text
- **Stolen:** Red background, dark red text
- **Decommissioned:** Gray background, dark gray text
- **Recovered:** Blue background, dark blue text

### UI Elements
- **Background:** #f9fafb (light gray)
- **Cards:** #ffffff (white with shadow)
- **Borders:** #e5e7eb (light gray)
- **Text:** #111827 (dark gray/black)
- **Secondary Text:** #6b7280 (medium gray)

---

## Responsive Breakpoints

- **Mobile:** < 768px
  - Single column layouts
  - Hamburger menu
  - Stacked forms
  - Full-width tables (horizontal scroll)

- **Tablet:** 768px - 1024px
  - 2-column grids
  - Visible sidebar (collapsible)
  - Optimized tables

- **Desktop:** > 1024px
  - 3-4 column grids
  - Permanent sidebar
  - Full table views
  - Multi-column forms

---

## Accessibility Features

- **Keyboard Navigation:** Tab through all interactive elements
- **Focus States:** Visible focus rings
- **Color Contrast:** WCAG AA compliant
- **Screen Reader:** Semantic HTML, ARIA labels
- **Font Size:** Readable base size (16px)
- **Touch Targets:** Minimum 44x44px on mobile

---

## Interactive Elements

### Buttons
- **Primary:** Blue background, white text, rounded
- **Secondary:** Gray background, dark text, rounded
- **Danger:** Red background, white text, rounded
- **Hover:** Darker shade, subtle scale
- **Disabled:** Faded, no pointer events

### Forms
- **Input Fields:** White background, gray border, rounded
- **Focus:** Blue border, ring shadow
- **Error:** Red border, red text below
- **Success:** Green border, checkmark icon

### Status Badges
- **Shape:** Rounded pill
- **Size:** Small text, padding
- **Colors:** Match status color scheme

### Cards
- **Shadow:** Subtle elevation
- **Hover:** Increased shadow (if clickable)
- **Border:** None or very light gray
- **Padding:** Generous (24px)

---

## Icons Used (Lucide React)

- **LayoutDashboard** - Dashboard
- **ShoppingCart** - Trolleys
- **ScanLine** - Scan
- **Store** - Stores
- **Wrench** - Maintenance
- **Bell** - Alerts
- **Map** - Map View
- **LogOut** - Logout
- **Search** - Search
- **Eye** - View Details
- **Plus** - Add New
- **ArrowLeft** - Back Navigation
- **MapPin** - Location
- **Calendar** - Dates
- **User** - User Info
- **CheckCircle** - Success
- **AlertCircle** - Warnings
- **AlertTriangle** - Errors

---

This completes the UI mockup documentation. All screens follow consistent design patterns and color schemes for a cohesive user experience.
