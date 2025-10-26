import { useState } from 'react';
import { Settings, Save, X } from 'lucide-react';
import { storeAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * StoreConfigPanel Component - Phase 2B
 *
 * Panel for editing store configuration settings including:
 * - Active threshold
 * - Geofence radius
 * - Total capacity
 * - Manager information
 * - Operating hours
 *
 * Props:
 * - store: Store object to configure
 * - onUpdate: Callback when store is updated
 * - onClose: Callback to close the panel
 */
const StoreConfigPanel = ({ store, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    active_threshold: store.active_threshold || 50,
    geofence_radius: store.geofence_radius || 500,
    total_capacity: store.total_capacity || 150,
    manager_name: store.manager_name || '',
    contact_number: store.contact_number || '',
    operating_hours: store.operating_hours || ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.active_threshold < 1 || formData.active_threshold > 1000) {
      newErrors.active_threshold = 'Threshold must be between 1 and 1000';
    }

    if (formData.geofence_radius < 50 || formData.geofence_radius > 5000) {
      newErrors.geofence_radius = 'Radius must be between 50 and 5000 meters';
    }

    if (formData.total_capacity < 1 || formData.total_capacity > 1000) {
      newErrors.total_capacity = 'Capacity must be between 1 and 1000';
    }

    if (formData.contact_number && !/^[\d\s\-\+\(\)]+$/.test(formData.contact_number)) {
      newErrors.contact_number = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      // Convert string values to numbers for numeric fields
      const updateData = {
        active_threshold: parseInt(formData.active_threshold),
        geofence_radius: parseInt(formData.geofence_radius),
        total_capacity: parseInt(formData.total_capacity),
        manager_name: formData.manager_name || null,
        contact_number: formData.contact_number || null,
        operating_hours: formData.operating_hours || null
      };

      const response = await storeAPI.update(store.id, updateData);
      toast.success('Store configuration updated successfully');

      if (onUpdate) {
        onUpdate(response.data.store);
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update store');
    } finally {
      setSaving(false);
    }
  };

  const getBrandColor = () => {
    return store.brand === 'Shoprite' ? 'shoprite-red' : 'success';
  };

  return (
    <div className="card animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-grey-200">
        <div className="flex items-center gap-3">
          <div className={`bg-${getBrandColor()}/10 p-2 rounded-lg`}>
            <Settings size={24} className={`text-${getBrandColor()}`} />
          </div>
          <div>
            <h2 className="page-subtitle mb-0">Store Configuration</h2>
            <p className="text-sm text-grey-600">{store.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-grey-100 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X size={20} className="text-grey-600" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trolley Management */}
        <div>
          <h3 className="font-bold text-grey-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-shoprite-red rounded-full"></div>
            Trolley Management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">
                Active Threshold <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                name="active_threshold"
                value={formData.active_threshold}
                onChange={handleChange}
                className={`input ${errors.active_threshold ? 'border-danger' : ''}`}
                min="1"
                max="1000"
                required
              />
              {errors.active_threshold && (
                <p className="text-xs text-danger mt-1">{errors.active_threshold}</p>
              )}
              <p className="text-xs text-grey-500 mt-1">Minimum active trolleys before alert</p>
            </div>

            <div>
              <label className="label">
                Geofence Radius (m) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                name="geofence_radius"
                value={formData.geofence_radius}
                onChange={handleChange}
                className={`input ${errors.geofence_radius ? 'border-danger' : ''}`}
                min="50"
                max="5000"
                required
              />
              {errors.geofence_radius && (
                <p className="text-xs text-danger mt-1">{errors.geofence_radius}</p>
              )}
              <p className="text-xs text-grey-500 mt-1">Store perimeter in meters</p>
            </div>

            <div>
              <label className="label">
                Total Capacity <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                name="total_capacity"
                value={formData.total_capacity}
                onChange={handleChange}
                className={`input ${errors.total_capacity ? 'border-danger' : ''}`}
                min="1"
                max="1000"
                required
              />
              {errors.total_capacity && (
                <p className="text-xs text-danger mt-1">{errors.total_capacity}</p>
              )}
              <p className="text-xs text-grey-500 mt-1">Maximum trolley capacity</p>
            </div>
          </div>
        </div>

        {/* Manager Information */}
        <div className="border-t pt-6">
          <h3 className="font-bold text-grey-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-success rounded-full"></div>
            Manager Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Manager Name</label>
              <input
                type="text"
                name="manager_name"
                value={formData.manager_name}
                onChange={handleChange}
                className="input"
                placeholder="e.g., John Smith"
                maxLength="100"
              />
            </div>

            <div>
              <label className="label">Contact Number</label>
              <input
                type="tel"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                className={`input ${errors.contact_number ? 'border-danger' : ''}`}
                placeholder="e.g., +27 21 123 4567"
                maxLength="20"
              />
              {errors.contact_number && (
                <p className="text-xs text-danger mt-1">{errors.contact_number}</p>
              )}
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="border-t pt-6">
          <h3 className="font-bold text-grey-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-warning rounded-full"></div>
            Operating Hours
          </h3>
          <div>
            <label className="label">Operating Schedule</label>
            <input
              type="text"
              name="operating_hours"
              value={formData.operating_hours}
              onChange={handleChange}
              className="input"
              placeholder="e.g., Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM"
              maxLength="100"
            />
            <p className="text-xs text-grey-500 mt-1">Store operating hours schedule</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary flex items-center gap-2"
            disabled={saving}
          >
            <X size={18} />
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-2"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="spinner"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreConfigPanel;
