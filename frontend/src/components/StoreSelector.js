import { useEffect, useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { storeAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * StoreSelector Component - Phase 2B
 *
 * Reusable component for selecting a store with localStorage persistence.
 * Groups stores by province and displays brand badges.
 *
 * Props:
 * - onStoreChange: Callback function called when store selection changes
 * - selectedStoreId: Currently selected store ID (for controlled component)
 * - showAllOption: Whether to show "All Stores" option (default: false)
 * - className: Additional CSS classes
 */
const StoreSelector = ({
  onStoreChange,
  selectedStoreId = null,
  showAllOption = false,
  className = ''
}) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState(null);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    // Load selected store from localStorage on mount
    const savedStoreId = localStorage.getItem('selectedStoreId');
    if (savedStoreId && stores.length > 0) {
      const store = stores.find(s => s.id === parseInt(savedStoreId));
      if (store) {
        setSelectedStore(store);
        // Don't call onStoreChange here to avoid infinite loop
        // The parent component will handle initial load with savedStoreId
      }
    }
  }, [stores]);

  useEffect(() => {
    // Update selected store when prop changes
    if (selectedStoreId && stores.length > 0) {
      const store = stores.find(s => s.id === selectedStoreId);
      if (store) {
        setSelectedStore(store);
      }
    }
  }, [selectedStoreId, stores]);

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

  const handleStoreChange = (e) => {
    const storeId = e.target.value;

    if (storeId === 'all') {
      setSelectedStore(null);
      localStorage.removeItem('selectedStoreId');
      if (onStoreChange) onStoreChange(null);
      return;
    }

    const store = stores.find(s => s.id === parseInt(storeId));
    if (store) {
      setSelectedStore(store);
      localStorage.setItem('selectedStoreId', store.id);
      if (onStoreChange) onStoreChange(store);
    }
  };

  const getBrandBadgeClass = (brand) => {
    return brand === 'Shoprite'
      ? 'bg-shoprite-red text-white'
      : 'bg-success text-white';
  };

  // Group stores by province
  const storesByProvince = stores.reduce((acc, store) => {
    const province = store.province || 'Other';
    if (!acc[province]) {
      acc[province] = [];
    }
    acc[province].push(store);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="spinner"></div>
        <span className="text-sm text-grey-600">Loading stores...</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-shoprite-red pointer-events-none"
        />
        <select
          value={selectedStore?.id || 'all'}
          onChange={handleStoreChange}
          className="input pl-10 pr-10 appearance-none cursor-pointer w-full"
        >
          {showAllOption && (
            <option value="all">All Stores</option>
          )}

          {Object.keys(storesByProvince).sort().map(province => (
            <optgroup key={province} label={province}>
              {storesByProvince[province].map(store => (
                <option key={store.id} value={store.id}>
                  {store.brand} - {store.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown
          size={18}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-grey-600 pointer-events-none"
        />
      </div>

      {/* Selected Store Info */}
      {selectedStore && (
        <div className="mt-2 p-3 bg-grey-50 rounded-lg border border-grey-200 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${getBrandBadgeClass(selectedStore.brand)}`}>
              {selectedStore.brand}
            </span>
            <span className="text-xs text-grey-600">
              {selectedStore.city}, {selectedStore.province}
            </span>
          </div>
          <p className="text-sm text-grey-700 font-medium">{selectedStore.name}</p>
          {selectedStore.address && (
            <p className="text-xs text-grey-600 mt-1">{selectedStore.address}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default StoreSelector;
