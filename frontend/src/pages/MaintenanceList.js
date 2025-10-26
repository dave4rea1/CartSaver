import React, { useEffect, useState } from 'react';
import { Wrench, Edit2, Save, X, CheckCircle } from 'lucide-react';
import { maintenanceAPI } from '../services/api';
import { formatDate, formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const MaintenanceList = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMaintenance();
  }, []);

  const fetchMaintenance = async () => {
    try {
      const response = await maintenanceAPI.getAll();
      setRecords(response.data.records);
    } catch (error) {
      toast.error('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (record) => {
    setEditingId(record.id);
    setEditForm({
      description: record.description,
      technician: record.technician || '',
      cost: record.cost || '',
      status_after: record.status_after || 'maintenance'
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleUpdateRecord = async (recordId) => {
    try {
      setUpdating(true);
      await maintenanceAPI.update(recordId, editForm);
      toast.success('Maintenance record updated successfully!');
      setEditingId(null);
      setEditForm({});
      await fetchMaintenance();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update record');
    } finally {
      setUpdating(false);
    }
  };

  const statuses = ['active', 'maintenance', 'recovered', 'decommissioned'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="border-l-4 border-shoprite-red pl-4">
        <h1 className="page-title">Maintenance Records</h1>
        <p className="text-grey-600">Track and manage trolley maintenance and repairs</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner"></div>
            <span className="ml-3 text-grey-600">Loading maintenance records...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <Wrench size={56} className="mx-auto text-grey-300 mb-4" strokeWidth={2} />
            <p className="text-grey-600 font-medium text-lg">No maintenance records found</p>
            <p className="text-sm text-grey-500 mt-2">Maintenance history will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Date</th>
                  <th>Trolley</th>
                  <th>Description</th>
                  <th>Technician</th>
                  <th>Cost</th>
                  <th>Status After</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="table-row">
                    <td className="table-cell font-medium text-grey-900">
                      {formatDate(record.maintenance_date)}
                    </td>
                    <td className="table-cell">
                      <span className="font-mono bg-grey-50 px-2 py-1 rounded text-shoprite-red font-semibold">
                        {record.trolley?.rfid_tag || 'Unknown'}
                      </span>
                    </td>

                    {/* Editable Description */}
                    <td className="table-cell max-w-xs">
                      {editingId === record.id ? (
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="input text-sm w-full"
                          rows="2"
                        />
                      ) : (
                        <p className="text-grey-700 text-sm">{record.description}</p>
                      )}
                    </td>

                    {/* Editable Technician */}
                    <td className="table-cell">
                      {editingId === record.id ? (
                        <input
                          type="text"
                          value={editForm.technician}
                          onChange={(e) => setEditForm({ ...editForm, technician: e.target.value })}
                          className="input text-sm"
                          placeholder="Technician name"
                        />
                      ) : (
                        <span className="text-grey-700">{record.technician || 'N/A'}</span>
                      )}
                    </td>

                    {/* Editable Cost */}
                    <td className="table-cell">
                      {editingId === record.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.cost}
                          onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                          className="input text-sm w-28"
                          placeholder="Cost"
                        />
                      ) : (
                        <span className="font-semibold text-success">
                          {record.cost ? formatCurrency(record.cost) : 'N/A'}
                        </span>
                      )}
                    </td>

                    {/* Editable Status */}
                    <td className="table-cell">
                      {editingId === record.id ? (
                        <select
                          value={editForm.status_after}
                          onChange={(e) => setEditForm({ ...editForm, status_after: e.target.value })}
                          className="input text-sm"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="capitalize font-medium text-grey-700">
                          {record.status_after || 'N/A'}
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="table-cell text-center">
                      {editingId === record.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleUpdateRecord(record.id)}
                            disabled={updating}
                            className="btn btn-sm bg-success hover:bg-success-dark text-white px-3 py-1 flex items-center gap-1"
                            title="Save changes"
                          >
                            {updating ? (
                              <div className="spinner-sm"></div>
                            ) : (
                              <>
                                <Save size={14} />
                                Save
                              </>
                            )}
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={updating}
                            className="btn btn-sm bg-grey-400 hover:bg-grey-500 text-white px-3 py-1 flex items-center gap-1"
                            title="Cancel editing"
                          >
                            <X size={14} />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(record)}
                          className="btn btn-sm bg-shoprite-red hover:bg-red-700 text-white px-3 py-1 flex items-center gap-1 mx-auto"
                          title="Edit record"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {!loading && records.length > 0 && (
        <div className="flex items-center justify-between text-sm text-grey-600 font-medium">
          <span>
            Showing <span className="text-shoprite-red font-bold">{records.length}</span> maintenance record(s)
          </span>
          <div className="flex items-center gap-2 text-success">
            <CheckCircle size={16} />
            <span>Click Edit to modify any record</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceList;
