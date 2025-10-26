import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, ShoppingCart, Wrench, AlertTriangle } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapView = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState(null);

  const defaultCenter = [
    parseFloat(process.env.REACT_APP_MAP_DEFAULT_LAT) || -33.8830,
    parseFloat(process.env.REACT_APP_MAP_DEFAULT_LNG) || 18.6330
  ];
  const defaultZoom = parseInt(process.env.REACT_APP_MAP_DEFAULT_ZOOM) || 11;

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      const response = await dashboardAPI.getMapData();
      setStores(response.data.stores);
    } catch (error) {
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  const createCustomIcon = (color, borderColor = '#FFFFFF') => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid ${borderColor};
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          <div style="
            transform: rotate(45deg);
            margin-top: 6px;
            margin-left: 7px;
            color: white;
            font-size: 16px;
          ">📍</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  // Phase 2B: Brand-specific marker colors
  const getMarkerColor = (store) => {
    // Primary color based on brand
    if (store.brand === 'Checkers') {
      return '#27AE60'; // Checkers green
    }
    return '#E31837'; // Shoprite red
  };

  const getMarkerBorderColor = (store) => {
    // Border color indicates trolley status
    const activeRatio = store.trolley_counts.active / store.trolley_counts.total;
    if (activeRatio < 0.4) return '#E74C3C'; // Critical - danger red
    if (activeRatio < 0.7) return '#F39C12'; // Warning - orange
    return '#FFFFFF'; // Good - white
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
        <span className="ml-3 text-grey-600">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header - Phase 2A */}
      <div className="border-l-4 border-shoprite-red pl-4">
        <h1 className="page-title">Map View</h1>
        <p className="text-grey-600">Trolley distribution across store locations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Store List - Phase 2A */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="page-subtitle">Store Locations</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => setSelectedStore(store)}
                  className={`
                    w-full text-left p-4 rounded-lg transition-all duration-300 border-2
                    ${selectedStore?.id === store.id
                      ? 'bg-shoprite-red/10 border-shoprite-red shadow-md scale-102'
                      : 'bg-grey-50 border-grey-200 hover:bg-grey-100 hover:border-grey-300'
                    }
                  `}
                >
                  {/* Phase 2B: Brand Badge */}
                  <div className="mb-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${store.brand === 'Shoprite' ? 'bg-shoprite-red text-white' : 'bg-success text-white'}`}>
                      {store.brand}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-sm text-grey-900">{store.name}</p>
                    <div
                      className="w-4 h-4 rounded-full ring-2 ring-white shadow-md"
                      style={{ backgroundColor: getMarkerColor(store) }}
                    />
                  </div>
                  <div className="text-xs text-grey-600 space-y-1">
                    <div className="flex items-center justify-between bg-white p-1.5 rounded">
                      <span className="font-medium">Active:</span>
                      <span className="font-bold text-success">{store.trolley_counts.active}</span>
                    </div>
                    <div className="flex items-center justify-between bg-white p-1.5 rounded">
                      <span className="font-medium">Total:</span>
                      <span className="font-bold text-grey-900">{store.trolley_counts.total}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Map - Phase 2A */}
        <div className="lg:col-span-3">
          <div className="card-simple p-0 overflow-hidden border-4 border-shoprite-red" style={{ height: 'calc(100vh - 240px)', minHeight: '500px' }}>
            <MapContainer
              center={defaultCenter}
              zoom={defaultZoom}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {stores.map((store) => (
                <Marker
                  key={store.id}
                  position={[store.latitude, store.longitude]}
                  icon={createCustomIcon(getMarkerColor(store), getMarkerBorderColor(store))}
                  eventHandlers={{
                    click: () => setSelectedStore(store)
                  }}
                >
                  <Popup>
                    <div className="p-3 min-w-[200px]">
                      {/* Phase 2B: Brand Badge */}
                      <div className="mb-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${store.brand === 'Shoprite' ? 'bg-shoprite-red text-white' : 'bg-success text-white'}`}>
                          {store.brand}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-grey-900">{store.name}</h3>
                      {store.address && (
                        <p className="text-sm text-grey-600 mb-3 border-b pb-2">{store.address}</p>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-success/10 p-2 rounded">
                          <div className="flex items-center">
                            <ShoppingCart size={16} className="mr-2 text-success" />
                            <span className="text-sm font-medium">Active</span>
                          </div>
                          <span className="font-bold text-success">{store.trolley_counts.active}</span>
                        </div>
                        <div className="flex items-center justify-between bg-warning/10 p-2 rounded">
                          <div className="flex items-center">
                            <Wrench size={16} className="mr-2 text-warning" />
                            <span className="text-sm font-medium">Maintenance</span>
                          </div>
                          <span className="font-bold text-warning">{store.trolley_counts.maintenance}</span>
                        </div>
                        <div className="flex items-center justify-between bg-danger/10 p-2 rounded">
                          <div className="flex items-center">
                            <AlertTriangle size={16} className="mr-2 text-danger" />
                            <span className="text-sm font-medium">Stolen</span>
                          </div>
                          <span className="font-bold text-danger">{store.trolley_counts.stolen}</span>
                        </div>
                        <div className="pt-2 border-t-2 border-grey-200">
                          <div className="flex items-center justify-between bg-shoprite-red/10 p-2 rounded">
                            <span className="text-sm font-bold">Total</span>
                            <span className="font-bold text-shoprite-red text-lg">{store.trolley_counts.total}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Legend - Phase 2B Enhanced */}
          <div className="card mt-4">
            <h3 className="font-bold text-grey-900 mb-4">Map Legend</h3>

            {/* Brand Colors */}
            <div className="mb-4">
              <p className="text-xs text-grey-600 font-semibold mb-2 uppercase">Store Brands</p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-shoprite-red mr-2 ring-2 ring-shoprite-red/30" />
                  <span className="text-sm font-medium text-grey-700">Shoprite</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-success mr-2 ring-2 ring-success/30" />
                  <span className="text-sm font-medium text-grey-700">Checkers</span>
                </div>
              </div>
            </div>

            {/* Marker Border Status */}
            <div className="border-t pt-4">
              <p className="text-xs text-grey-600 font-semibold mb-2 uppercase">Trolley Status (Border Color)</p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-grey-400 mr-2 ring-2 ring-white" />
                  <span className="text-sm font-medium text-grey-700">Good (≥70% active)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-grey-400 mr-2 ring-2 ring-warning" />
                  <span className="text-sm font-medium text-grey-700">Warning (40-70%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-grey-400 mr-2 ring-2 ring-danger" />
                  <span className="text-sm font-medium text-grey-700">Critical (&lt;40%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
