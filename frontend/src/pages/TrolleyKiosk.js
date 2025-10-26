import React, { useState, useEffect } from 'react';
import { ShoppingCart, CreditCard, Phone, CheckCircle, XCircle, Award, TrendingUp, Camera } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import QRScanner from '../components/QRScanner';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Ensure we're using the correct API path (API_URL + /api)
axios.defaults.baseURL = `${API_URL}/api`;

/**
 * TrolleyKiosk - Customer-facing interface for trolley checkout/return
 * Simulates the XS Card integration kiosk at store entrance/exit
 */
const TrolleyKiosk = () => {
  const [mode, setMode] = useState('welcome'); // welcome, checkout, return, success
  const [identifierType, setIdentifierType] = useState('xs_card'); // xs_card or phone
  const [identifier, setIdentifier] = useState('');
  const [trolleyId, setTrolleyId] = useState('');
  const [cardData, setCardData] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [availableTrolleys, setAvailableTrolleys] = useState([]);

  // Mock store_id (in production, this would be set based on kiosk location)
  const STORE_ID = 1;

  useEffect(() => {
    fetchAvailableTrolleys();
  }, []);

  const fetchAvailableTrolleys = async () => {
    try {
      const response = await axios.get('/trolleys', {
        params: {
          status: 'active',
          store_id: STORE_ID,
          limit: 20
        }
      });
      setAvailableTrolleys(response.data.trolleys || []);
    } catch (error) {
      console.error('Error fetching trolleys:', error);
    }
  };

  const handleValidateCard = async () => {
    if (!identifier.trim()) {
      toast.error('Please enter your XS card number or phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/xs-card/validate', {
        card_number: identifier
      });

      if (response.data.valid) {
        setCardData(response.data.card);
        toast.success(`Welcome, ${response.data.card.customer_name}!`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Card validation failed');
      setCardData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!trolleyId) {
      toast.error('Please select or enter a trolley ID');
      return;
    }

    setLoading(true);
    try {
      // Check if trolleyId is a number or RFID
      const isNumeric = !isNaN(trolleyId);
      const payload = {
        identifier,
        identifier_type: identifierType,
        store_id: STORE_ID
      };

      // Add either trolley_id (numeric) or rfid_tag (string)
      if (isNumeric) {
        payload.trolley_id = parseInt(trolleyId);
      } else {
        payload.rfid_tag = trolleyId;
      }

      const response = await axios.post('/xs-card/checkout', payload);

      setCheckoutData(response.data);
      setMode('success');
      toast.success('Trolley checked out successfully!');

      // Auto-reset after 10 seconds
      setTimeout(() => resetKiosk(), 10000);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!trolleyId) {
      toast.error('Please enter the trolley ID');
      return;
    }

    setLoading(true);
    try {
      // Check if trolleyId is a number or RFID
      const isNumeric = !isNaN(trolleyId);
      const payload = { identifier };

      // Add either trolley_id (numeric) or rfid_tag (string)
      if (isNumeric) {
        payload.trolley_id = parseInt(trolleyId);
      } else {
        payload.rfid_tag = trolleyId;
      }

      const response = await axios.post('/xs-card/return', payload);

      setReturnData(response.data);
      setMode('success');

      if (response.data.rewards) {
        toast.success(response.data.rewards.message, { duration: 6000 });
      }

      // Auto-reset after 15 seconds to allow reading rewards
      setTimeout(() => resetKiosk(), 15000);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Return failed');
    } finally {
      setLoading(false);
    }
  };

  const resetKiosk = () => {
    setMode('welcome');
    setIdentifier('');
    setTrolleyId('');
    setCardData(null);
    setCheckoutData(null);
    setReturnData(null);
    fetchAvailableTrolleys();
  };

  const handleQRScan = (decodedText) => {
    setShowQRScanner(false);
    try {
      const qrData = JSON.parse(decodedText);
      if (qrData.type === 'cartsaver_trolley') {
        // Use RFID tag if available, otherwise fall back to ID
        const identifier = qrData.rfid_tag || qrData.id?.toString();
        if (identifier) {
          setTrolleyId(identifier);
          toast.success(`Trolley scanned: ${qrData.rfid_tag || `ID ${qrData.id}`}`);
        } else {
          toast.error('Invalid QR code data');
        }
      }
    } catch (error) {
      // Not JSON, might be trolley ID or RFID directly
      setTrolleyId(decodedText);
      toast.success('Scanned successfully');
    }
  };

  // Welcome Screen
  if (mode === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shoprite-red to-red-700 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-12 animate-scale-in">
          <div className="text-center mb-12">
            <div className="inline-block p-6 bg-shoprite-red rounded-full mb-6">
              <ShoppingCart size={64} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold text-grey-900 mb-4">Trolley Kiosk</h1>
            <p className="text-xl text-grey-600">
              Powered by Xtra Savings Card Integration
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('checkout')}
              className="w-full bg-shoprite-red hover:bg-red-700 text-white text-2xl font-bold py-8 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              <ShoppingCart className="inline mr-4" size={32} />
              Pick Up Trolley
            </button>

            <button
              onClick={() => setMode('return')}
              className="w-full bg-success hover:bg-green-700 text-white text-2xl font-bold py-8 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              <CheckCircle className="inline mr-4" size={32} />
              Return Trolley
            </button>
          </div>

          <div className="mt-12 text-center text-grey-600">
            <p className="text-lg">🎁 Earn XS points every time you return your trolley!</p>
          </div>
        </div>
      </div>
    );
  }

  // Checkout Screen
  if (mode === 'checkout') {
    return (
      <div className="min-h-screen bg-grey-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-shoprite-red rounded-lg">
                  <ShoppingCart size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-grey-900">Pick Up Trolley</h2>
                  <p className="text-grey-600">Scan your XS card or enter phone number</p>
                </div>
              </div>
              <button
                onClick={resetKiosk}
                className="btn btn-secondary text-lg px-6"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Identifier Input */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h3 className="text-2xl font-bold mb-6">Step 1: Identify Yourself</h3>

            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setIdentifierType('xs_card')}
                className={`flex-1 py-4 px-6 rounded-lg border-2 font-semibold text-lg transition-all ${
                  identifierType === 'xs_card'
                    ? 'border-shoprite-red bg-shoprite-red text-white'
                    : 'border-grey-300 hover:border-shoprite-red'
                }`}
              >
                <CreditCard className="inline mr-2" size={24} />
                XS Card
              </button>
              <button
                onClick={() => setIdentifierType('phone')}
                className={`flex-1 py-4 px-6 rounded-lg border-2 font-semibold text-lg transition-all ${
                  identifierType === 'phone'
                    ? 'border-shoprite-red bg-shoprite-red text-white'
                    : 'border-grey-300 hover:border-shoprite-red'
                }`}
              >
                <Phone className="inline mr-2" size={24} />
                Phone Number
              </button>
            </div>

            <div className="flex gap-4">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={identifierType === 'xs_card' ? 'XS001234567' : '+27821234567'}
                className="input flex-1 text-2xl py-4"
                autoFocus
              />
              <button
                onClick={handleValidateCard}
                disabled={loading}
                className="btn btn-primary text-lg px-8"
              >
                {loading ? 'Validating...' : 'Validate'}
              </button>
            </div>

            {cardData && (
              <div className="mt-6 p-6 bg-success bg-opacity-10 border-2 border-success rounded-lg">
                <div className="flex items-center gap-4">
                  <CheckCircle size={32} className="text-success" />
                  <div>
                    <p className="text-xl font-bold text-success-dark">Welcome, {cardData.customer_name}!</p>
                    <p className="text-grey-600">
                      <span className="font-semibold">{cardData.points_balance} points</span> •
                      <span className="font-semibold ml-2">{cardData.tier.toUpperCase()} tier</span> •
                      <span className="ml-2">{cardData.total_trolley_returns} returns</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trolley Selection */}
          {(cardData || identifierType === 'phone') && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-6">Step 2: Select Trolley</h3>

              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  value={trolleyId}
                  onChange={(e) => setTrolleyId(e.target.value)}
                  placeholder="Enter trolley ID or RFID (e.g., RFID-00001)"
                  className="input flex-1 text-2xl py-4"
                />
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="btn bg-purple-600 hover:bg-purple-700 text-white px-6"
                >
                  <Camera size={24} className="mr-2" />
                  Scan QR
                </button>
              </div>

              {availableTrolleys.length > 0 && (
                <div>
                  <p className="text-grey-600 mb-4">Or select from available trolleys:</p>
                  <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                    {availableTrolleys.slice(0, 12).map((trolley) => (
                      <button
                        key={trolley.id}
                        onClick={() => setTrolleyId(trolley.id.toString())}
                        className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                          trolleyId === trolley.id.toString()
                            ? 'border-shoprite-red bg-shoprite-red text-white'
                            : 'border-grey-300 hover:border-shoprite-red'
                        }`}
                      >
                        #{trolley.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={loading || !trolleyId}
                className="w-full mt-8 btn btn-primary text-2xl py-6"
              >
                {loading ? 'Processing...' : 'Confirm Checkout'}
              </button>
            </div>
          )}
        </div>

        {showQRScanner && (
          <QRScanner
            onScan={handleQRScan}
            onError={(err) => toast.error('QR Scanner error')}
            onClose={() => setShowQRScanner(false)}
          />
        )}
      </div>
    );
  }

  // Return Screen
  if (mode === 'return') {
    return (
      <div className="min-h-screen bg-grey-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success rounded-lg">
                  <CheckCircle size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-grey-900">Return Trolley</h2>
                  <p className="text-grey-600">Earn XS points for returning your trolley!</p>
                </div>
              </div>
              <button
                onClick={resetKiosk}
                className="btn btn-secondary text-lg px-6"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Identifier Input */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h3 className="text-2xl font-bold mb-6">Your XS Card or Phone Number</h3>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="XS001234567 or +27821234567"
              className="input w-full text-2xl py-4 mb-4"
              autoFocus
            />
          </div>

          {/* Trolley ID Input */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-6">Trolley Information</h3>
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={trolleyId}
                onChange={(e) => setTrolleyId(e.target.value)}
                placeholder="Enter trolley ID or RFID (e.g., RFID-00001)"
                className="input flex-1 text-2xl py-4"
              />
              <button
                onClick={() => setShowQRScanner(true)}
                className="btn bg-purple-600 hover:bg-purple-700 text-white px-6"
              >
                <Camera size={24} className="mr-2" />
                Scan QR
              </button>
            </div>

            <button
              onClick={handleReturn}
              disabled={loading || !trolleyId || !identifier}
              className="w-full btn btn-primary text-2xl py-6"
            >
              {loading ? 'Processing...' : 'Confirm Return & Earn Points'}
            </button>
          </div>
        </div>

        {showQRScanner && (
          <QRScanner
            onScan={handleQRScan}
            onError={(err) => toast.error('QR Scanner error')}
            onClose={() => setShowQRScanner(false)}
          />
        )}
      </div>
    );
  }

  // Success Screen
  if (mode === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-success to-green-700 flex items-center justify-center p-6">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-12 animate-scale-in">
          <div className="text-center mb-8">
            <div className="inline-block p-6 bg-success rounded-full mb-6">
              <CheckCircle size={64} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold text-grey-900 mb-4">Success!</h1>
          </div>

          {checkoutData && (
            <div className="space-y-4">
              <p className="text-2xl text-center text-grey-700">
                Trolley <span className="font-bold">#{checkoutData.trolley.id}</span> checked out successfully!
              </p>
              <div className="bg-grey-50 p-6 rounded-lg">
                <p className="text-grey-600 mb-2">Expected return time:</p>
                <p className="text-xl font-semibold text-grey-900">
                  {new Date(checkoutData.assignment.expected_return_time).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {returnData && returnData.rewards && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-8 rounded-xl text-white text-center">
                <Award size={48} className="mx-auto mb-4" />
                <p className="text-3xl font-bold mb-2">
                  +{returnData.rewards.points_awarded} XS Points!
                </p>
                {returnData.rewards.bonus_points > 0 && (
                  <p className="text-xl">Including {returnData.rewards.bonus_points} bonus points!</p>
                )}
              </div>

              {returnData.rewards.breakdown && (
                <div className="bg-grey-50 p-6 rounded-lg">
                  <h3 className="font-bold text-xl mb-4">Points Breakdown:</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Base points:</span>
                      <span className="font-semibold">{returnData.rewards.breakdown.base}</span>
                    </div>
                    {returnData.rewards.breakdown.bonuses.map((bonus, idx) => (
                      <div key={idx} className="flex justify-between text-success-dark">
                        <span>{bonus.description}:</span>
                        <span className="font-semibold">+{bonus.points}</span>
                      </div>
                    ))}
                    <div className="border-t-2 border-grey-300 pt-2 mt-2 flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{returnData.rewards.breakdown.total} points</span>
                    </div>
                  </div>
                </div>
              )}

              {returnData.tier_upgrade && (
                <div className="bg-purple-100 border-2 border-purple-500 p-6 rounded-lg text-center">
                  <TrendingUp size={48} className="mx-auto mb-4 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-900 mb-2">
                    🎊 Tier Upgraded!
                  </p>
                  <p className="text-xl text-purple-700">
                    {returnData.tier_upgrade.from.toUpperCase()} → {returnData.tier_upgrade.to.toUpperCase()}
                  </p>
                </div>
              )}

              <div className="text-center text-grey-600 text-lg">
                <p>Duration: {returnData.return_details.duration_minutes} minutes</p>
                <p className={returnData.return_details.on_time ? 'text-success font-semibold' : 'text-warning font-semibold'}>
                  {returnData.return_details.on_time ? '✓ On Time!' : '⚠ Late Return'}
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={resetKiosk}
              className="btn btn-primary text-xl px-12 py-4"
            >
              Done
            </button>
            <p className="text-grey-500 mt-4">Auto-closing in a few seconds...</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TrolleyKiosk;
