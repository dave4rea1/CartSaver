import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { alertAPI } from '../services/api';
import { formatDateTime, getSeverityBadgeClass, capitalizeFirst } from '../utils/formatters';
import toast from 'react-hot-toast';

const AlertList = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unresolved');

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      const params = {};
      if (filter === 'unresolved') params.resolved = 'false';
      if (filter === 'resolved') params.resolved = 'true';

      const response = await alertAPI.getAll(params);
      setAlerts(response.data.alerts);
    } catch (error) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await alertAPI.resolve(id);
      toast.success('Alert resolved');
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header - Phase 2A */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-l-4 border-shoprite-red pl-4">
        <div>
          <h1 className="page-title">Alerts & Notifications</h1>
          <p className="text-grey-600">System notifications and warnings</p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input md:w-56"
        >
          <option value="all">All Alerts</option>
          <option value="unresolved">Unresolved Only</option>
          <option value="resolved">Resolved Only</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner"></div>
          <span className="ml-3 text-grey-600">Loading alerts...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle size={56} className="mx-auto text-success mb-4" strokeWidth={2} />
          <p className="text-grey-600 font-medium text-lg">No alerts found</p>
          <p className="text-sm text-grey-500 mt-2">All systems operating normally</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`card transition-all duration-300 ${alert.resolved ? 'opacity-60 hover:opacity-80' : 'hover:shadow-card-hover'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Alert Header */}
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <AlertTriangle size={20} className={alert.severity === 'critical' ? 'text-danger' : 'text-warning'} />
                    <span className={`${getSeverityBadgeClass(alert.severity)} status-badge`}>
                      {capitalizeFirst(alert.severity)}
                    </span>
                    <span className="text-sm text-grey-600 font-medium capitalize bg-grey-50 px-3 py-1 rounded-full">
                      {alert.type.replace('_', ' ')}
                    </span>
                    {alert.resolved && (
                      <span className="badge badge-decommissioned">
                        ✓ Resolved
                      </span>
                    )}
                  </div>

                  {/* Alert Message */}
                  <p className="text-grey-900 font-medium text-lg mb-3">{alert.message}</p>

                  {/* Alert Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-grey-600 bg-grey-50 p-3 rounded-lg">
                    <p><span className="font-semibold text-grey-700">Store:</span> {alert.store?.name || 'Unknown'}</p>
                    {alert.trolley && (
                      <p><span className="font-semibold text-grey-700">Trolley:</span> {alert.trolley.rfid_tag}</p>
                    )}
                    <p><span className="font-semibold text-grey-700">Created:</span> {formatDateTime(alert.created_at)}</p>
                    {alert.resolved && alert.resolvedBy && (
                      <p className="col-span-2"><span className="font-semibold text-grey-700">Resolved by:</span> {alert.resolvedBy.name} at {formatDateTime(alert.resolved_at)}</p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                {!alert.resolved && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="btn btn-success flex items-center gap-2 whitespace-nowrap"
                  >
                    <CheckCircle size={18} />
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {!loading && alerts.length > 0 && (
        <div className="text-sm text-grey-600 font-medium">
          Showing <span className="text-shoprite-red font-bold">{alerts.length}</span> alert(s)
        </div>
      )}
    </div>
  );
};

export default AlertList;
