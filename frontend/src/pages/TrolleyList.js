import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Eye, ShoppingCart } from 'lucide-react';
import { trolleyAPI } from '../services/api';
import { formatRelativeTime, getStatusBadgeClass, capitalizeFirst } from '../utils/formatters';
import StoreSelector from '../components/StoreSelector';
import toast from 'react-hot-toast';

const TrolleyList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trolleys, setTrolleys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  useEffect(() => {
    fetchTrolleys();
  }, [statusFilter, selectedStoreId]);

  const fetchTrolleys = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (selectedStoreId) params.store_id = selectedStoreId;

      const response = await trolleyAPI.getAll(params);
      setTrolleys(response.data.trolleys);
    } catch (error) {
      toast.error('Failed to load trolleys');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) {
      fetchTrolleys();
      return;
    }

    try {
      const response = await trolleyAPI.getAll({ search: search.trim() });
      setTrolleys(response.data.trolleys);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const filteredTrolleys = trolleys;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header - Phase 2A */}
      <div className="flex items-center justify-between border-l-4 border-shoprite-red pl-4">
        <div>
          <h1 className="page-title">Trolley Inventory</h1>
          <p className="text-grey-600">Manage and track all trolleys</p>
        </div>
      </div>

      {/* Filters - Phase 2A */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <form onSubmit={handleSearch} className="lg:col-span-1">
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by RFID or barcode..."
                className="input flex-1"
              />
              <button type="submit" className="btn btn-primary flex items-center gap-2">
                <Search size={20} />
                <span className="hidden md:inline">Search</span>
              </button>
            </div>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="stolen">Stolen</option>
            <option value="decommissioned">Decommissioned</option>
            <option value="recovered">Recovered</option>
          </select>

          <StoreSelector
            showAllOption={true}
            selectedStoreId={selectedStoreId}
            onStoreChange={(store) => setSelectedStoreId(store?.id || null)}
          />
        </div>
      </div>

      {/* Trolley List - Phase 2A */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner"></div>
            <span className="ml-3 text-grey-600">Loading trolleys...</span>
          </div>
        ) : filteredTrolleys.length === 0 ? (
          <div className="text-center py-12 text-grey-500">
            <ShoppingCart size={48} className="mx-auto mb-4 text-grey-300" />
            <p className="font-medium">No trolleys found</p>
            <p className="text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>RFID Tag</th>
                  <th>Barcode</th>
                  <th>Store</th>
                  <th>Status</th>
                  <th>Last Scanned</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrolleys.map((trolley) => (
                  <tr key={trolley.id} className="table-row">
                    <td className="table-cell font-semibold text-grey-900">{trolley.rfid_tag}</td>
                    <td className="table-cell">
                      <span className="text-grey-700">{trolley.barcode || 'N/A'}</span>
                      {trolley.is_default_barcode && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-danger-light text-danger-dark rounded font-medium">(Auto)</span>
                      )}
                    </td>
                    <td className="table-cell text-grey-700">{trolley.store?.name || 'Unknown'}</td>
                    <td className="table-cell">
                      <span className={`${getStatusBadgeClass(trolley.status)} status-badge`}>
                        {capitalizeFirst(trolley.status)}
                      </span>
                    </td>
                    <td className="table-cell text-grey-600">
                      {formatRelativeTime(trolley.last_scanned)}
                    </td>
                    <td className="table-cell text-center">
                      <Link
                        to={`/trolleys/${trolley.id}`}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-shoprite-red hover:bg-shoprite-red hover:text-white transition-all duration-300 hover:scale-110"
                        title="View details"
                      >
                        <Eye size={20} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results Summary - Phase 2A */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-grey-600 font-medium">
          Showing <span className="text-shoprite-red font-bold">{filteredTrolleys.length}</span> trolley(s)
        </div>
      </div>
    </div>
  );
};

export default TrolleyList;
