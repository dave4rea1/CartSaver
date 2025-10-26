import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, AlertTriangle, Wrench, TrendingUp } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { formatRelativeTime, getStatusBadgeClass, capitalizeFirst } from '../utils/formatters';
import StoreSelector from '../components/StoreSelector';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  const fetchDashboardData = useCallback(async (storeId = null) => {
    const isInitialLoad = loading;

    try {
      if (!isInitialLoad) {
        setIsFilterLoading(true);
      }

      // Pass store_id as query parameter if a store is selected
      const params = storeId ? { store_id: storeId } : {};
      const response = await dashboardAPI.getStats(params);
      const { summary, recent_activity, stores: storeData } = response.data;

      setStats(summary);
      setRecentActivity(recent_activity);
      setStores(storeData);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);

      // Only show error toast if not a 401 (auth errors redirect automatically)
      if (error.response?.status !== 401) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to load dashboard data';
        toast.error(errorMessage);
      }

      // Set empty data to prevent UI crashes
      setStats({
        total_trolleys: 0,
        status_counts: {
          active: 0,
          maintenance: 0,
          stolen: 0,
          decommissioned: 0,
          recovered: 0
        },
        unresolved_alerts: 0,
        maintenance_this_month: 0
      });
      setRecentActivity([]);
      setStores([]);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setIsFilterLoading(false);
      }
    }
  }, [loading]);

  useEffect(() => {
    // Load selected store from localStorage on mount
    const savedStoreId = localStorage.getItem('selectedStoreId');
    if (savedStoreId) {
      setSelectedStoreId(parseInt(savedStoreId));
    }
    fetchDashboardData(savedStoreId ? parseInt(savedStoreId) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStoreChange = useCallback((store) => {
    const storeId = store?.id || null;
    setSelectedStoreId(storeId);
    fetchDashboardData(storeId);
  }, [fetchDashboardData]);

  // Memoize stat cards to avoid recalculation on every render
  const statCards = useMemo(() => [
    {
      title: 'Total Trolleys',
      value: stats?.total_trolleys || 0,
      icon: ShoppingCart,
      color: 'bg-shoprite-red',
      link: '/trolleys'
    },
    {
      title: 'Active Trolleys',
      value: stats?.status_counts?.active || 0,
      icon: TrendingUp,
      color: 'bg-success',
      link: '/trolleys?status=active'
    },
    {
      title: 'Under Maintenance',
      value: stats?.status_counts?.maintenance || 0,
      icon: Wrench,
      color: 'bg-warning',
      link: '/maintenance'
    },
    {
      title: 'Unresolved Alerts',
      value: stats?.unresolved_alerts || 0,
      icon: AlertTriangle,
      color: 'bg-danger',
      link: '/alerts'
    }
  ], [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-3 text-grey-600 dark:text-grey-400">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header with Store Selector - Phase 2B */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="border-l-4 border-shoprite-red pl-4">
          <h1 className="page-title">Dashboard</h1>
          <p className="text-grey-600">Overview of your trolley management system</p>
        </div>
        <div className="lg:w-96">
          <label className="label">Select Store</label>
          <StoreSelector
            showAllOption={true}
            selectedStoreId={selectedStoreId}
            onStoreChange={handleStoreChange}
          />
        </div>
      </div>

      {/* Stats Grid - Phase 2A */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} to={stat.link}>
              <div className={`stat-card group cursor-pointer transition-all duration-300 ${isFilterLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="stat-label">{stat.title}</p>
                    <p className="stat-value text-grey-900 transition-all duration-300">
                      {isFilterLoading ? (
                        <span className="inline-block w-16 h-8 bg-grey-200 animate-pulse rounded"></span>
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                  <div className={`${stat.color} p-4 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={28} className="text-white" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Status Breakdown - Phase 2A */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`card transition-all duration-300 ${isFilterLoading ? 'opacity-50' : ''}`}>
          <h2 className="page-subtitle">Status Breakdown</h2>
          <div className="space-y-4">
            {Object.entries(stats?.status_counts || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-3 rounded-lg hover:bg-grey-50 transition-colors">
                <div className="flex items-center">
                  <span className={`${getStatusBadgeClass(status)} status-badge`}>
                    {capitalizeFirst(status)}
                  </span>
                </div>
                <span className="text-2xl font-bold text-grey-900">
                  {isFilterLoading ? (
                    <span className="inline-block w-12 h-8 bg-grey-200 animate-pulse rounded"></span>
                  ) : (
                    count
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Store Summary - Phase 2A */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="page-subtitle mb-0">Store Health Summary</h2>
            {stores.length > 0 && (
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-success/10 text-success rounded font-medium">
                  {stores.filter(s => s.healthStatus === 'good').length} Good
                </span>
                <span className="px-2 py-1 bg-warning/10 text-warning rounded font-medium">
                  {stores.filter(s => s.healthStatus === 'moderate').length} Moderate
                </span>
                <span className="px-2 py-1 bg-danger/10 text-danger rounded font-medium">
                  {stores.filter(s => s.healthStatus === 'bad').length} Bad
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {stores.length === 0 ? (
              <p className="text-grey-500 text-center py-8">No stores available</p>
            ) : (
              stores
                .sort((a, b) => a.healthScore - b.healthScore) // Sort by health score (worst first)
                .map((store) => {
                  // Map health status from backend
                  const healthStatusMap = {
                    good: { label: 'Good', color: 'text-success', borderColor: 'border-success', bgColor: 'bg-success/5' },
                    moderate: { label: 'Moderate', color: 'text-warning', borderColor: 'border-warning', bgColor: 'bg-warning/5' },
                    bad: { label: 'Bad', color: 'text-danger', borderColor: 'border-danger', bgColor: 'bg-danger/5' }
                  };

                  const healthConfig = healthStatusMap[store.healthStatus] || healthStatusMap.moderate;

                  // Priority badge colors
                  const priorityColors = {
                    critical: 'bg-danger text-white',
                    high: 'bg-warning text-white',
                    medium: 'bg-blue-500 text-white'
                  };

                  return (
                    <div key={store.id} className={`${healthConfig.bgColor} rounded-lg border-l-4 ${healthConfig.borderColor} transition-all duration-300 ${isFilterLoading ? 'opacity-50' : ''}`}>
                      <div className="p-4">
                        {/* Header with store name and health badge */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold text-grey-900 text-lg">{store.name}</p>
                              <span className={`text-xs font-bold px-2 py-1 rounded ${healthConfig.color} bg-white/50 border ${healthConfig.borderColor}`}>
                                {healthConfig.label}
                              </span>
                              {store.belowThreshold && (
                                <span className="text-xs font-semibold px-2 py-1 rounded bg-danger/20 text-danger border border-danger">
                                  Below Threshold
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-grey-600">
                              <div>
                                <span className="font-medium text-success">{store.active}</span> active /
                                <span className="font-medium"> {store.total}</span> total
                              </div>
                              <div>
                                <span className="font-medium text-warning">{store.maintenance}</span> maintenance /
                                <span className="font-medium text-danger"> {store.stolen}</span> stolen
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className={`text-3xl font-bold ${healthConfig.color} mb-1`}>
                              {isFilterLoading ? (
                                <span className="inline-block w-12 h-8 bg-grey-200 animate-pulse rounded"></span>
                              ) : (
                                `${store.healthScore}%`
                              )}
                            </div>
                            <div className="text-xs text-grey-500 font-medium">Health Score</div>
                            <div className={`text-lg font-semibold ${healthConfig.color} mt-1`}>
                              {store.activePercentage}%
                            </div>
                            <div className="text-xs text-grey-500">Active Rate</div>
                          </div>
                        </div>

                        {/* Additional metrics */}
                        {(store.alertCount > 0 || store.recentMaintenanceCount > 0) && (
                          <div className="flex gap-4 mb-3 pb-3 border-b border-grey-200">
                            {store.alertCount > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <AlertTriangle size={12} className="text-danger" />
                                <span className="text-grey-600">
                                  <span className="font-semibold text-danger">{store.alertCount}</span> unresolved alerts
                                </span>
                              </div>
                            )}
                            {store.recentMaintenanceCount > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <Wrench size={12} className="text-grey-600" />
                                <span className="text-grey-600">
                                  <span className="font-semibold">{store.recentMaintenanceCount}</span> maintenance (30d)
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Recommendations for Bad/Moderate stores */}
                        {store.recommendations && store.recommendations.length > 0 && (
                          <div className="space-y-2">
                            <p className={`text-xs font-bold ${healthConfig.color} uppercase tracking-wide mb-2`}>
                              Recommended Actions:
                            </p>
                            {store.recommendations.map((rec, index) => (
                              <div key={index} className={`bg-white rounded-lg p-3 border-l-3 ${healthConfig.borderColor}`}>
                                <div className="flex items-start gap-2">
                                  <AlertTriangle size={16} className={`${healthConfig.color} mt-0.5 flex-shrink-0`} />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${priorityColors[rec.priority]} uppercase`}>
                                        {rec.priority}
                                      </span>
                                      <span className="text-xs text-grey-500 uppercase font-medium">
                                        {rec.category}
                                      </span>
                                    </div>
                                    <p className="text-sm font-semibold text-grey-900 mb-1">
                                      {rec.action}
                                    </p>
                                    <p className="text-xs text-grey-600">
                                      {rec.details}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity - Phase 2A */}
      <div className={`card transition-all duration-300 ${isFilterLoading ? 'opacity-50' : ''}`}>
        <h2 className="page-subtitle">Recent Activity (Last 24 Hours)</h2>
        {isFilterLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-2 h-2 bg-grey-300 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-grey-200 animate-pulse rounded w-3/4"></div>
                    <div className="h-3 bg-grey-200 animate-pulse rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <p className="text-grey-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between border-b border-grey-100 pb-3 hover:bg-grey-50 p-3 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-shoprite-red rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-semibold text-grey-900">
                      Trolley {activity.trolley?.rfid_tag}
                    </p>
                    <p className="text-sm text-grey-600">
                      Status changed: <span className="font-medium">{activity.previous_status || 'none'}</span> → <span className="font-medium text-shoprite-red">{activity.new_status}</span>
                    </p>
                    {activity.user && (
                      <p className="text-xs text-grey-500">by {activity.user.name}</p>
                    )}
                  </div>
                </div>
                <div className="text-sm text-grey-500 font-medium">
                  {formatRelativeTime(activity.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions - Phase 2A */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/scan" className="card-simple hover:shadow-card-hover transition-all text-center group cursor-pointer border-2 border-transparent hover:border-shoprite-red">
          <div className="bg-shoprite-red/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-shoprite-red transition-colors">
            <ShoppingCart size={32} className="text-shoprite-red group-hover:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-grey-900 mb-2">Scan Trolley</h3>
          <p className="text-sm text-grey-600">Update trolley status</p>
        </Link>

        <Link to="/map" className="card-simple hover:shadow-card-hover transition-all text-center group cursor-pointer border-2 border-transparent hover:border-success">
          <div className="bg-success/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-success transition-colors">
            <TrendingUp size={32} className="text-success group-hover:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-grey-900 mb-2">View Map</h3>
          <p className="text-sm text-grey-600">See trolley distribution</p>
        </Link>

        <Link to="/alerts" className="card-simple hover:shadow-card-hover transition-all text-center group cursor-pointer border-2 border-transparent hover:border-warning">
          <div className="bg-warning/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-warning transition-colors">
            <AlertTriangle size={32} className="text-warning group-hover:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-grey-900 mb-2">View Alerts</h3>
          <p className="text-sm text-grey-600">Check active notifications</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
