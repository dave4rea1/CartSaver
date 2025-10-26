# CartSaver Database Schema

## Entity Relationship Diagram

```
┌─────────────────────────┐
│        USERS            │
├─────────────────────────┤
│ id (PK)                 │
│ name                    │
│ email (UNIQUE)          │
│ password_hash           │
│ role (ENUM)             │
│ created_at              │
│ updated_at              │
└───────────┬─────────────┘
            │
            │ updated_by (FK)
            │
┌───────────▼─────────────┐         ┌─────────────────────────┐
│   STATUS_HISTORY        │         │        STORES           │
├─────────────────────────┤         ├─────────────────────────┤
│ id (PK)                 │         │ id (PK)                 │
│ trolley_id (FK)         │◄────┐   │ name                    │
│ previous_status         │     │   │ location_lat            │
│ new_status              │     │   │ location_long           │
│ updated_by (FK)         │     │   │ address                 │
│ notes                   │     │   │ active_threshold        │
│ timestamp               │     │   │ created_at              │
└─────────────────────────┘     │   │ updated_at              │
                                │   └───────────┬─────────────┘
                                │               │
                                │               │ store_id (FK)
┌─────────────────────────┐     │   ┌───────────▼─────────────┐
│ MAINTENANCE_RECORDS     │     │   │       TROLLEYS          │
├─────────────────────────┤     │   ├─────────────────────────┤
│ id (PK)                 │     └───┤ id (PK)                 │
│ trolley_id (FK)         │◄────────┤ rfid_tag (UNIQUE)       │
│ maintenance_date        │         │ barcode                 │
│ description             │         │ status (ENUM)           │
│ technician              │         │ store_id (FK)           │
│ status_after            │         │ last_scanned            │
│ cost                    │         │ is_default_barcode      │
│ performed_by (FK)       │         │ created_at              │
│ created_at              │         │ updated_at              │
└─────────────────────────┘         └───────────┬─────────────┘
                                                │
                                                │ trolley_id (FK)
                                    ┌───────────▼─────────────┐
                                    │        ALERTS           │
                                    ├─────────────────────────┤
                                    │ id (PK)                 │
                                    │ store_id (FK)           │
                                    │ trolley_id (FK - NULL)  │
                                    │ type (ENUM)             │
                                    │ severity (ENUM)         │
                                    │ message                 │
                                    │ resolved                │
                                    │ resolved_by (FK)        │
                                    │ resolved_at             │
                                    │ created_at              │
                                    └─────────────────────────┘
```

## Table Definitions

### USERS
Stores user accounts with role-based access control.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique user identifier |
| name | VARCHAR(100) | NOT NULL | Full name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | ENUM | NOT NULL | 'admin' or 'staff' |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_users_email` on (email)
- `idx_users_role` on (role)

---

### STORES
Physical store locations with geolocation data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique store identifier |
| name | VARCHAR(200) | NOT NULL | Store name (e.g., "Shoprite Durbanville") |
| location_lat | DECIMAL(10,8) | NOT NULL | Latitude coordinate |
| location_long | DECIMAL(11,8) | NOT NULL | Longitude coordinate |
| address | TEXT | | Full street address |
| active_threshold | INTEGER | DEFAULT 50 | Minimum active trolleys before alert |
| created_at | TIMESTAMP | DEFAULT NOW() | Store registration time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_stores_location` on (location_lat, location_long)

---

