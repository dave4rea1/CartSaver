import React, { useState } from 'react';
import { ScanLine, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { trolleyAPI } from '../services/api';
import { formatDateTime, getStatusBadgeClass, capitalizeFirst } from '../utils/formatters';
import toast from 'react-hot-toast';
import QRScanner from '../components/QRScanner';

const ScanTrolley = () => {
  const [identifier, setIdentifier] = useState('');
  const [trolley, setTrolley] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const statuses = ['active', 'maintenance', 'decommissioned', 'recovered'];

  const handleQRScan = (decodedText) => {
    setShowQRScanner(false);

    try {
      // Try to parse as JSON (CartSaver QR codes contain JSON)
      const qrData = JSON.parse(decodedText);

      // Check if it's a CartSaver trolley QR code
      if (qrData.type === 'cartsaver_trolley' && qrData.rfid_tag) {
        const identifier = qrData.rfid_tag;
        setIdentifier(identifier);
        toast.success(`QR code scanned: ${identifier}`);

        // Automatically trigger search after QR scan
        setTimeout(() => {
          handleSearchByIdentifier(identifier);
        }, 100);
      } else {
        // Valid JSON but not a CartSaver QR code
        toast.error('Invalid CartSaver QR code format');
      }
    } catch (error) {
      // Not JSON - treat as plain text identifier
      setIdentifier(decodedText);
      toast.success('QR code scanned successfully!');

      // Automatically trigger search after QR scan
      setTimeout(() => {
        handleSearchByIdentifier(decodedText);
      }, 100);
    }
  };

  const handleSearchByIdentifier = async (id) => {
    const searchId = id || identifier;
    if (!searchId.trim()) return;

    setLoading(true);
    setScanned(false);

    try {
      // Don't send new_status when just searching (omit null values)
      const response = await trolleyAPI.scan({ identifier: searchId });
      setTrolley(response.data.trolley);
      setNewStatus(response.data.trolley.status);
      toast.success('Trolley found!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Trolley not found');
      setTrolley(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await handleSearchByIdentifier();
  };

  const handleUpdateStatus = async () => {
    if (!trolley || !newStatus) return;

    setLoading(true);

    try {
      const response = await trolleyAPI.scan({
        identifier: trolley.rfid_tag,
        new_status: newStatus,
        notes: notes.trim() || undefined
      });

      setTrolley(response.data.trolley);
      setScanned(true);
      setNotes('');

      if (response.data.status_changed) {
        toast.success(`Status updated to ${newStatus}!`);
      } else {
        toast.success('Trolley scanned successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIdentifier('');
    setTrolley(null);
    setNewStatus('');
    setNotes('');
    setScanned(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header - Phase 2A */}
      <div className="border-l-4 border-shoprite-red pl-4">
        <h1 className="page-title">Scan Trolley</h1>
        <p className="text-grey-600">Update trolley status using RFID or barcode</p>
      </div>

      {/* Scan Form - Phase 2A */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-shoprite-red rounded-lg flex items-center justify-center">
            <ScanLine size={24} className="text-white" />
          </div>
          <div>
            <h2 className="page-subtitle mb-0">Scan Identifier</h2>
            <p className="text-sm text-grey-600">Enter RFID tag or barcode to begin</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="label">
              RFID Tag or Barcode
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Scan or enter trolley identifier..."
                className="input flex-1 text-lg"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowQRScanner(true)}
                className="btn bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 px-6"
                title="Scan QR Code"
              >
                <Camera size={20} />
                QR Scan
              </button>
              <button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="btn btn-primary flex items-center gap-2 px-8"
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Scanning...
                  </>
                ) : (
                  <>
                    <ScanLine size={20} />
                    Search
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Trolley Information - Phase 2A */}
      {trolley && (
        <div className="card animate-scale-in">
          <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-grey-100">
            <div>
              <h2 className="page-subtitle mb-2">Trolley Information</h2>
              <p className="text-sm text-grey-600 font-mono bg-grey-50 px-3 py-1 rounded inline-block">
                RFID: <span className="font-bold text-shoprite-red">{trolley.rfid_tag}</span>
              </p>
            </div>
            <span className={`${getStatusBadgeClass(trolley.status)} status-badge text-sm`}>
              {capitalizeFirst(trolley.status)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-grey-50 p-4 rounded-lg border-l-2 border-shoprite-red">
              <p className="text-sm text-grey-600 mb-1">Barcode</p>
              <p className="font-bold text-grey-900">{trolley.barcode || 'N/A'}</p>
            </div>
            <div className="bg-grey-50 p-4 rounded-lg border-l-2 border-success">
              <p className="text-sm text-grey-600 mb-1">Store</p>
              <p className="font-bold text-grey-900">{trolley.store?.name || 'Unknown'}</p>
            </div>
            <div className="bg-grey-50 p-4 rounded-lg border-l-2 border-warning">
              <p className="text-sm text-grey-600 mb-1">Last Scanned</p>
              <p className="font-bold text-grey-900 text-sm">
                {trolley.last_scanned ? formatDateTime(trolley.last_scanned) : 'Never'}
              </p>
            </div>
            <div className="bg-grey-50 p-4 rounded-lg border-l-2 border-grey-400">
              <p className="text-sm text-grey-600 mb-1">Default Barcode</p>
              <p className="font-bold text-grey-900">{trolley.is_default_barcode ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Status Update - Phase 2A */}
          <div className="border-t-2 border-grey-100 pt-6">
            <h3 className="page-subtitle mb-4">Update Status</h3>
            <div className="space-y-6">
              <div>
                <label className="label">
                  Select New Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setNewStatus(status)}
                      className={`
                        px-5 py-3 rounded-lg border-2 font-semibold transition-all duration-300 transform hover:scale-105
                        ${newStatus === status
                          ? 'border-shoprite-red bg-shoprite-red text-white shadow-md'
                          : 'border-grey-300 text-grey-700 hover:border-shoprite-red hover:bg-red-50'
                        }
                      `}
                    >
                      {capitalizeFirst(status)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="label">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes or comments..."
                  className="input"
                  rows="3"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUpdateStatus}
                  disabled={loading || newStatus === trolley.status}
                  className="btn btn-primary flex-1 text-lg py-3"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="spinner mr-2"></div>
                      Updating...
                    </span>
                  ) : (
                    'Confirm & Update Status'
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="btn btn-secondary px-8"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Success Message - Phase 2A */}
          {scanned && (
            <div className="mt-6 alert alert-success animate-slide-in">
              <CheckCircle size={24} className="text-success flex-shrink-0" />
              <div className="ml-3">
                <p className="font-bold text-success-dark">Trolley updated successfully!</p>
                <p className="text-sm text-success-dark">Status has been changed and scan recorded.</p>
              </div>
            </div>
          )}

          {/* Special Notices - Phase 2A */}
          {trolley.status === 'stolen' && (
            <div className="mt-6 alert alert-warning animate-slide-in">
              <AlertCircle size={24} className="text-warning flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <p className="font-bold text-warning-dark text-base">Stolen Trolley Detected</p>
                <p className="text-sm text-warning-dark mt-1">
                  This trolley was automatically flagged as stolen due to inactivity.
                  Update the status to 'Recovered' if it has been retrieved.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onError={(err) => {
            console.error('QR Scanner error:', err);
            toast.error('Failed to access camera. Please check permissions.');
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};

export default ScanTrolley;
