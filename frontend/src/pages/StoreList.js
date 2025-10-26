import React, { useEffect, useState } from 'react';
import { MapPin, ShoppingCart, Filter, X, Settings } from 'lucide-react';
import { storeAPI } from '../services/api';
import StoreConfigPanel from '../components/StoreConfigPanel';
import toast from 'react-hot-toast';

const StoreList = () => {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provinceFilter, setProvinceFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [configStore, setConfigStore] = useState(null);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stores, provinceFilter, brandFilter]);

  const fetchStores = async () => {
    try {
      const response = await storeAPI.getAll();
      setStores(response.data.stores);
    } catch (error) {
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...stores];

    if (provinceFilter) {
      filtered = filtered.filter(store => store.province === provinceFilter);
    }

    if (brandFilter) {
      filtered = filtered.filter(store => store.brand === brandFilter);
    }

    setFilteredStores(filtered);
  };

  const clearFilters = () => {
    setProvinceFilter('');
    setBrandFilter('');
  };

  const provinces = [...new Set(stores.map(s => s.province))].filter(Boolean).sort();
  const hasActiveFilters = provinceFilter || brandFilter;

  const getBrandBadgeClass = (brand) => {
    return brand === 'Shoprite'
      ? 'bg-shoprite-red text-white'
      : 'bg-success text-white';
  };

  const getBrandBorderClass = (brand) => {
    return brand === 'Shoprite'
      ? 'border-shoprite-red'
      : 'border-success';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header - Phase 2B */}
      <div className="border-l-4 border-shoprite-red pl-4">
        <h1 className="page-title">Store Locations</h1>
        <p className="text-grey-600">Manage store locations across South Africa</p>
      </div>

      {/* Filters - Phase 2B */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Filter size={20} className="text-shoprite-red" />
          <h2 className="page-subtitle mb-0">Filter Stores</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Province</label>
            <select
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              className="input"
            >
              <option value="">All Provinces</option>
              {provinces.map(province => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Brand</label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="input"
            >
              <option value="">All Brands</option>
              <option value="Shoprite">Shoprite</option>
              <option value="Checkers">Checkers</option>
            </select>
          </div>

          <div className="flex items-end">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
              >
                <X size={18} />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {provinceFilter && (
              <span className="px-3 py-1 bg-shoprite-red/10 text-shoprite-red rounded-full text-sm font-medium">
                Province: {provinceFilter}
              </span>
            )}
            {brandFilter && (
              <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
                Brand: {brandFilter}
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner"></div>
          <span className="ml-3 text-grey-600">Loading stores...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <div key={store.id} className={`card-simple hover:shadow-card-hover transition-all duration-300 hover:scale-102 border-t-4 ${getBrandBorderClass(store.brand)}`}>
              {/* Brand Badge and Settings - Phase 2B */}
              <div className="mb-3 flex items-center justify-between">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getBrandBadgeClass(store.brand)}`}>
                  {store.brand}
                </span>
                <button
                  onClick={() => setConfigStore(store)}
                  className="p-2 hover:bg-grey-100 rounded-lg transition-colors"
                  title="Configure Store"
                >
                  <Settings size={18} className="text-grey-600 hover:text-shoprite-red" />
                </button>
              </div>

              {/* Store Header */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-grey-900 mb-2">{store.name}</h3>
                {store.address && (
                  <div className="flex items-start text-grey-600 mb-1">
                    <MapPin size={16} className="mr-2 mt-0.5 flex-shrink-0 text-shoprite-red" />
                    <p className="text-sm">{store.address}</p>
                  </div>
                )}
                {(store.city || store.province) && (
                  <p className="text-sm text-grey-500 ml-6">
                    {store.city}{store.city && store.province && ', '}{store.province}
                  </p>
                )}
              </div>

              {/* Store Info - Phase 2B Enhanced */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-grey-50 p-3 rounded-lg">
                  <p className="text-xs text-grey-600 mb-1">Coordinates</p>
                  <p className="text-xs font-mono text-grey-900 font-semibold">
                    {parseFloat(store.location_lat).toFixed(4)}, {parseFloat(store.location_long).toFixed(4)}
                  </p>
                </div>
                <div className="bg-grey-50 p-3 rounded-lg">
                  <p className="text-xs text-grey-600 mb-1">Min Threshold</p>
                  <p className="font-bold text-grey-900">{store.active_threshold} trolleys</p>
                </div>
                {store.total_capacity && (
                  <div className="bg-grey-50 p-3 rounded-lg col-span-2">
                    <p className="text-xs text-grey-600 mb-1">Capacity</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-grey-900">
                        {store.trolley_counts?.total || 0} / {store.total_capacity}
                      </p>
                      <div className="w-32 bg-grey-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${(store.trolley_counts?.total || 0) / store.total_capacity > 0.9 ? 'bg-danger' : (store.trolley_counts?.total || 0) / store.total_capacity > 0.7 ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${Math.min(((store.trolley_counts?.total || 0) / store.total_capacity) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Trolley Counts */}
              <div className="border-t-2 border-grey-100 pt-4">
                <h4 className="text-sm font-bold mb-3 flex items-center text-grey-900">
                  <ShoppingCart size={18} className="mr-2 text-shoprite-red" strokeWidth={2.5} />
                  Trolley Inventory
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between items-center bg-success/10 p-2 rounded">
                    <span className="text-grey-700 font-medium">Active:</span>
                    <span className="font-bold text-success text-lg">
                      {store.trolley_counts?.active || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-warning/10 p-2 rounded">
                    <span className="text-grey-700 font-medium">Maintenance:</span>
                    <span className="font-bold text-warning text-lg">
                      {store.trolley_counts?.maintenance || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-danger/10 p-2 rounded">
                    <span className="text-grey-700 font-medium">Stolen:</span>
                    <span className="font-bold text-danger text-lg">
                      {store.trolley_counts?.stolen || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-shoprite-red/10 p-2 rounded">
                    <span className="text-grey-700 font-medium">Total:</span>
                    <span className="font-bold text-shoprite-red text-lg">
                      {store.trolley_counts?.total || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning Badge */}
              {store.trolley_counts?.active < store.active_threshold && (
                <div className="mt-4 alert alert-warning py-2 px-3 text-xs animate-pulse">
                  <span className="font-bold">⚠️ Below Active Threshold</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Results Summary - Phase 2B */}
      {!loading && stores.length > 0 && (
        <div className="text-sm text-grey-600 font-medium">
          Showing <span className="text-shoprite-red font-bold">{filteredStores.length}</span> of <span className="text-grey-900 font-bold">{stores.length}</span> store location(s)
          {hasActiveFilters && <span className="text-grey-500 ml-2">(filtered)</span>}
        </div>
      )}

      {/* Store Configuration Panel - Phase 2B */}
      {configStore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <StoreConfigPanel
              store={configStore}
              onUpdate={(updatedStore) => {
                // Update the store in the stores array
                setStores(stores.map(s => s.id === updatedStore.id ? updatedStore : s));
                setConfigStore(null);
              }}
              onClose={() => setConfigStore(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreList;
