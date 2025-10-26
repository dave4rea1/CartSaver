-- Migration: Add GPS Tracking to Trolleys
-- Description: Adds location tracking fields to trolleys table and creates location history table
-- Date: 2025-10-17

-- ============================================
-- PART 1: Add location fields to trolleys table
-- ============================================

-- Add GPS coordinates
ALTER TABLE trolleys
ADD COLUMN IF NOT EXISTS current_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS current_long DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_within_geofence BOOLEAN DEFAULT TRUE;

-- Add comments for documentation
COMMENT ON COLUMN trolleys.current_lat IS 'Current GPS latitude of the trolley';
COMMENT ON COLUMN trolleys.current_long IS 'Current GPS longitude of the trolley';
COMMENT ON COLUMN trolleys.last_location_update IS 'Timestamp of last GPS location update';
COMMENT ON COLUMN trolleys.is_within_geofence IS 'Whether trolley is within store geofence radius';

-- Create indexes for location queries
CREATE INDEX IF NOT EXISTS idx_trolleys_location
ON trolleys(current_lat, current_long)
WHERE current_lat IS NOT NULL AND current_long IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trolleys_geofence
ON trolleys(is_within_geofence)
WHERE is_within_geofence = FALSE;

CREATE INDEX IF NOT EXISTS idx_trolleys_location_update
ON trolleys(last_location_update DESC);

-- ============================================
-- PART 2: Create trolley_location_history table
-- ============================================

CREATE TABLE IF NOT EXISTS trolley_location_history (
  id SERIAL PRIMARY KEY,
  trolley_id INTEGER NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  is_within_geofence BOOLEAN DEFAULT TRUE,
  distance_from_store DECIMAL(10, 2),
  speed_kmh DECIMAL(6, 2),
  battery_level INTEGER,
  signal_strength INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraint
  CONSTRAINT fk_trolley_location_trolley
    FOREIGN KEY (trolley_id)
    REFERENCES trolleys(id)
    ON DELETE CASCADE,

  -- Validation constraints
  CONSTRAINT chk_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT chk_longitude CHECK (longitude >= -180 AND longitude <= 180),
  CONSTRAINT chk_distance CHECK (distance_from_store >= 0),
  CONSTRAINT chk_speed CHECK (speed_kmh >= 0),
  CONSTRAINT chk_battery CHECK (battery_level >= 0 AND battery_level <= 100),
  CONSTRAINT chk_signal CHECK (signal_strength >= 0 AND signal_strength <= 100)
);

-- Add comments for documentation
COMMENT ON TABLE trolley_location_history IS 'Historical GPS tracking data for trolleys';
COMMENT ON COLUMN trolley_location_history.distance_from_store IS 'Distance from assigned store in meters';
COMMENT ON COLUMN trolley_location_history.speed_kmh IS 'Calculated speed in km/h based on previous location';
COMMENT ON COLUMN trolley_location_history.battery_level IS 'GPS tracker battery percentage (0-100)';
COMMENT ON COLUMN trolley_location_history.signal_strength IS 'GPS signal strength percentage (0-100)';

