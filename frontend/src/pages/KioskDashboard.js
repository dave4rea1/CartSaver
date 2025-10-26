import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Activity, TrendingUp, TrendingDown, ShoppingCart, RotateCcw,
  Clock, AlertTriangle, Award, Users, Store, Download,
  RefreshCw, CheckCircle2, XCircle, CreditCard, Trophy
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import StoreSelector from '../components/StoreSelector';
import { formatRelativeTime, getStatusBadgeClass } from '../utils/formatters';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create authenticated axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const KioskDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchAnalytics = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const params = {};
      if (selectedStoreId) params.store_id = selectedStoreId;

      const response = await api.get('/kiosk-dashboard/analytics', { params });
      setAnalytics(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      if (!silent) {
        toast.error('Failed to load kiosk analytics');
      }
      console.error('Error fetching analytics:', error);
      // Log detailed error info for debugging
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Full error details:', {
          status: error.response.status,
          message: error.response.data?.message,
          error: error.response.data?.error,
          details: error.response.data?.details
        });
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId]);

  useEffect(() => {
    fetchAnalytics();

    // Auto-refresh every 30 seconds if enabled
    const interval = autoRefresh ? setInterval(() => {
      fetchAnalytics(true); // Silent refresh
    }, 30000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedStoreId, autoRefresh, fetchAnalytics]);

  const getTierColor = (tier) => {
    const colors = {
      bronze: 'bg-orange-100 text-orange-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      diamond: 'bg-blue-100 text-blue-800'
    };
    return colors[tier?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getTierIcon = (tier) => {
    const size = 16;
    switch(tier?.toLowerCase()) {
      case 'diamond': return <Trophy size={size} className="text-blue-600" />;
      case 'gold': return <Trophy size={size} className="text-yellow-600" />;
      case 'silver': return <Award size={size} className="text-gray-600" />;
      default: return <Award size={size} className="text-orange-600" />;
    }
  };

  const exportReport = useCallback(() => {
    if (!analytics) return;

    const reportData = {
      generated_at: new Date().toISOString(),
      store_filter: selectedStoreId || 'All Stores',
      summary: analytics.summary,
      xs_card_stats: analytics.xs_card_stats
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kiosk-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  }, [analytics, selectedStoreId]);

  // Memoize destructured analytics data
  const analyticsData = useMemo(() => {
    if (!analytics) return {};
    const { summary, xs_card_stats, active_checkouts, overdue_trolleys, recent_returns, hourly_activity, store_performance, top_customers } = analytics;
    return { summary, xs_card_stats, active_checkouts, overdue_trolleys, recent_returns, hourly_activity, store_performance, top_customers };
  }, [analytics]);

  const { summary, xs_card_stats, active_checkouts, overdue_trolleys, recent_returns, hourly_activity, store_performance, top_customers } = analyticsData;

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
        <span className="ml-3 text-grey-600">Loading kiosk analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-l-4 border-shoprite-red pl-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Activity className="text-shoprite-red" size={32} />
            Kiosk Dashboard
          </h1>
          <p className="text-grey-600">Real-time kiosk activity and XS card integration analytics</p>
          <p className="text-xs text-grey-500 mt-1">
            Last updated: {formatRelativeTime(lastUpdated)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <StoreSelector
            showAllOption={true}
            selectedStoreId={selectedStoreId}
            onStoreChange={(store) => setSelectedStoreId(store?.id || null)}
          />
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn ${autoRefresh ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
          >
            <RefreshCw size={18} className={autoRefresh ? 'animate-spin-slow' : ''} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </button>
          <button
            onClick={() => fetchAnalytics()}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button
            onClick={exportReport}
            className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Checkouts */}
        <div className="card hover-scale">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-grey-600 mb-1">Today's Checkouts</p>
              <h3 className="text-3xl font-bold text-grey-900">{summary?.today_checkouts || 0}</h3>
              <div className="flex items-center gap-1 mt-2">
                {summary?.checkout_change >= 0 ? (
                  <TrendingUp size={16} className="text-success" />
                ) : (
                  <TrendingDown size={16} className="text-danger" />
                )}
                <span className={`text-sm font-semibold ${summary?.checkout_change >= 0 ? 'text-success' : 'text-danger'}`}>
                  {Math.abs(summary?.checkout_change || 0)}%
                </span>
                <span className="text-xs text-grey-500">vs yesterday</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <ShoppingCart size={24} className="text-white" />
            </div>
          </div>
        </div>

        {/* Today's Returns */}
        <div className="card hover-scale">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-grey-600 mb-1">Today's Returns</p>
              <h3 className="text-3xl font-bold text-grey-900">{summary?.today_returns || 0}</h3>
              <div className="flex items-center gap-1 mt-2">
                {summary?.return_change >= 0 ? (
                  <TrendingUp size={16} className="text-success" />
                ) : (
                  <TrendingDown size={16} className="text-danger" />
                )}
                <span className={`text-sm font-semibold ${summary?.return_change >= 0 ? 'text-success' : 'text-danger'}`}>
                  {Math.abs(summary?.return_change || 0)}%
                </span>
                <span className="text-xs text-grey-500">vs yesterday</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <RotateCcw size={24} className="text-white" />
            </div>
          </div>
        </div>

        {/* Active Now */}
        <div className="card hover-scale">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-grey-600 mb-1">Active Checkouts</p>
              <h3 className="text-3xl font-bold text-grey-900">{summary?.active_now || 0}</h3>
              <p className="text-xs text-grey-500 mt-2">
                Avg duration: {summary?.avg_duration_minutes || 0} min
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <Clock size={24} className="text-white" />
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className="card hover-scale">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-grey-600 mb-1">Overdue Trolleys</p>
              <h3 className="text-3xl font-bold text-grey-900">{summary?.overdue_count || 0}</h3>
              <p className="text-xs text-grey-500 mt-2">
                Compliance: {summary?.compliance_rate || 0}%
              </p>
            </div>
            <div className={`p-3 bg-gradient-to-br ${summary?.overdue_count > 0 ? 'from-red-500 to-red-600' : 'from-gray-400 to-gray-500'} rounded-xl`}>
              <AlertTriangle size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* XS Card Stats */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="text-shoprite-red" size={24} />
          <h2 className="text-xl font-bold text-grey-900">XS Card Activity</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
            <p className="text-sm font-medium text-grey-600 mb-2">XS Card Transactions</p>
            <h3 className="text-3xl font-bold text-grey-900">{xs_card_stats?.total_transactions || 0}</h3>
            <p className="text-xs text-grey-500 mt-1">Today</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6">
            <p className="text-sm font-medium text-grey-600 mb-2">Points Awarded</p>
            <h3 className="text-3xl font-bold text-grey-900">{xs_card_stats?.points_awarded || 0}</h3>
            <p className="text-xs text-grey-500 mt-1">Today</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
            <p className="text-sm font-medium text-grey-600 mb-2">Tier Breakdown</p>
            <div className="space-y-2 mt-2">
              {Object.entries(xs_card_stats?.tier_breakdown || {}).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTierIcon(tier)}
                    <span className="text-sm capitalize font-medium">{tier}</span>
                  </div>
                  <span className="text-sm font-bold text-grey-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Checkouts & Overdue Trolleys */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Checkouts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-grey-900 flex items-center gap-2">
              <CheckCircle2 className="text-green-500" size={20} />
              Active Checkouts ({active_checkouts?.length || 0})
            </h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {active_checkouts?.length > 0 ? (
              active_checkouts.slice(0, 10).map((checkout) => (
                <div key={checkout.id} className="bg-grey-50 rounded-lg p-4 hover:bg-grey-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-grey-900">
                          {checkout.trolley?.rfid_tag}
                        </span>
                        {checkout.xsCard && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getTierColor(checkout.xsCard.tier)}`}>
                            {checkout.xsCard.tier}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-grey-700">
                        {checkout.xsCard?.customer_name || checkout.customer_name}
                      </p>
                      <p className="text-xs text-grey-500 mt-1">
                        {formatRelativeTime(checkout.checkout_timestamp)}
                      </p>
                    </div>
                    <div className="text-right">
                      {checkout.expected_return_time && new Date() > new Date(checkout.expected_return_time) ? (
                        <span className="text-xs font-semibold text-danger bg-danger-light px-2 py-1 rounded">
                          Overdue
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-success bg-success-light px-2 py-1 rounded">
                          On Time
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-grey-500">
                <CheckCircle2 size={48} className="mx-auto mb-3 text-grey-300" />
                <p>No active checkouts</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Returns */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-grey-900 flex items-center gap-2">
              <RotateCcw className="text-blue-500" size={20} />
              Recent Returns ({recent_returns?.length || 0})
            </h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recent_returns?.length > 0 ? (
              recent_returns.slice(0, 10).map((returnItem) => (
                <div key={returnItem.id} className="bg-grey-50 rounded-lg p-4 hover:bg-grey-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-grey-900">
                          {returnItem.trolley?.rfid_tag}
                        </span>
                        {returnItem.xsCard && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getTierColor(returnItem.xsCard.tier)}`}>
                            {returnItem.xsCard.tier}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-grey-700">
                        {returnItem.xsCard?.customer_name || returnItem.customer_name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-grey-500">
                          {formatRelativeTime(returnItem.return_timestamp)}
                        </p>
                        {returnItem.points_awarded > 0 && (
                          <span className="text-xs font-semibold text-yellow-600">
                            +{returnItem.points_awarded} pts
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-grey-600">
                        {returnItem.duration_minutes} min
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-grey-500">
                <RotateCcw size={48} className="mx-auto mb-3 text-grey-300" />
                <p>No recent returns</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Store Performance */}
      {store_performance && store_performance.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Store className="text-shoprite-red" size={24} />
            <h2 className="text-xl font-bold text-grey-900">Store Performance (Today)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {store_performance.slice(0, 6).map((store) => (
              <div key={store.store_id} className="bg-gradient-to-br from-grey-50 to-grey-100 rounded-lg p-4">
                <h4 className="font-semibold text-grey-900 mb-2">{store.store?.name}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-grey-600">Transactions</span>
                  <span className="text-2xl font-bold text-shoprite-red">
                    {store.dataValues?.transaction_count || store.transaction_count || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Customers */}
      {top_customers && top_customers.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-shoprite-red" size={24} />
            <h2 className="text-xl font-bold text-grey-900">Top Active Customers (Today)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Rank</th>
                  <th>Customer</th>
                  <th>Card Number</th>
                  <th>Tier</th>
                  <th>Transactions</th>
                  <th>Points Balance</th>
                </tr>
              </thead>
              <tbody>
                {top_customers.slice(0, 10).map((customer, index) => (
                  <tr key={customer.xs_card_id} className="table-row">
                    <td className="table-cell">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-shoprite-red text-white font-bold text-sm">
                        {index + 1}
                      </span>
                    </td>
                    <td className="table-cell font-semibold">{customer.xsCard?.customer_name}</td>
                    <td className="table-cell font-mono text-sm">{customer.xsCard?.card_number}</td>
                    <td className="table-cell">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${getTierColor(customer.xsCard?.tier)}`}>
                        {getTierIcon(customer.xsCard?.tier)}
                        {customer.xsCard?.tier}
                      </span>
                    </td>
                    <td className="table-cell text-center font-bold text-shoprite-red">
                      {customer.dataValues?.transaction_count || customer.transaction_count || 0}
                    </td>
                    <td className="table-cell text-right font-semibold">
                      {customer.xsCard?.points_balance?.toLocaleString()} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overdue Trolleys Alert */}
      {overdue_trolleys && overdue_trolleys.length > 0 && (
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-600" size={24} />
            <h2 className="text-xl font-bold text-red-900">Overdue Trolleys Requiring Attention</h2>
          </div>
          <div className="space-y-3">
            {overdue_trolleys.map((checkout) => {
              const overdueMinutes = checkout.expected_return_time
                ? Math.floor((new Date() - new Date(checkout.expected_return_time)) / 60000)
                : 0;
              return (
                <div key={checkout.id} className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-semibold text-grey-900">{checkout.trolley?.rfid_tag}</p>
                      <p className="text-sm text-grey-700">{checkout.xsCard?.customer_name || checkout.customer_name}</p>
                      <p className="text-sm text-grey-600">Card: {checkout.customer_identifier}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-red-600">{overdueMinutes} min</span>
                      <p className="text-xs text-grey-500">overdue</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default KioskDashboard;
