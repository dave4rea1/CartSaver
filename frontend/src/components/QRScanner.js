import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const QRScanner = ({ onScan, onError, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [cameraId, setCameraId] = useState(null);
  const [cameras, setCameras] = useState([]);
  const qrCodeRef = useRef(null);
  const lastScanRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          // Prefer back camera for mobile devices
          const backCamera = devices.find(device =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('rear')
          );
          setCameraId(backCamera ? backCamera.id : devices[0].id);
        } else {
          setError('No cameras found on this device');
        }
      })
      .catch((err) => {
        console.error('Error getting cameras:', err);
        setError('Unable to access camera. Please grant camera permissions.');
        if (onError) onError(err);
      });

    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      stopScanning();
    };
  }, []);

  useEffect(() => {
    if (cameraId && !scanning) {
      startScanning();
    }
  }, [cameraId]);

  const startScanning = async () => {
    if (!cameraId) return;

    try {
      // Initialize scanner
      qrCodeRef.current = new Html5Qrcode('qr-reader');

      const config = {
        fps: 10, // Frames per second to scan
        qrbox: { width: 250, height: 250 }, // Scanning box size
        aspectRatio: 1.0
      };

      await qrCodeRef.current.start(
        cameraId,
        config,
        (decodedText) => {
          // Success callback when QR code is detected
          console.log('QR Code detected:', decodedText);

          // Prevent duplicate scans within 2 seconds
          const now = Date.now();
          if (lastScanRef.current && (now - lastScanRef.current) < 2000) {
            console.log('Ignoring duplicate scan');
            return;
          }

          // Clear any pending timeout
          if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
          }

          // Mark scan time
          lastScanRef.current = now;

          // Stop scanning after successful read
          stopScanning();

          // Call parent callback after a short delay to ensure camera stops
          scanTimeoutRef.current = setTimeout(() => {
            if (onScan) {
              onScan(decodedText);
            }
          }, 100);
        },
        () => {
          // Error callback (called frequently, can be ignored)
          // This fires constantly while scanning, no need to log
        }
      );

      setScanning(true);
      setError(null);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Failed to start camera. Please try again.');
      if (onError) onError(err);
    }
  };

  const stopScanning = async () => {
    if (qrCodeRef.current) {
      try {
        // Check scanner state
        const state = await qrCodeRef.current.getState();

        // Stop scanning first if it's running
        if (state === Html5Qrcode.SCANNING) {
          await qrCodeRef.current.stop();
          // Wait a bit for stop to complete before clearing
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Clear the scanner after it's stopped
        await qrCodeRef.current.clear();
        qrCodeRef.current = null;
        setScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
        // Force cleanup even if there's an error
        try {
          if (qrCodeRef.current) {
            // Try to at least stop it, ignore clear if it fails
            await qrCodeRef.current.stop().catch(() => {});
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        qrCodeRef.current = null;
        setScanning(false);
      }
    }
  };

  const handleClose = async () => {
    await stopScanning();
    if (onClose) onClose();
  };

  const handleCameraSwitch = async (newCameraId) => {
    await stopScanning();
    setCameraId(newCameraId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-shoprite-red text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera size={24} />
            <div>
              <h3 className="font-bold text-lg">QR Code Scanner</h3>
              <p className="text-sm opacity-90">Position the QR code within the frame</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative bg-black">
          {error ? (
            <div className="flex flex-col items-center justify-center p-12 bg-grey-900 text-white">
              <AlertCircle size={64} className="text-warning mb-4" />
              <p className="text-center text-lg font-semibold mb-2">Camera Access Error</p>
              <p className="text-center text-sm text-grey-400 max-w-md">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-2 bg-shoprite-red hover:bg-red-700 rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>
          ) : (
            <>
              {/* QR Reader Container */}
              <div id="qr-reader" className="w-full" style={{ minHeight: '400px' }}></div>

              {/* Scanning Indicator */}
              {scanning && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-success text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
                  <CheckCircle2 size={20} />
                  <span className="font-semibold">Scanning...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Camera Selector */}
        {cameras.length > 1 && !error && (
          <div className="p-4 bg-grey-50 border-t border-grey-200">
            <label className="label mb-2">Select Camera</label>
            <select
              value={cameraId || ''}
              onChange={(e) => handleCameraSwitch(e.target.value)}
              className="input w-full"
            >
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || `Camera ${camera.id}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-grey-50 border-t border-grey-200">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Camera size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-grey-900 mb-1">How to scan:</p>
              <ul className="text-sm text-grey-600 space-y-1">
                <li>• Hold your device steady</li>
                <li>• Position the QR code within the red frame</li>
                <li>• Ensure good lighting for best results</li>
                <li>• The scan will happen automatically when detected</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-grey-200 flex justify-end">
          <button
            onClick={handleClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