### TROLLEYS
Core trolley inventory with RFID and status tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique trolley identifier |
| rfid_tag | VARCHAR(100) | UNIQUE, NOT NULL | RFID tag identifier |
| barcode | VARCHAR(100) | | Barcode (or default if stolen) |
| status | ENUM | NOT NULL | 'active', 'maintenance', 'stolen', 'decommissioned', 'recovered' |
| store_id | INTEGER | FOREIGN KEY → stores(id) | Assigned store location |
| last_scanned | TIMESTAMP | | Last scan timestamp |
| is_default_barcode | BOOLEAN | DEFAULT FALSE | True if auto-assigned during theft flag |
| created_at | TIMESTAMP | DEFAULT NOW() | Trolley registration time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_trolleys_rfid` on (rfid_tag)
- `idx_trolleys_status` on (status)
- `idx_trolleys_store` on (store_id)
- `idx_trolleys_last_scanned` on (last_scanned)

**Status Values:**
- `active`: In use and operational
- `maintenance`: Under repair or servicing
- `stolen`: Flagged due to 7+ days inactivity
- `decommissioned`: Permanently retired
- `recovered`: Previously stolen, now recovered

---

### STATUS_HISTORY
Audit trail of all trolley status changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique record identifier |
| trolley_id | INTEGER | FOREIGN KEY → trolleys(id) | Referenced trolley |
| previous_status | VARCHAR(50) | | Status before change |
| new_status | VARCHAR(50) | NOT NULL | Status after change |
| updated_by | INTEGER | FOREIGN KEY → users(id) | User who made the change |
| notes | TEXT | | Optional notes/reason |
| timestamp | TIMESTAMP | DEFAULT NOW() | When change occurred |

**Indexes:**
- `idx_status_history_trolley` on (trolley_id)
- `idx_status_history_timestamp` on (timestamp DESC)

---

### MAINTENANCE_RECORDS
Maintenance and repair history for trolleys.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique record identifier |
| trolley_id | INTEGER | FOREIGN KEY → trolleys(id) | Trolley being serviced |
| maintenance_date | DATE | NOT NULL | Date of maintenance |
| description | TEXT | NOT NULL | Details of work performed |
| technician | VARCHAR(100) | | Name of technician |
| status_after | VARCHAR(50) | | Status after maintenance |
| cost | DECIMAL(10,2) | | Maintenance cost |
| performed_by | INTEGER | FOREIGN KEY → users(id) | User who logged the record |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation time |

**Indexes:**
- `idx_maintenance_trolley` on (trolley_id)
- `idx_maintenance_date` on (maintenance_date DESC)

---

### ALERTS
System-generated notifications and warnings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique alert identifier |
| store_id | INTEGER | FOREIGN KEY → stores(id) | Related store |
| trolley_id | INTEGER | FOREIGN KEY → trolleys(id), NULL | Related trolley (if applicable) |
| type | ENUM | NOT NULL | 'shortage', 'inactivity', 'maintenance_due', 'recovered' |
| severity | ENUM | NOT NULL | 'info', 'warning', 'critical' |
| message | TEXT | NOT NULL | Alert message content |
| resolved | BOOLEAN | DEFAULT FALSE | Whether alert has been addressed |
| resolved_by | INTEGER | FOREIGN KEY → users(id) | User who resolved |
| resolved_at | TIMESTAMP | | When alert was resolved |
| created_at | TIMESTAMP | DEFAULT NOW() | Alert creation time |

**Indexes:**
- `idx_alerts_store` on (store_id)
- `idx_alerts_resolved` on (resolved, created_at DESC)
- `idx_alerts_type` on (type)

**Alert Types:**
- `shortage`: Active trolley count below threshold
- `inactivity`: Trolley flagged as stolen (7+ days)
- `maintenance_due`: Trolley needs maintenance
- `recovered`: Previously stolen trolley recovered

---

## Business Rules

### Inactivity Detection (Automated)
- **Trigger**: CRON job runs daily at midnight
- **Condition**: `last_scanned` is NULL or > 7 days ago AND status != 'decommissioned'
- **Action**:
  1. Set status to 'stolen'
  2. Generate default barcode: `STOLEN-[trolley_id]-[timestamp]`
  3. Set `is_default_barcode = TRUE`
  4. Create entry in `status_history`
  5. Create alert with type 'inactivity'

### Recovery Process
- **Trigger**: Trolley with status 'stolen' is scanned
- **Action**:
  1. Set status to 'recovered'
  2. Remove default barcode if `is_default_barcode = TRUE`
  3. Update `last_scanned`
  4. Create entry in `status_history`
  5. Create alert with type 'recovered'

### Shortage Detection
- **Trigger**: Count of trolleys with status 'active' for a store drops below `active_threshold`
- **Action**: Create alert with type 'shortage' and severity 'warning'

### Maintenance Workflow
- When trolley status changes to 'maintenance':
  1. Prompt user to create `maintenance_records` entry
  2. Log expected return date
- When trolley returns from maintenance:
  1. Update status (typically to 'active')
  2. Update `status_after` in maintenance record
  3. Record actual return date

---

## Sample Data Queries

### Get Active Trolleys by Store
```sql
SELECT s.name, COUNT(t.id) as active_count
FROM stores s
LEFT JOIN trolleys t ON s.id = t.store_id AND t.status = 'active'
GROUP BY s.id, s.name
ORDER BY active_count DESC;
```

### Find Trolleys Due for Inactivity Flag
```sql
SELECT id, rfid_tag, last_scanned, status
FROM trolleys
WHERE status != 'decommissioned'
  AND (last_scanned IS NULL OR last_scanned < NOW() - INTERVAL '7 days');
```

### Maintenance Frequency by Trolley
```sql
SELECT t.rfid_tag, COUNT(mr.id) as maintenance_count,
       AVG(EXTRACT(EPOCH FROM (LEAD(mr.maintenance_date) OVER (PARTITION BY t.id ORDER BY mr.maintenance_date) - mr.maintenance_date))/86400) as avg_days_between
FROM trolleys t
LEFT JOIN maintenance_records mr ON t.id = mr.trolley_id
GROUP BY t.id, t.rfid_tag
HAVING COUNT(mr.id) > 0
ORDER BY maintenance_count DESC;
```

### Unresolved Alerts by Store
```sql
SELECT s.name, a.type, a.severity, a.message, a.created_at
FROM alerts a
JOIN stores s ON a.store_id = s.id
WHERE a.resolved = FALSE
ORDER BY a.severity DESC, a.created_at DESC;
```

---

## Migration Strategy

1. **Initial Setup**: Create all tables with proper constraints
2. **Indexes**: Add indexes for query optimization
3. **Seed Data**: Populate with sample stores, users, and trolleys
4. **Testing**: Verify all foreign key relationships and constraints
5. **CRON Setup**: Enable automated inactivity detection job

---

## Backup and Recovery

- **Daily automated backups** of PostgreSQL database
- **Point-in-time recovery** enabled
- **Audit logs** maintained via `status_history` table
- **Data retention**: Keep all historical records indefinitely