-- Create indexes for location history queries
CREATE INDEX IF NOT EXISTS idx_location_history_trolley
ON trolley_location_history(trolley_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_location_history_timestamp
ON trolley_location_history(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_location_history_geofence
ON trolley_location_history(trolley_id, is_within_geofence)
WHERE is_within_geofence = FALSE;

CREATE INDEX IF NOT EXISTS idx_location_history_coords
ON trolley_location_history(latitude, longitude);

-- Composite index for common queries (trolley + recent locations)
CREATE INDEX IF NOT EXISTS idx_location_history_trolley_recent
ON trolley_location_history(trolley_id, timestamp DESC)
WHERE timestamp >= NOW() - INTERVAL '24 hours';

-- ============================================
-- PART 3: Create helper function for geofence checking
-- ============================================

-- Function to calculate distance between two GPS coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL(10, 8),
  lon1 DECIMAL(11, 8),
  lat2 DECIMAL(10, 8),
  lon2 DECIMAL(11, 8)
) RETURNS DECIMAL(10, 2) AS $$
DECLARE
  r CONSTANT DECIMAL := 6371000; -- Earth radius in meters
  phi1 DECIMAL;
  phi2 DECIMAL;
  delta_phi DECIMAL;
  delta_lambda DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  -- Convert to radians
  phi1 := radians(lat1);
  phi2 := radians(lat2);
  delta_phi := radians(lat2 - lat1);
  delta_lambda := radians(lon2 - lon1);

  -- Haversine formula
  a := sin(delta_phi / 2) * sin(delta_phi / 2) +
       cos(phi1) * cos(phi2) *
       sin(delta_lambda / 2) * sin(delta_lambda / 2);
  c := 2 * atan2(sqrt(a), sqrt(1 - a));

  -- Return distance in meters
  RETURN ROUND((r * c)::numeric, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance IS 'Calculate distance in meters between two GPS coordinates using Haversine formula';

-- ============================================
-- PART 4: Create trigger for automatic geofence updates
-- ============================================

-- Function to check if trolley is within store geofence
CREATE OR REPLACE FUNCTION update_trolley_geofence_status()
RETURNS TRIGGER AS $$
DECLARE
  store_lat DECIMAL(10, 8);
  store_lon DECIMAL(11, 8);
  store_radius INTEGER;
  distance_meters DECIMAL(10, 2);
BEGIN
  -- Only run if location was updated
  IF NEW.current_lat IS NOT NULL AND NEW.current_long IS NOT NULL THEN
    -- Get store location and geofence radius
    SELECT location_lat, location_long, geofence_radius
    INTO store_lat, store_lon, store_radius
    FROM stores
    WHERE id = NEW.store_id;

    -- Calculate distance from store
    distance_meters := calculate_distance(
      store_lat,
      store_lon,
      NEW.current_lat,
      NEW.current_long
    );

    -- Update geofence status
    IF distance_meters <= store_radius THEN
      NEW.is_within_geofence := TRUE;
    ELSE
      NEW.is_within_geofence := FALSE;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_geofence ON trolleys;
CREATE TRIGGER trigger_update_geofence
  BEFORE UPDATE OF current_lat, current_long
  ON trolleys
  FOR EACH ROW
  EXECUTE FUNCTION update_trolley_geofence_status();

COMMENT ON FUNCTION update_trolley_geofence_status IS 'Automatically update geofence status when trolley location changes';

-- ============================================
-- PART 5: Create trigger for location history
-- ============================================

-- Function to automatically log location changes to history
CREATE OR REPLACE FUNCTION log_trolley_location_history()
RETURNS TRIGGER AS $$
DECLARE
  store_lat DECIMAL(10, 8);
  store_lon DECIMAL(11, 8);
  distance_meters DECIMAL(10, 2);
  prev_lat DECIMAL(10, 8);
  prev_lon DECIMAL(11, 8);
  prev_time TIMESTAMP;
  calculated_speed DECIMAL(6, 2);
  time_diff_hours DECIMAL(10, 4);
  distance_km DECIMAL(10, 4);
BEGIN
  -- Only log if location was actually updated
  IF NEW.current_lat IS NOT NULL AND NEW.current_long IS NOT NULL THEN
    -- Get store location
    SELECT location_lat, location_long
    INTO store_lat, store_lon
    FROM stores
    WHERE id = NEW.store_id;

    -- Calculate distance from store
    distance_meters := calculate_distance(
      store_lat,
      store_lon,
      NEW.current_lat,
      NEW.current_long
    );

    -- Calculate speed if we have previous location
    calculated_speed := NULL;
    IF OLD.current_lat IS NOT NULL AND OLD.current_long IS NOT NULL AND OLD.last_location_update IS NOT NULL THEN
      time_diff_hours := EXTRACT(EPOCH FROM (NEW.last_location_update - OLD.last_location_update)) / 3600.0;

      -- Only calculate speed if time difference is reasonable (more than 10 seconds, less than 1 hour)
      IF time_diff_hours > 0.0028 AND time_diff_hours < 1 THEN
        distance_km := calculate_distance(
          OLD.current_lat,
          OLD.current_long,
          NEW.current_lat,
          NEW.current_long
        ) / 1000.0;

        calculated_speed := ROUND((distance_km / time_diff_hours)::numeric, 2);

        -- Cap unrealistic speeds (max 50 km/h for a trolley)
        IF calculated_speed > 50 THEN
          calculated_speed := 50;
        END IF;
      END IF;
    END IF;

    -- Insert into history table
    INSERT INTO trolley_location_history (
      trolley_id,
      latitude,
      longitude,
      is_within_geofence,
      distance_from_store,
      speed_kmh,
      timestamp
    ) VALUES (
      NEW.id,
      NEW.current_lat,
      NEW.current_long,
      NEW.is_within_geofence,
      distance_meters,
      calculated_speed,
      NEW.last_location_update
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_log_location_history ON trolleys;
CREATE TRIGGER trigger_log_location_history
  AFTER UPDATE OF current_lat, current_long
  ON trolleys
  FOR EACH ROW
  EXECUTE FUNCTION log_trolley_location_history();

COMMENT ON FUNCTION log_trolley_location_history IS 'Automatically log trolley location changes to history table';

-- ============================================
-- PART 6: Create useful views
-- ============================================

-- View: Active trolleys outside geofence (potential theft/issues)
CREATE OR REPLACE VIEW v_trolleys_out_of_bounds AS
SELECT
  t.id,
  t.rfid_tag,
  t.status,
  t.store_id,
  s.name AS store_name,
  s.brand,
  t.current_lat,
  t.current_long,
  t.last_location_update,
  calculate_distance(
    s.location_lat,
    s.location_long,
    t.current_lat,
    t.current_long
  ) AS distance_from_store_meters,
  s.geofence_radius,
  calculate_distance(
    s.location_lat,
    s.location_long,
    t.current_lat,
    t.current_long
  ) - s.geofence_radius AS meters_outside_geofence
FROM trolleys t
JOIN stores s ON t.store_id = s.id
WHERE t.is_within_geofence = FALSE
  AND t.current_lat IS NOT NULL
  AND t.current_long IS NOT NULL
ORDER BY distance_from_store_meters DESC;

COMMENT ON VIEW v_trolleys_out_of_bounds IS 'All trolleys currently outside their store geofence';

-- View: Recent trolley locations (last 24 hours)
CREATE OR REPLACE VIEW v_recent_trolley_locations AS
SELECT
  t.id AS trolley_id,
  t.rfid_tag,
  t.status,
  s.name AS store_name,
  h.latitude,
  h.longitude,
  h.is_within_geofence,
  h.distance_from_store,
  h.speed_kmh,
  h.timestamp
FROM trolley_location_history h
JOIN trolleys t ON h.trolley_id = t.id
JOIN stores s ON t.store_id = s.id
WHERE h.timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY h.timestamp DESC;

COMMENT ON VIEW v_recent_trolley_locations IS 'All trolley location updates from the last 24 hours';

-- ============================================
-- PART 7: Migration verification
-- ============================================

-- Verify columns were added
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'trolleys'
    AND column_name IN ('current_lat', 'current_long', 'last_location_update', 'is_within_geofence');

  IF column_count = 4 THEN
    RAISE NOTICE '✓ All location columns added to trolleys table';
  ELSE
    RAISE WARNING '⚠ Expected 4 location columns, found %', column_count;
  END IF;
END $$;

-- Verify table was created
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'trolley_location_history'
  ) INTO table_exists;

  IF table_exists THEN
    RAISE NOTICE '✓ trolley_location_history table created';
  ELSE
    RAISE WARNING '⚠ trolley_location_history table not found';
  END IF;
END $$;

-- Show summary
DO $$
DECLARE
  index_count INTEGER;
  view_count INTEGER;
BEGIN
  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND (tablename = 'trolleys' OR tablename = 'trolley_location_history')
    AND indexname LIKE '%location%' OR indexname LIKE '%geofence%';

  -- Count views
  SELECT COUNT(*) INTO view_count
  FROM information_schema.views
  WHERE table_schema = 'public'
    AND (table_name = 'v_trolleys_out_of_bounds' OR table_name = 'v_recent_trolley_locations');

  RAISE NOTICE '✓ Created % location-related indexes', index_count;
  RAISE NOTICE '✓ Created % views', view_count;
  RAISE NOTICE '✓ GPS tracking migration completed successfully!';
END $$;
