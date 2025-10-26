import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, AlertTriangle, TrendingUp, Navigation,
  Battery, RefreshCw, Clock, Eye, EyeOff, Zap, MapPin, BarChart3, Wrench, ChevronDown, ChevronUp
} from 'lucide-react';
import { dashboardAPI, gpsAPI, alertAPI } from '../services/api';
import { formatRelativeTime, getStatusBadgeClass, capitalizeFirst } from '../utils/formatters';
import StoreSelector from '../components/StoreSelector';
import AnimatedCounter from '../components/AnimatedCounter';
import toast from 'react-hot-toast';

// Lazy load chart components for better performance
const StatusDonutChart = lazy(() => import('../components/charts/StatusDonutChart'));
const GPSTrendChart = lazy(() => import('../components/charts/GPSTrendChart'));
const TrendSparkline = lazy(() => import('../components/charts/TrendSparkline'));
const ActivityTimeline = lazy(() => import('../components/charts/ActivityTimeline'));

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [gpsStats, setGpsStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stores, setStores] = useState([]);
  const [geofenceBreaches, setGeofenceBreaches] = useState([]);
  const [lowBatteryTrolleys, setLowBatteryTrolleys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Collapsible sections state for mobile
  const [sectionsCollapsed, setSectionsCollapsed] = useState({
    alerts: false,
    statusBreakdown: false,
    activity: false,
    gpsTrends: false
  });

  const fetchDashboardData = useCallback(async (storeId = null, silent = false) => {
    const isInitialLoad = loading;

    try {
      if (!silent) {
        if (!isInitialLoad) {
          setIsFilterLoading(true);
        }
        setRefreshing(true);
      }

      // Pass store_id as query parameter if a store is selected
      const params = storeId ? { store_id: storeId } : {};

      // Fetch main dashboard stats
      const response = await dashboardAPI.getStats(params);
      const { summary, recent_activity, stores: storeData } = response.data;

      setStats(summary);
      setRecentActivity(recent_activity);
      setStores(storeData);

      // Fetch GPS stats
      try {
        const gpsLocations = await gpsAPI.getAllLocations(params);
        const trolleys = gpsLocations.data.trolleys || [];

        setGpsStats({
          total: trolleys.length,
          inside: trolleys.filter(t => t.is_within_geofence).length,
          outside: trolleys.filter(t => !t.is_within_geofence).length
        });
      } catch (error) {
        console.error('GPS stats fetch error:', error);
        setGpsStats({ total: 0, inside: 0, outside: 0 });
      }

      // Fetch geofence breaches
      let latestBreaches = [];
      try {
        const breachesResponse = await gpsAPI.getTrolleysOutsideGeofence(params);
        latestBreaches = breachesResponse.data.trolleys || [];
        setGeofenceBreaches(latestBreaches.slice(0, 5)); // Top 5
      } catch (error) {
        console.error('Geofence breaches fetch error:', error);
        setGeofenceBreaches([]);
      }

      // Fetch low battery alerts
      try {
        const alertsResponse = await alertAPI.getAll({ ...params, type: 'low_battery', resolved: false });
        const alerts = alertsResponse.data.alerts || alertsResponse.data || [];
        setLowBatteryTrolleys(Array.isArray(alerts) ? alerts.slice(0, 3) : []); // Top 3
      } catch (error) {
        console.error('Low battery alerts fetch error:', error);
        setLowBatteryTrolleys([]);
      }

      setLastUpdate(new Date());

      // Show toast notification for new breaches (only on silent refresh)
      if (silent && latestBreaches.length > 0 && geofenceBreaches.length > 0) {
        const newBreaches = latestBreaches.filter(b =>
          !geofenceBreaches.some(existing => existing.id === b.id)
        );
        if (newBreaches.length > 0) {
          toast.error(`${newBreaches.length} new geofence breach(es) detected!`, {
            icon: '⚠️'
          });
        }
      }

    } catch (error) {
      console.error('Dashboard data fetch error:', error);

      // Only show error toast if not a 401 (auth errors redirect automatically)
      if (error.response?.status !== 401 && !silent) {
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
      setGpsStats({ total: 0, inside: 0, outside: 0 });
      setGeofenceBreaches([]);
      setLowBatteryTrolleys([]);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setIsFilterLoading(false);
      }
      setRefreshing(false);
    }
  }, [loading, geofenceBreaches]);

  useEffect(() => {
    // Load selected store from localStorage on mount
    const savedStoreId = localStorage.getItem('selectedStoreId');
    if (savedStoreId) {
      setSelectedStoreId(parseInt(savedStoreId));
    }
    fetchDashboardData(savedStoreId ? parseInt(savedStoreId) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData(selectedStoreId, true); // Silent refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, selectedStoreId, fetchDashboardData]);

  const handleStoreChange = useCallback((store) => {
    const storeId = store?.id || null;
    setSelectedStoreId(storeId);
    fetchDashboardData(storeId);
  }, [fetchDashboardData]);

  const handleManualRefresh = () => {
    fetchDashboardData(selectedStoreId, false);
    toast.success('Dashboard refreshed');
  };

  const toggleSection = (section) => {
    setSectionsCollapsed(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Memoize stat cards to avoid recalculation on every render
  const statCards = useMemo(() => [
    {
      title: 'Total Trolleys',
      value: stats?.total_trolleys || 0,
      icon: ShoppingCart,
      color: 'bg-gradient-to-br from-red-500 to-pink-600',
      sparklineColor: '#ef4444',
      link: '/trolleys',
      gradient: 'from-red-50 to-pink-50'
    },
    {
      title: 'Active Trolleys',
      value: stats?.status_counts?.active || 0,
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      sparklineColor: '#22c55e',
      link: '/trolleys?status=active',
      gradient: 'from-green-50 to-emerald-50'
    },
    {
      title: 'In Maintenance',
      value: stats?.status_counts?.maintenance || 0,
      icon: Wrench,
      color: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      sparklineColor: '#a855f7',
      link: '/trolleys?status=maintenance',
      gradient: 'from-purple-50 to-indigo-50'
    },
    {
      title: 'GPS Tracked',
      value: gpsStats?.total || 0,
      icon: Navigation,
      color: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      sparklineColor: '#3b82f6',
      link: '/radar',
      subtitle: `${gpsStats?.inside || 0} inside geofence`,
      gradient: 'from-blue-50 to-cyan-50'
    },
    {
      title: 'Geofence Breaches',
      value: gpsStats?.outside || 0,
      icon: AlertTriangle,
      color: 'bg-gradient-to-br from-orange-500 to-red-600',
      sparklineColor: '#f97316',
      link: '/radar',
      pulse: (gpsStats?.outside || 0) > 0,
      gradient: 'from-orange-50 to-red-50'
    }
  ], [stats, gpsStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-3 text-grey-600 dark:text-grey-400">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header with Store Selector and Controls */}
      <div className="glass-strong rounded-2xl p-4 lg:p-6 shadow-premium">
        <div className="flex flex-col gap-4">
          {/* Title Section */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-shoprite-red via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Live Dashboard
            </h1>
            <p className="text-sm lg:text-base text-grey-600 flex items-center gap-2">
              <Zap size={14} className="lg:hidden text-yellow-500" />
              <Zap size={16} className="hidden lg:block text-yellow-500" />
              Real-time overview with GPS tracking
            </p>
          </div>

          {/* Controls Section - Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left Side - Time and Refresh */}
            <div className="flex flex-wrap items-center gap-2">
              {lastUpdate && (
                <div className="glass text-xs lg:text-sm text-grey-700 flex items-center px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg">
                  <Clock size={14} className="lg:hidden mr-1.5 text-blue-500" />
                  <Clock size={16} className="hidden lg:block mr-2 text-blue-500" />
                  <span className="hidden sm:inline">{lastUpdate.toLocaleTimeString()}</span>
                  <span className="sm:hidden">{lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className={`glass hover:glass-strong px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg flex items-center transition-all duration-300 hover:shadow-premium text-xs lg:text-sm ${
                  refreshing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                }`}
              >
                <RefreshCw size={14} className={`lg:hidden mr-1.5 ${refreshing ? 'animate-spin text-blue-500' : 'text-grey-700'}`} />
                <RefreshCw size={16} className={`hidden lg:block mr-2 ${refreshing ? 'animate-spin text-blue-500' : 'text-grey-700'}`} />
                <span className="font-medium text-grey-900">Refresh</span>
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg flex items-center transition-all duration-300 hover:scale-105 text-xs lg:text-sm ${
                  autoRefresh
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl'
                    : 'glass hover:glass-strong text-grey-900'
                }`}
              >
                {autoRefresh ? (
                  <>
                    <Eye size={14} className="lg:hidden mr-1.5" />
                    <Eye size={16} className="hidden lg:block mr-2" />
                  </>
                ) : (
                  <>
                    <EyeOff size={14} className="lg:hidden mr-1.5" />
                    <EyeOff size={16} className="hidden lg:block mr-2" />
                  </>
                )}
                <span className="font-medium">Auto {autoRefresh ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Right Side - Store Selector */}
            <div className="w-full sm:w-auto sm:min-w-[250px] lg:w-80">
              <StoreSelector
                showAllOption={true}
                selectedStoreId={selectedStoreId}
                onStoreChange={handleStoreChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid - Responsive 5-column layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} to={stat.link}>
              <div
                className={`stat-card stat-card-gradient group cursor-pointer relative overflow-hidden ${
                  isFilterLoading ? 'opacity-50 pointer-events-none' : ''
                } ${stat.pulse ? 'glow-red' : ''} animate-fade-in-up stagger-${index + 1}`}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs lg:text-sm font-medium text-grey-600">{stat.title}</p>
                    <div className={`${stat.color} p-2 lg:p-3 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      <Icon size={20} className="lg:hidden text-white" strokeWidth={2.5} />
                      <Icon size={24} className="hidden lg:block text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <p className="text-3xl lg:text-4xl font-bold text-grey-900 mb-2">
                    {isFilterLoading ? (
                      <span className="inline-block w-16 lg:w-20 h-8 lg:h-10 bg-grey-200 animate-pulse rounded-lg"></span>
                    ) : (
                      <span className="bg-gradient-to-r from-grey-900 to-grey-700 bg-clip-text text-transparent">
                        <AnimatedCounter value={stat.value} duration={800} />
                      </span>
                    )}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs text-grey-600 font-medium mb-3">{stat.subtitle}</p>
                  )}
                  {/* Sparkline */}
                  <Suspense fallback={<div className="h-10 lg:h-12 bg-grey-100 rounded animate-pulse"></div>}>
                    <TrendSparkline color={stat.sparklineColor} height={40} />
                  </Suspense>
                </div>
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* GPS Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geofence Breaches */}
        <div className="card-glass hover:shadow-premium-lg transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg lg:text-xl font-bold text-grey-900 flex items-center flex-1">
              <div className="bg-gradient-to-br from-red-500 to-orange-600 p-2 rounded-lg mr-2 lg:mr-3">
                <AlertTriangle size={18} className="lg:hidden text-white" />
                <AlertTriangle size={20} className="hidden lg:block text-white" />
              </div>
              <span className="text-base lg:text-xl">Geofence Breaches</span>
            </h2>
            <div className="flex items-center gap-2">
              <Link
                to="/radar"
                className="hidden sm:flex text-xs lg:text-sm font-medium text-shoprite-red hover:text-shoprite-redDark transition-colors items-center gap-1 group"
              >
                View All
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <button
                onClick={() => toggleSection('alerts')}
                className="lg:hidden glass p-1.5 rounded-lg hover:glass-strong transition-all"
              >
                {sectionsCollapsed.alerts ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>
          </div>
          {!sectionsCollapsed.alerts && (
            <div className="transition-all duration-300 ease-in-out">
          {geofenceBreaches.length === 0 ? (
            <div className="text-center py-12">
              <div className="glass-strong w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                <Navigation size={32} className="text-success" />
              </div>
              <p className="text-grey-600 font-medium">All trolleys within geofence</p>
            </div>
          ) : (
            <div className="space-y-3">
              {geofenceBreaches.map((trolley) => (
                <div
                  key={trolley.id}
                  className="glass border-l-4 border-red-500 rounded-xl p-4 hover:glass-strong transition-all duration-300 hover:scale-102"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-grey-900 text-lg">{trolley.rfid_tag}</p>
                      <p className="text-sm text-grey-600 mt-1">
                        {trolley.store?.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin size={14} className="text-red-500" />
                        <p className="text-xs text-red-600 font-semibold">
                          {Math.round(trolley.current_distance_from_store)}m from store
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-600 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                        BREACH
                      </span>
                      <p className="text-xs text-grey-500 mt-2">
                        {formatRelativeTime(trolley.last_location_update)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
          )}
        </div>

        {/* Low Battery Alerts */}
        <div className="card-glass hover:shadow-premium-lg transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-grey-900 flex items-center">
              <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-2 rounded-lg mr-3">
                <Battery size={20} className="text-white" />
              </div>
              Low Battery Alerts
            </h2>
            <Link
              to="/alerts"
              className="text-sm font-medium text-shoprite-red hover:text-shoprite-redDark transition-colors flex items-center gap-1 group"
            >
              View All
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          {lowBatteryTrolleys.length === 0 ? (
            <div className="text-center py-12">
              <div className="glass-strong w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                <Zap size={32} className="text-success" />
              </div>
              <p className="text-grey-600 font-medium">All tracker batteries healthy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowBatteryTrolleys.map((alert) => (
                <div
                  key={alert.id}
                  className="glass border-l-4 border-yellow-500 rounded-xl p-4 hover:glass-strong transition-all duration-300 hover:scale-102"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-grey-900 text-lg">
                        {alert.trolley?.rfid_tag || 'Unknown'}
                      </p>
                      <p className="text-sm text-grey-600 mt-1">
                        {alert.store?.name}
                      </p>
                      <p className="text-xs text-yellow-600 font-semibold mt-2">
                        {alert.message}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-2 rounded-lg mb-2">
                        <Battery size={24} className="text-white" />
                      </div>
                      <p className="text-xs text-grey-500">
                        {formatRelativeTime(alert.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Breakdown and Store Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`card-glass hover:shadow-premium-lg transition-all duration-500 ${isFilterLoading ? 'opacity-50' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-grey-900 flex items-center">
              <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-2 rounded-lg mr-3">
                <BarChart3 size={20} className="text-white" />
              </div>
              Status Breakdown
            </h2>
          </div>

          {/* Donut Chart */}
          <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="spinner"></div></div>}>
            <StatusDonutChart statusCounts={stats?.status_counts} />
          </Suspense>

          {/* Status List */}
          <div className="space-y-2 mt-6">
            {Object.entries(stats?.status_counts || {}).map(([status, count]) => (
              <div
                key={status}
                className="glass flex items-center justify-between p-3 rounded-xl hover:glass-strong transition-all duration-300 hover:scale-102"
              >
                <div className="flex items-center gap-3">
                  <span className={`${getStatusBadgeClass(status)} status-badge shadow-md`}>
                    {capitalizeFirst(status)}
                  </span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-grey-900 to-grey-700 bg-clip-text text-transparent">
                  {isFilterLoading ? (
                    <span className="inline-block w-12 h-8 bg-grey-200 animate-pulse rounded-lg"></span>
                  ) : (
                    count
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Store Summary */}
        <div className="card-glass hover:shadow-premium-lg transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-grey-900 flex items-center">
              <div className="bg-gradient-to-br from-green-500 to-teal-600 p-2 rounded-lg mr-3">
                <MapPin size={20} className="text-white" />
              </div>
              Store Health Summary
            </h2>
          </div>

          {stores.length > 0 && (
            <div className="flex gap-2 mb-6">
              <span className="glass px-3 py-1.5 text-xs font-semibold text-success rounded-full">
                {stores.filter(s => s.healthStatus === 'good').length} Good
              </span>
              <span className="glass px-3 py-1.5 text-xs font-semibold text-warning rounded-full">
                {stores.filter(s => s.healthStatus === 'moderate').length} Moderate
              </span>
              <span className="glass px-3 py-1.5 text-xs font-semibold text-danger rounded-full">
                {stores.filter(s => s.healthStatus === 'bad').length} Bad
              </span>
            </div>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {stores.length === 0 ? (
              <p className="text-grey-500 text-center py-8">No stores available</p>
            ) : (
              stores
                .sort((a, b) => a.healthScore - b.healthScore)
                .slice(0, 5)
                .map((store) => {
                  const healthStatusMap = {
                    good: {
                      label: 'Good',
                      color: 'text-success',
                      borderColor: 'border-green-500',
                      gradient: 'from-green-500/20 to-emerald-500/10'
                    },
                    moderate: {
                      label: 'Moderate',
                      color: 'text-warning',
                      borderColor: 'border-yellow-500',
                      gradient: 'from-yellow-500/20 to-orange-500/10'
                    },
                    bad: {
                      label: 'Bad',
                      color: 'text-danger',
                      borderColor: 'border-red-500',
                      gradient: 'from-red-500/20 to-pink-500/10'
                    }
                  };

                  const healthConfig = healthStatusMap[store.healthStatus] || healthStatusMap.moderate;

                  return (
                    <div
                      key={store.id}
                      className={`glass bg-gradient-to-r ${healthConfig.gradient} rounded-xl border-l-4 ${healthConfig.borderColor} p-4 hover:glass-strong transition-all duration-300 hover:scale-102`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-bold text-grey-900">{store.name}</p>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${healthConfig.color} glass-strong`}>
                              {store.healthScore}%
                            </span>
                          </div>
                          <div className="text-sm text-grey-600">
                            <span className="font-bold text-success">{store.active}</span> active
                            <span className="mx-1">/</span>
                            <span className="font-semibold">{store.total}</span> total
                          </div>
                        </div>
                        <div className={`${healthConfig.color} bg-white/50 p-2 rounded-lg`}>
                          <MapPin size={24} />
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
            {stores.length > 5 && (
              <Link
                to="/stores"
                className="glass-strong hover:bg-white/80 block text-center text-sm font-medium text-shoprite-red hover:text-shoprite-redDark py-3 rounded-xl transition-all duration-300 hover:shadow-lg"
              >
                View all {stores.length} stores →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`card-glass hover:shadow-premium-lg transition-all duration-500 ${isFilterLoading ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-grey-900 flex items-center">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg mr-3">
              <Clock size={20} className="text-white" />
            </div>
            Recent Activity (Last 24 Hours)
          </h2>
        </div>

        {/* Activity Timeline Chart */}
        <div className="mb-6">
          <Suspense fallback={<div className="h-48 flex items-center justify-center"><div className="spinner"></div></div>}>
            <ActivityTimeline activities={recentActivity} />
          </Suspense>
        </div>

        {/* Activity List */}
        {isFilterLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass flex items-center justify-between p-3 rounded-xl">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-3 h-3 bg-grey-300 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-grey-200 animate-pulse rounded-lg w-3/4"></div>
                    <div className="h-3 bg-grey-200 animate-pulse rounded-lg w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="text-center py-12">
            <div className="glass-strong w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-grey-400" />
            </div>
            <p className="text-grey-500 font-medium">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {recentActivity.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className="glass flex items-center justify-between p-4 rounded-xl hover:glass-strong transition-all duration-300 hover:scale-102"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative">
                    <div className="w-3 h-3 bg-gradient-to-r from-shoprite-red to-pink-600 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-shoprite-red rounded-full animate-ping"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-grey-900 text-base">
                      Trolley {activity.trolley?.rfid_tag}
                    </p>
                    <p className="text-sm text-grey-600 mt-1">
                      Status changed:{' '}
                      <span className="font-medium text-grey-700">{activity.previous_status || 'none'}</span>
                      {' → '}
                      <span className="font-bold bg-gradient-to-r from-shoprite-red to-pink-600 bg-clip-text text-transparent">
                        {activity.new_status}
                      </span>
                    </p>
                    {activity.user && (
                      <p className="text-xs text-grey-500 mt-1">by {activity.user.name}</p>
                    )}
                  </div>
                </div>
                <div className="glass-strong text-sm text-grey-600 font-semibold px-3 py-1.5 rounded-lg">
                  {formatRelativeTime(activity.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GPS Tracking Trends */}
      <div className="card-glass hover:shadow-premium-lg transition-all duration-500">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-grey-900 flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-2 rounded-lg mr-3">
              <Navigation size={20} className="text-white" />
            </div>
            GPS Tracking Trends (Last 12 Hours)
          </h2>
        </div>
        <Suspense fallback={<div className="h-48 flex items-center justify-center"><div className="spinner"></div></div>}>
          <GPSTrendChart height={220} />
        </Suspense>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link to="/scan" className="glass-strong hover:shadow-premium-lg transition-all duration-500 text-center group cursor-pointer border-2 border-transparent hover:border-red-400 p-6 rounded-2xl hover:scale-105">
          <div className="bg-gradient-to-br from-red-500 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
            <ShoppingCart size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-grey-900 mb-2 text-lg">Scan Trolley</h3>
          <p className="text-sm text-grey-600">Update status</p>
        </Link>

        <Link to="/radar" className="glass-strong hover:shadow-premium-lg transition-all duration-500 text-center group cursor-pointer border-2 border-transparent hover:border-blue-400 p-6 rounded-2xl hover:scale-105">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
            <Navigation size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-grey-900 mb-2 text-lg">GPS Radar</h3>
          <p className="text-sm text-grey-600">Track live</p>
        </Link>

        <Link to="/map" className="glass-strong hover:shadow-premium-lg transition-all duration-500 text-center group cursor-pointer border-2 border-transparent hover:border-green-400 p-6 rounded-2xl hover:scale-105">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
            <TrendingUp size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-grey-900 mb-2 text-lg">View Map</h3>
          <p className="text-sm text-grey-600">Distribution</p>
        </Link>

        <Link to="/alerts" className="glass-strong hover:shadow-premium-lg transition-all duration-500 text-center group cursor-pointer border-2 border-transparent hover:border-yellow-400 p-6 rounded-2xl hover:scale-105">
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
            <AlertTriangle size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-grey-900 mb-2 text-lg">View Alerts</h3>
          <p className="text-sm text-grey-600">Notifications</p>
        </Link>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(243, 244, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #ef4444 0%, #ec4899 100%);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #dc2626 0%, #db2777 100%);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
