# CartSaver API Reference

Complete REST API documentation for CartSaver backend endpoints.

**Base URL:** `http://localhost:5000/api`

**Authentication:** JWT Bearer token (except login/register)

**Header Format:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "staff"  // optional: "admin" or "staff" (default: "staff")
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "staff",
    "created_at": "2025-10-06T10:00:00.000Z",
    "updated_at": "2025-10-06T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400` - Email already registered
- `400` - Validation errors

---

### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "admin@cartsaver.com",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@cartsaver.com",
    "role": "admin",
    "created_at": "2025-10-06T10:00:00.000Z",
    "updated_at": "2025-10-06T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `401` - Invalid credentials

---

### GET /auth/me
Get current authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@cartsaver.com",
    "role": "admin",
    "created_at": "2025-10-06T10:00:00.000Z",
    "updated_at": "2025-10-06T10:00:00.000Z"
  }
}
```

**Errors:**
- `401` - Invalid or expired token

---

## Trolley Endpoints

### GET /trolleys
List all trolleys with optional filtering.

**Query Parameters:**
- `status` - Filter by status (active, maintenance, stolen, decommissioned, recovered)
- `store_id` - Filter by store ID
- `search` - Search by RFID tag or barcode

**Example:** `/trolleys?status=active&store_id=1`

**Response (200):**
```json
{
  "trolleys": [
    {
      "id": 1,
      "rfid_tag": "RFID-00001",
      "barcode": "BC-00001",
      "status": "active",
      "store_id": 1,
      "last_scanned": "2025-10-06T14:30:00.000Z",
      "is_default_barcode": false,
      "created_at": "2025-09-01T10:00:00.000Z",
      "updated_at": "2025-10-06T14:30:00.000Z",
      "store": {
        "id": 1,
        "name": "Shoprite Durbanville",
        "location_lat": "-33.84000000",
        "location_long": "18.65000000"
      }
    }
  ]
}
```

---

### GET /trolleys/:id
Get detailed information about a specific trolley.

**Response (200):**
```json
{
  "trolley": {
    "id": 1,
    "rfid_tag": "RFID-00001",
    "barcode": "BC-00001",
    "status": "active",
    "store_id": 1,
    "last_scanned": "2025-10-06T14:30:00.000Z",
    "is_default_barcode": false,
    "created_at": "2025-09-01T10:00:00.000Z",
    "updated_at": "2025-10-06T14:30:00.000Z",
    "store": {
      "id": 1,
      "name": "Shoprite Durbanville",
      "address": "123 Main Road, Durbanville",
      "location_lat": "-33.84000000",
      "location_long": "18.65000000"
    },
    "statusHistory": [
      {
        "id": 5,
        "trolley_id": 1,
        "previous_status": "maintenance",
        "new_status": "active",
        "updated_by": 2,
        "notes": "Repair completed",
        "timestamp": "2025-10-05T12:00:00.000Z",
        "user": {
          "id": 2,
          "name": "John Smith",
          "email": "john@cartsaver.com"
        }
      }
    ],
    "maintenanceRecords": [
      {
        "id": 3,
        "trolley_id": 1,
        "maintenance_date": "2025-10-01",
        "description": "Replaced damaged wheel",
        "technician": "Mike Williams",
        "status_after": "active",
        "cost": "150.00",
        "performed_by": 2,
        "created_at": "2025-10-01T10:00:00.000Z"
      }
    ]
  }
}
```

**Errors:**
- `404` - Trolley not found

---

### POST /trolleys
Create a new trolley (Admin only).

**Request Body:**
```json
{
  "rfid_tag": "RFID-00100",
  "barcode": "BC-00100",
  "store_id": 1,
  "status": "active"  // optional, defaults to "active"
}
```

**Response (201):**
```json
{
  "message": "Trolley registered successfully",
  "trolley": {
    "id": 100,
    "rfid_tag": "RFID-00100",
    "barcode": "BC-00100",
    "status": "active",
    "store_id": 1,
    "last_scanned": "2025-10-06T15:00:00.000Z",
    "is_default_barcode": false,
    "created_at": "2025-10-06T15:00:00.000Z",
    "updated_at": "2025-10-06T15:00:00.000Z"
  }
}
```

**Errors:**
- `400` - RFID tag already registered
- `403` - Admin access required

---

### PUT /trolleys/:id
Update trolley information (Admin only).

**Request Body:**
```json
{
  "rfid_tag": "RFID-00100-NEW",
  "barcode": "BC-00100-NEW",
  "store_id": 2,
  "status": "maintenance"
}
```

**Response (200):**
```json
{
  "message": "Trolley updated successfully",
  "trolley": { /* updated trolley object */ }
}
```

**Errors:**
- `404` - Trolley not found
- `403` - Admin access required

---

### POST /trolleys/scan
Scan a trolley and optionally update its status.

**Request Body:**
```json
{
  "identifier": "RFID-00001",  // RFID tag or barcode
  "new_status": "maintenance",  // optional
  "notes": "Wheel damaged, needs repair"  // optional
}
```

**Response (200):**
```json
{
  "message": "Trolley scanned successfully",
  "trolley": { /* trolley object with updated last_scanned */ },
  "status_changed": true
}
```

**Special Cases:**
- If trolley is "stolen" and new_status is "recovered", default barcode is removed
- Creates status_history entry if status changed
- Creates alert if trolley recovered from stolen status

**Errors:**
- `404` - Trolley not found

---

### GET /trolleys/:id/history
Get complete status history for a trolley.

**Response (200):**
```json
{
  "history": [
    {
      "id": 10,
      "trolley_id": 1,
      "previous_status": "active",
      "new_status": "maintenance",
      "updated_by": 2,
      "notes": "Wheel damaged",
      "timestamp": "2025-10-01T10:00:00.000Z",
      "user": {
        "id": 2,
        "name": "John Smith",
        "email": "john@cartsaver.com"
      }
    }
  ]
}
```

---

### DELETE /trolleys/:id
Delete a trolley (Admin only).

**Response (200):**
```json
{
  "message": "Trolley deleted successfully"
}
```

**Errors:**
- `404` - Trolley not found
- `403` - Admin access required

---

## Store Endpoints

### GET /stores
List all stores with trolley counts.

**Response (200):**
```json
{
  "stores": [
    {
      "id": 1,
      "name": "Shoprite Durbanville",
      "location_lat": "-33.84000000",
      "location_long": "18.65000000",
      "address": "123 Main Road, Durbanville",
      "active_threshold": 50,
      "created_at": "2025-09-01T10:00:00.000Z",
      "updated_at": "2025-09-01T10:00:00.000Z",
      "trolley_counts": {
        "active": 50,
        "maintenance": 5,
        "stolen": 2,
        "decommissioned": 3,
        "recovered": 0,
        "total": 60
      }
    }
  ]
}
```

---

### GET /stores/:id
Get store details with all trolleys.

**Response (200):**
```json
{
  "store": {
    "id": 1,
    "name": "Shoprite Durbanville",
    "location_lat": "-33.84000000",
    "location_long": "18.65000000",
    "address": "123 Main Road, Durbanville",
    "active_threshold": 50,
    "created_at": "2025-09-01T10:00:00.000Z",
    "updated_at": "2025-09-01T10:00:00.000Z",
    "trolleys": [ /* array of trolley objects */ ]
  }
}
```

**Errors:**
- `404` - Store not found

---

### POST /stores
Create a new store (Admin only).

**Request Body:**
```json
{
  "name": "Shoprite Tyger Valley",
  "location_lat": -33.8670,
  "location_long": 18.6360,
  "address": "321 Willie van Schoor Ave, Bellville",
  "active_threshold": 70
}
```

**Response (201):**
```json
{
  "message": "Store created successfully",
  "store": { /* created store object */ }
}
```

**Errors:**
- `403` - Admin access required

---

### PUT /stores/:id
Update store information (Admin only).

**Request Body:**
```json
{
  "name": "Shoprite Tyger Valley (Updated)",
  "active_threshold": 80
}
```

**Response (200):**
```json
{
  "message": "Store updated successfully",
  "store": { /* updated store object */ }
}
```

**Errors:**
- `404` - Store not found
- `403` - Admin access required

---

### DELETE /stores/:id
Delete a store (Admin only).

**Response (200):**
```json
{
  "message": "Store deleted successfully"
}
```

**Errors:**
- `400` - Cannot delete store with associated trolleys
- `404` - Store not found
- `403` - Admin access required

---

### GET /stores/:id/trolleys
Get all trolleys for a specific store.

**Query Parameters:**
- `status` - Filter by status

**Response (200):**
```json
{
  "trolleys": [ /* array of trolley objects */ ]
}
```

---

## Maintenance Endpoints

### GET /maintenance
List all maintenance records.

**Query Parameters:**
- `trolley_id` - Filter by trolley
- `start_date` - Filter by date range (ISO format)
- `end_date` - Filter by date range (ISO format)

**Response (200):**
```json
{
  "records": [
    {
      "id": 1,
      "trolley_id": 1,
      "maintenance_date": "2025-10-01",
      "description": "Replaced damaged wheel and lubricated joints",
      "technician": "Mike Williams",
      "status_after": "active",
      "cost": "150.00",
      "performed_by": 2,
      "created_at": "2025-10-01T10:00:00.000Z",
      "trolley": {
        "id": 1,
        "rfid_tag": "RFID-00001",
        "barcode": "BC-00001",
        "status": "active"
      },
      "user": {
        "id": 2,
        "name": "John Smith",
        "email": "john@cartsaver.com"
      }
    }
  ]
}
```

---

### POST /maintenance
Create a new maintenance record.

**Request Body:**
```json
{
  "trolley_id": 1,
  "maintenance_date": "2025-10-06",  // optional, defaults to today
  "description": "Replaced damaged wheel",
  "technician": "Mike Williams",
  "status_after": "active",
  "cost": 150.00
}
```

**Response (201):**
```json
{
  "message": "Maintenance record created successfully",
  "record": { /* created maintenance record */ }
}
```

**Errors:**
- `404` - Trolley not found

---

### GET /maintenance/:id
Get maintenance record details.

**Response (200):**
```json
{
  "record": { /* maintenance record with trolley and user */ }
}
```

**Errors:**
- `404` - Maintenance record not found

---

### GET /maintenance/trolley/:trolley_id
Get all maintenance records for a specific trolley.

**Response (200):**
```json
{
  "records": [ /* array of maintenance records */ ]
}
```

---

### PUT /maintenance/:id
Update maintenance record (Admin only).

**Request Body:**
```json
{
  "description": "Updated description",
  "cost": 200.00
}
```

**Response (200):**
```json
{
  "message": "Maintenance record updated successfully",
  "record": { /* updated record */ }
}
```

**Errors:**
- `404` - Record not found
- `403` - Admin access required

---

### DELETE /maintenance/:id
Delete maintenance record (Admin only).

**Response (200):**
```json
{
  "message": "Maintenance record deleted successfully"
}
```

---

## Alert Endpoints

### GET /alerts
List all alerts with filtering.

**Query Parameters:**
- `resolved` - true/false
- `type` - shortage, inactivity, maintenance_due, recovered
- `severity` - info, warning, critical
- `store_id` - Filter by store

**Response (200):**
```json
{
  "alerts": [
    {
      "id": 1,
      "store_id": 1,
      "trolley_id": 5,
      "type": "inactivity",
      "severity": "warning",
      "message": "Trolley RFID-00005 at Shoprite Durbanville has been flagged as stolen due to inactivity",
      "resolved": false,
      "resolved_by": null,
      "resolved_at": null,
      "created_at": "2025-10-06T00:01:00.000Z",
      "store": {
        "id": 1,
        "name": "Shoprite Durbanville"
      },
      "trolley": {
        "id": 5,
        "rfid_tag": "RFID-00005",
        "barcode": "STOLEN-5-1696550400000"
      }
    }
  ]
}
```

---

### GET /alerts/:id
Get alert details.

**Response (200):**
```json
{
  "alert": { /* alert object with store, trolley, and resolvedBy user */ }
}
```

**Errors:**
- `404` - Alert not found

---

### PUT /alerts/:id/resolve
Resolve an alert.

**Response (200):**
```json
{
  "message": "Alert resolved successfully",
  "alert": {
    "id": 1,
    "resolved": true,
    "resolved_by": 2,
    "resolved_at": "2025-10-06T15:00:00.000Z",
    /* ... other fields ... */
  }
}
```

**Errors:**
- `400` - Alert already resolved
- `404` - Alert not found

---

### DELETE /alerts/:id
Delete an alert (Admin only).

**Response (200):**
```json
{
  "message": "Alert deleted successfully"
}
```

---

### GET /alerts/count
Get count of unresolved alerts grouped by severity.

**Response (200):**
```json
{
  "total": 5,
  "by_severity": {
    "info": 1,
    "warning": 3,
    "critical": 1
  }
}
```

---

## Dashboard Endpoints

### GET /dashboard/stats
Get dashboard summary statistics.

**Response (200):**
```json
{
  "summary": {
    "total_trolleys": 100,
    "status_counts": {
      "active": 75,
      "maintenance": 10,
      "stolen": 8,
      "decommissioned": 5,
      "recovered": 2
    },
    "unresolved_alerts": 5,
    "maintenance_this_month": 12
  },
  "recent_activity": [
    {
      "id": 50,
      "trolley_id": 1,
      "previous_status": "active",
      "new_status": "maintenance",
      "updated_by": 2,
      "notes": "Wheel damaged",
      "timestamp": "2025-10-06T14:00:00.000Z",
      "trolley": {
        "id": 1,
        "rfid_tag": "RFID-00001"
      },
      "user": {
        "id": 2,
        "name": "John Smith"
      }
    }
  ],
  "stores": [
    {
      "id": 1,
      "name": "Shoprite Durbanville",
      "active": 50,
      "total": 60
    }
  ]
}
```

---

### GET /dashboard/map
Get map data for all stores.

**Response (200):**
```json
{
  "stores": [
    {
      "id": 1,
      "name": "Shoprite Durbanville",
      "latitude": -33.84,
      "longitude": 18.65,
      "address": "123 Main Road, Durbanville",
      "trolley_counts": {
        "active": 50,
        "maintenance": 5,
        "stolen": 2,
        "total": 60
      }
    }
  ]
}
```

---

### GET /dashboard/analytics
Get analytics data for charts.

**Query Parameters:**
- `period` - Number of days (default: 30)

**Response (200):**
```json
{
  "period": "30 days",
  "status_changes": [
    {
      "date": "2025-10-01",
      "new_status": "active",
      "count": 15
    }
  ],
  "maintenance": [
    {
      "date": "2025-10-01",
      "total_cost": 450.00,
      "count": 3
    }
  ],
  "stolen_trends": [
    {
      "date": "2025-10-01",
      "count": 2
    }
  ]
}
```

---

## Error Responses

All endpoints may return these common errors:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

or

```json
{
  "error": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "Trolley not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP
- **Response when exceeded:**
```json
{
  "error": "Too many requests, please try again later"
}
```

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cartsaver.com","password":"admin123"}'
```

### Get Trolleys
```bash
curl -X GET http://localhost:5000/api/trolleys \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Scan Trolley
```bash
curl -X POST http://localhost:5000/api/trolleys/scan \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"RFID-00001","new_status":"maintenance","notes":"Needs repair"}'
```

---

## Postman Collection

Import this JSON to Postman for quick testing:

```json
{
  "info": {
    "name": "CartSaver API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

---

For more information, see [SETUP.md](./SETUP.md) and [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md).
