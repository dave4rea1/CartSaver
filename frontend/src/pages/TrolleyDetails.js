import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User } from 'lucide-react';
import { trolleyAPI } from '../services/api';
import { formatDateTime, getStatusBadgeClass, capitalizeFirst } from '../utils/formatters';
import toast from 'react-hot-toast';

const TrolleyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trolley, setTrolley] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrolleyDetails();
  }, [id]);

  const fetchTrolleyDetails = async () => {
    try {
      const response = await trolleyAPI.getById(id);
      setTrolley(response.data.trolley);
    } catch (error) {
      toast.error('Failed to load trolley details');
      navigate('/trolleys');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-3 text-grey-600">Loading trolley details...</span>
      </div>
    );
  }

  if (!trolley) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back Button - Phase 2A */}
      <button
        onClick={() => navigate('/trolleys')}
        className="flex items-center text-grey-600 hover:text-shoprite-red transition-colors font-medium group"
      >
        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Trolleys
      </button>

      {/* Trolley Header - Phase 2A */}
      <div className="card border-t-4 border-shoprite-red">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-grey-900 mb-3">
              Trolley {trolley.rfid_tag}
            </h1>
            <div className="space-y-2 text-sm">
              {trolley.barcode && (
                <p className="flex items-center">
                  <span className="text-grey-600 font-medium mr-2">Barcode:</span>
                  <span className="font-mono bg-grey-50 px-3 py-1 rounded text-grey-900 font-semibold">
                    {trolley.barcode}
                  </span>
                  {trolley.is_default_barcode && (
                    <span className="ml-2 px-3 py-1 bg-warning-light text-warning-dark rounded-full text-xs font-bold">
                      Auto-generated
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <span className={`${getStatusBadgeClass(trolley.status)} status-badge text-base`}>
            {capitalizeFirst(trolley.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details - Phase 2A */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <h2 className="page-subtitle">Basic Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-grey-50 p-4 rounded-lg border-l-2 border-shoprite-red">
                <p className="text-xs text-grey-600 mb-2">RFID Tag</p>
                <p className="font-bold text-grey-900 text-lg">{trolley.rfid_tag}</p>
              </div>
              <div className="bg-grey-50 p-4 rounded-lg border-l-2 border-success">
                <p className="text-xs text-grey-600 mb-2">Barcode</p>
                <p className="font-bold text-grey-900 text-lg">{trolley.barcode || 'N/A'}</p>
              </div>
              <div className="bg-grey-50 p-4 rounded-lg border-l-2 border-warning">
                <p className="text-xs text-grey-600 mb-2">Current Status</p>
                <p className="font-bold text-grey-900 text-lg">{capitalizeFirst(trolley.status)}</p>
              </div>
              <div className="bg-grey-50 p-4 rounded-lg border-l-2 border-grey-400">
                <p className="text-xs text-grey-600 mb-2">Last Scanned</p>
                <p className="font-bold text-grey-900 text-sm">
                  {trolley.last_scanned ? formatDateTime(trolley.last_scanned) : 'Never'}
                </p>
              </div>
            </div>
          </div>

          {/* Store Information */}
          <div className="card">
            <h2 className="page-subtitle flex items-center">
              <MapPin size={22} className="mr-2 text-shoprite-red" />
              Store Information
            </h2>
            <div className="bg-grey-50 p-4 rounded-lg">
              <p className="font-bold text-grey-900 text-xl mb-2">{trolley.store?.name || 'Unknown'}</p>
              {trolley.store?.address && (
                <p className="text-sm text-grey-600 flex items-start">
                  <MapPin size={14} className="mr-1 mt-0.5 flex-shrink-0" />
                  {trolley.store.address}
                </p>
              )}
            </div>
          </div>

          {/* Status History */}
          <div className="card">
            <h2 className="page-subtitle flex items-center">
              <Calendar size={22} className="mr-2 text-shoprite-red" />
              Status History
            </h2>
            {trolley.statusHistory && trolley.statusHistory.length > 0 ? (
              <div className="space-y-3">
                {trolley.statusHistory.map((history) => (
                  <div key={history.id} className="border-l-4 border-shoprite-red pl-4 py-3 bg-grey-50 rounded-r-lg hover:bg-grey-100 transition-colors">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div>
                        <span className="text-sm text-grey-600 font-medium">
                          {history.previous_status ? `${capitalizeFirst(history.previous_status)} →` : 'Initial:'}
                        </span>
                        <span className="ml-2 font-bold text-shoprite-red">{capitalizeFirst(history.new_status)}</span>
                      </div>
                      <span className="text-sm text-grey-500 font-medium">
                        {formatDateTime(history.timestamp)}
                      </span>
                    </div>
                    {history.notes && (
                      <p className="text-sm text-grey-700 mt-2 bg-white p-2 rounded">{history.notes}</p>
                    )}
                    {history.user && (
                      <div className="flex items-center text-xs text-grey-600 mt-2">
                        <User size={14} className="mr-1" />
                        <span className="font-medium">{history.user.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-grey-500 text-center py-8">No history available</p>
            )}
          </div>
        </div>

        {/* Sidebar - Phase 2A */}
        <div className="space-y-6">
          {/* Maintenance Records */}
          <div className="card">
            <h2 className="page-subtitle">Maintenance Records</h2>
            {trolley.maintenanceRecords && trolley.maintenanceRecords.length > 0 ? (
              <div className="space-y-3">
                {trolley.maintenanceRecords.map((record) => (
                  <div key={record.id} className="border-b border-grey-200 pb-3 last:border-0 hover:bg-grey-50 p-2 rounded transition-colors">
                    <p className="text-sm font-bold text-grey-900">
                      {formatDateTime(record.maintenance_date)}
                    </p>
                    <p className="text-sm text-grey-700 mt-2">{record.description}</p>
                    {record.technician && (
                      <p className="text-xs text-grey-600 mt-2 flex items-center">
                        <User size={12} className="mr-1" />
                        Technician: <span className="font-medium ml-1">{record.technician}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-grey-500 text-sm text-center py-4">No maintenance records</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card bg-shoprite-red/5 border-2 border-shoprite-red">
            <h2 className="page-subtitle text-shoprite-red">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/scan')}
                className="w-full btn btn-primary text-base py-3"
              >
                Scan & Update Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrolleyDetails;
