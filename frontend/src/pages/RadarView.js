import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import {
  MapPin, ShoppingCart, Navigation, AlertTriangle,
  Battery, Signal, Clock, Filter, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { gpsAPI, storeAPI } from '../services/api';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to handle map centering
const MapViewController = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
};

const RadarView = () => {
  const [stores, setStores] = useState([]);
  const [trolleys, setTrolleys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedTrolley, setSelectedTrolley] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Filter states
  const [showGeofenceCircles, setShowGeofenceCircles] = useState(true);
  const [showInsideGeofence, setShowInsideGeofence] = useState(true);
  const [showOutsideGeofence, setShowOutsideGeofence] = useState(true);
  const [filterByStore, setFilterByStore] = useState(null);

  // Map configuration
  const defaultCenter = [
    parseFloat(process.env.REACT_APP_MAP_DEFAULT_LAT) || -33.8830,
    parseFloat(process.env.REACT_APP_MAP_DEFAULT_LNG) || 18.6330
  ];
  const defaultZoom = parseInt(process.env.REACT_APP_MAP_DEFAULT_ZOOM) || 11;
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(defaultZoom);

  // Fetch data
  const fetchData = useCallback(async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setRefreshing(true);
      }

      // Fetch stores
      const storesResponse = await storeAPI.getAll();
      // Handle different possible response formats
      const storesData = Array.isArray(storesResponse.data)
        ? storesResponse.data
        : storesResponse.data.stores || [];
      setStores(storesData);

      // Fetch GPS locations
      const params = filterByStore ? { store_id: filterByStore } : {};
      const gpsResponse = await gpsAPI.getAllLocations(params);
      const trolleysData = gpsResponse.data.trolleys || gpsResponse.data || [];
      setTrolleys(Array.isArray(trolleysData) ? trolleysData : []);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load radar data:', error);
      toast.error('Failed to load radar data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterByStore]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData(false); // Silent refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Create custom store icon
  const createStoreIcon = (store) => {
    const color = store.brand === 'Checkers' ? '#27AE60' : '#E31837';
    return L.divIcon({
      className: 'custom-store-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 3px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="color: white; font-size: 20px;">🏪</span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });
  };

  // Create custom trolley icon
  const createTrolleyIcon = (trolley) => {
    const isOutside = !trolley.is_within_geofence;
    const color = isOutside ? '#E74C3C' : '#3498DB';
    const icon = isOutside ? '⚠️' : '🛒';

    return L.divIcon({
      className: 'custom-trolley-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          ${isOutside ? 'animation: pulse 2s infinite;' : ''}
        ">
          <span style="font-size: 14px;">${icon}</span>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });
  };

  // Handle store selection
  const handleStoreClick = (store) => {
    setSelectedStore(store);
    setFilterByStore(store.id);
    setMapCenter([parseFloat(store.location_lat), parseFloat(store.location_long)]);
    setMapZoom(14);
  };

  // Clear store filter
  const clearStoreFilter = () => {
    setSelectedStore(null);
    setFilterByStore(null);
    setMapCenter(defaultCenter);
    setMapZoom(defaultZoom);
  };

  // Filter trolleys
  const filteredTrolleys = trolleys.filter(trolley => {
    if (!showInsideGeofence && trolley.is_within_geofence) return false;
    if (!showOutsideGeofence && !trolley.is_within_geofence) return false;
    return true;
  });

  // Count trolleys
  const trolleyStats = {
    total: filteredTrolleys.length,
    inside: filteredTrolleys.filter(t => t.is_within_geofence).length,
    outside: filteredTrolleys.filter(t => !t.is_within_geofence).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
        <span className="ml-3 text-grey-600">Loading radar view...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="border-l-4 border-shoprite-red pl-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">GPS Radar View</h1>
            <p className="text-grey-600">Real-time trolley tracking and geofence monitoring</p>
          </div>
          <div className="flex items-center space-x-4">
            {lastUpdate && (
              <div className="text-sm text-grey-600 flex items-center">
                <Clock size={16} className="mr-2" />
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className={`btn-secondary flex items-center ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`btn-${autoRefresh ? 'primary' : 'secondary'} flex items-center`}
            >
              {autoRefresh ? <Eye size={16} className="mr-2" /> : <EyeOff size={16} className="mr-2" />}
              Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey-600">Total Trolleys</p>
              <p className="text-2xl font-bold text-grey-900">{trolleyStats.total}</p>
            </div>
            <ShoppingCart size={32} className="text-shoprite-red" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey-600">Inside Geofence</p>
              <p className="text-2xl font-bold text-success">{trolleyStats.inside}</p>
            </div>
            <Navigation size={32} className="text-success" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey-600">Outside Geofence</p>
              <p className="text-2xl font-bold text-danger">{trolleyStats.outside}</p>
            </div>
            <AlertTriangle size={32} className="text-danger" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey-600">Active Stores</p>
              <p className="text-2xl font-bold text-grey-900">{stores.length}</p>
            </div>
            <MapPin size={32} className="text-shoprite-red" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar - Stores and Filters */}
        <div className="lg:col-span-1 space-y-4">
          {/* Filters Card */}
          <div className="card">
            <div className="flex items-center mb-4">
              <Filter size={20} className="mr-2 text-shoprite-red" />
              <h2 className="font-bold text-grey-900">Filters</h2>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGeofenceCircles}
                  onChange={(e) => setShowGeofenceCircles(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-shoprite-red"
                />
                <span className="text-sm text-grey-700">Show Geofence Circles</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInsideGeofence}
                  onChange={(e) => setShowInsideGeofence(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-success"
                />
                <span className="text-sm text-grey-700">Inside Geofence</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOutsideGeofence}
                  onChange={(e) => setShowOutsideGeofence(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-danger"
                />
                <span className="text-sm text-grey-700">Outside Geofence</span>
              </label>
            </div>

            {selectedStore && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-bold text-grey-700 mb-2">Filtered by:</p>
                <div className="bg-shoprite-red/10 p-2 rounded flex items-center justify-between">
                  <span className="text-sm text-grey-900">{selectedStore.name}</span>
                  <button
                    onClick={clearStoreFilter}
                    className="text-xs text-shoprite-red hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stores List */}
          <div className="card">
            <h2 className="font-bold text-grey-900 mb-4">Store Locations</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => handleStoreClick(store)}
                  className={`
                    w-full text-left p-3 rounded-lg transition-all duration-300 border-2
                    ${selectedStore?.id === store.id
                      ? 'bg-shoprite-red/10 border-shoprite-red shadow-md'
                      : 'bg-grey-50 border-grey-200 hover:bg-grey-100'
                    }
                  `}
                >
                  <div className="mb-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                      store.brand === 'Shoprite' ? 'bg-shoprite-red text-white' : 'bg-success text-white'
                    }`}>
                      {store.brand}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-grey-900">{store.name}</p>
                  <p className="text-xs text-grey-600">{store.city}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <div className="card-simple p-0 overflow-hidden border-4 border-shoprite-red" style={{ height: 'calc(100vh - 360px)', minHeight: '500px' }}>
            <MapContainer
              center={defaultCenter}
              zoom={defaultZoom}
              style={{ height: '100%', width: '100%' }}
            >
              <MapViewController center={mapCenter} zoom={mapZoom} />

              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Store Markers with Geofence Circles */}
              {stores.map((store) => (
                <React.Fragment key={`store-${store.id}`}>
                  {/* Geofence Circle */}
                  {showGeofenceCircles && (
                    <Circle
                      center={[parseFloat(store.location_lat), parseFloat(store.location_long)]}
                      radius={store.geofence_radius || 500}
                      pathOptions={{
                        color: store.brand === 'Checkers' ? '#27AE60' : '#E31837',
                        fillColor: store.brand === 'Checkers' ? '#27AE60' : '#E31837',
                        fillOpacity: 0.1,
                        weight: 2
                      }}
                    />
                  )}

                  {/* Store Marker */}
                  <Marker
                    position={[parseFloat(store.location_lat), parseFloat(store.location_long)]}
                    icon={createStoreIcon(store)}
                    eventHandlers={{
                      click: () => handleStoreClick(store)
                    }}
                  >
                    <Popup>
                      <div className="p-3 min-w-[220px]">
                        <div className="mb-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                            store.brand === 'Shoprite' ? 'bg-shoprite-red text-white' : 'bg-success text-white'
                          }`}>
                            {store.brand}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-grey-900">{store.name}</h3>
                        {store.address && (
                          <p className="text-sm text-grey-600 mb-2">{store.address}</p>
                        )}
                        <div className="space-y-1 text-sm">
                          <p className="text-grey-600">Geofence: <span className="font-bold">{store.geofence_radius || 500}m</span></p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              ))}

              {/* Trolley Markers with Clustering */}
              <MarkerClusterGroup
                chunkedLoading
                maxClusterRadius={60}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={false}
                zoomToBoundsOnClick={true}
              >
                {filteredTrolleys.map((trolley) => (
                  <Marker
                    key={`trolley-${trolley.id}`}
                    position={[parseFloat(trolley.current_lat), parseFloat(trolley.current_long)]}
                    icon={createTrolleyIcon(trolley)}
                    eventHandlers={{
                      click: () => setSelectedTrolley(trolley)
                    }}
                  >
                    <Popup>
                      <div className="p-3 min-w-[250px]">
                        <h3 className="font-bold text-lg mb-2 text-grey-900">{trolley.rfid_tag}</h3>

                        <div className="space-y-2 mb-3">
                          <div className={`flex items-center justify-between p-2 rounded ${
                            trolley.is_within_geofence ? 'bg-success/10' : 'bg-danger/10'
                          }`}>
                            <span className="text-sm font-medium">Geofence Status</span>
                            <span className={`text-sm font-bold ${
                              trolley.is_within_geofence ? 'text-success' : 'text-danger'
                            }`}>
                              {trolley.is_within_geofence ? 'Inside' : 'Outside'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 bg-grey-50 rounded">
                            <span className="text-sm font-medium">Distance</span>
                            <span className="text-sm font-bold text-grey-900">
                              {trolley.distance_from_store ? `${Math.round(trolley.distance_from_store)}m` : 'N/A'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 bg-grey-50 rounded">
                            <span className="text-sm font-medium">Status</span>
                            <span className={`text-sm font-bold capitalize ${
                              trolley.status === 'active' ? 'text-success' : 'text-warning'
                            }`}>
                              {trolley.status}
                            </span>
                          </div>
                        </div>

                        {trolley.store && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-grey-600">Store: <span className="font-bold">{trolley.store.name}</span></p>
                          </div>
                        )}

                        {trolley.last_location_update && (
                          <div className="pt-2">
                            <p className="text-xs text-grey-600">
                              Updated: {new Date(trolley.last_location_update).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>
          </div>

          {/* Legend */}
          <div className="card mt-4">
            <h3 className="font-bold text-grey-900 mb-4">Map Legend</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-grey-600 font-semibold mb-2 uppercase">Stores</p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-shoprite-red mr-2 flex items-center justify-center border-2 border-white">
                      <span className="text-xs">🏪</span>
                    </div>
                    <span className="text-sm text-grey-700">Shoprite</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-success mr-2 flex items-center justify-center border-2 border-white">
                      <span className="text-xs">🏪</span>
                    </div>
                    <span className="text-sm text-grey-700">Checkers</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-grey-600 font-semibold mb-2 uppercase">Trolleys</p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-blue-500 mr-2 flex items-center justify-center border-2 border-white">
                      <span className="text-xs">🛒</span>
                    </div>
                    <span className="text-sm text-grey-700">Inside Geofence</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-danger mr-2 flex items-center justify-center border-2 border-white">
                      <span className="text-xs">⚠️</span>
                    </div>
                    <span className="text-sm text-grey-700">Outside Geofence</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default RadarView;
