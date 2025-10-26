# CartSaver - Smart Trolley Management System 🛒

A comprehensive full-stack trolley tracking and management system with real-time GPS monitoring, maintenance scheduling, and advanced analytics featuring a premium glassmorphic UI.

## ✨ Features

### Core Functionality
- **Real-time GPS Tracking**: Monitor trolley locations with live updates every 30 seconds
- **Geofence Monitoring**: Automatic alerts when trolleys leave designated areas
- **RFID/Barcode Scanning**: Instant trolley identification and status updates
- **Automated Inactivity Detection**: Auto-flags trolleys inactive for 7+ days as stolen
- **Maintenance Management**: Complete maintenance history and scheduling with monthly tracking
- **Multi-Store Support**: Manage multiple store locations from a single dashboard
- **Alert System**: Real-time notifications for geofence breaches, low battery, and shortages
- **Role-based Access Control**: Secure admin and staff user roles

### Premium Dashboard Features ⭐
- **Glassmorphic Design**: Modern, sleek UI with gradient accents and backdrop blur effects
- **Interactive Charts**:
  - Status distribution donut chart with tooltips
  - GPS tracking trends showing 12-hour history
  - Activity timeline with 24-hour bar chart
  - Sparkline indicators on all stat cards
- **Animated Counters**: Smooth number transitions for real-time data updates
- **Mobile Responsive**: Fully optimized for desktop, tablet, and mobile devices
- **Collapsible Sections**: Mobile-friendly expandable/collapsible content areas
- **Auto-refresh**: Configurable 30-second auto-refresh with manual override
- **5 Key Metrics**: Total Trolleys, Active Trolleys, Maintenance This Month, GPS Tracked, Geofence Breaches

## Project Structure

```
CartSaverDev/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/       # Database and app configuration
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth and validation middleware
│   │   ├── services/     # Business logic
│   │   ├── jobs/         # CRON jobs for automation
│   │   └── utils/        # Helper functions
│   └── server.js
├── frontend/             # React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API calls
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Helper functions
│   │   └── styles/       # CSS/styling
│   └── public/
└── database/
    ├── migrations/       # Database migrations
    └── seeds/            # Sample data
```

## Tech Stack

### Frontend
- **React 18**: Modern UI library with hooks
- **React Router v6**: Client-side routing
- **Recharts**: Beautiful, responsive charts and data visualization
- **Lucide React**: Premium icon library
- **Tailwind CSS**: Utility-first CSS framework with custom glassmorphic utilities
- **Axios**: HTTP client for API requests
- **React Hot Toast**: Elegant toast notifications
- **Leaflet.js**: Interactive map visualization

### Backend
- **Node.js + Express**: RESTful API server
- **PostgreSQL**: Primary database (SQLite supported for development)
- **Sequelize ORM**: Database object-relational mapping
- **JWT**: Secure authentication tokens
- **node-cron**: Scheduled jobs for automation
- **bcrypt**: Password hashing

### Performance Optimizations
- **Lazy Loading**: React.lazy() for code splitting
- **React.memo**: Component memoization
- **useMemo/useCallback**: Hook-level optimizations
- **Suspense Boundaries**: Graceful loading states
- **Chart Lazy Loading**: Deferred loading of visualization components

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure your database credentials in .env
npm run migrate
npm run seed
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Configure API URL in .env
npm start
```

## Database Schema

### Tables
- **trolleys**: Core trolley data (RFID, barcode, status, location)
- **stores**: Store locations with geolocation data
- **status_history**: Complete audit trail of status changes
- **maintenance_records**: Maintenance logs and schedules
- **users**: User accounts with role-based access
- **alerts**: System notifications and warnings

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Trolleys
- `GET /api/trolleys` - List all trolleys (with filters)
- `GET /api/trolleys/:id` - Get trolley details
- `POST /api/trolleys` - Create new trolley
- `PUT /api/trolleys/:id` - Update trolley
- `POST /api/trolleys/scan` - Scan and update trolley status
- `GET /api/trolleys/:id/history` - Get status history

### Stores
- `GET /api/stores` - List all stores
- `GET /api/stores/:id` - Get store details
- `GET /api/stores/:id/trolleys` - Get trolleys by store

### Maintenance
- `GET /api/maintenance` - List maintenance records
- `POST /api/maintenance` - Create maintenance record
- `GET /api/trolleys/:id/maintenance` - Get trolley maintenance history

### Alerts
- `GET /api/alerts` - Get active alerts
- `PUT /api/alerts/:id/resolve` - Resolve alert

## Automated Features

### Inactivity Detection (CRON Job)
- Runs daily at midnight
- Flags trolleys not scanned for 7+ days as "Stolen"
- Assigns default barcode for recovery tracking
- Generates alerts for store managers

### Shortage Detection
- Monitors active trolley count per store
- Triggers alerts when count drops below threshold
- Configurable threshold per store

## Usage

### Scanning a Trolley

1. Navigate to Scan Trolley page
2. Enter RFID tag or barcode
3. View current trolley status and history
4. Select new status (Active, Maintenance, Decommissioned, Recovered)
5. Submit to update

### Viewing Dashboard

- **Overview**: Total trolleys by status across all stores
- **Map View**: Interactive map showing trolley distribution
- **Alerts**: Active notifications requiring attention
- **Recent Activity**: Latest scans and status changes

### Maintenance Management

- View maintenance schedule
- Log new maintenance activities
- Track maintenance frequency
- Predict maintenance needs based on usage

## License

MIT

## Contributors

Development Team - CartSaver Project
