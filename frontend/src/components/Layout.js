import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Store,
  Wrench,
  Bell,
  Map,
  Radar,
  ScanLine,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  MonitorSmartphone,
  Activity
} from 'lucide-react';
import { logout, getCurrentUser } from '../utils/auth';
import { useTheme } from '../contexts/ThemeContext';

const Layout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const user = getCurrentUser();
  const { darkMode, toggleDarkMode } = useTheme();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/trolleys', icon: ShoppingCart, label: 'Trolleys' },
    { path: '/scan', icon: ScanLine, label: 'Scan' },
    { path: '/kiosk', icon: MonitorSmartphone, label: 'XS Kiosk', highlight: true },
    { path: '/kiosk-dashboard', icon: Activity, label: 'Kiosk Analytics', highlight: true },
    { path: '/stores', icon: Store, label: 'Stores' },
    { path: '/maintenance', icon: Wrench, label: 'Maintenance' },
    { path: '/alerts', icon: Bell, label: 'Alerts' },
    { path: '/map', icon: Map, label: 'Map View' },
    { path: '/radar', icon: Radar, label: 'GPS Radar' }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-grey-900 transition-colors duration-200">
      {/* Top Header - Fixed - Shoprite Branded */}
      <header className="bg-shoprite-red dark:bg-grey-800 border-b-4 border-shoprite-redDark dark:border-grey-700 fixed top-0 left-0 right-0 h-16 z-30 shadow-header">
        <div className="h-full flex items-center justify-between px-4">
          {/* Left: Toggle + Logo */}
          <div className="flex items-center gap-3">
            {/* Mobile Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-shoprite-redDark text-white transition-all duration-200"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Desktop Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block p-2 rounded-md hover:bg-shoprite-redDark text-white transition-all duration-200"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu size={24} />
            </button>

            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <ShoppingCart size={32} className="text-white" strokeWidth={2.5} />
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-white leading-none">CartSaver</h1>
                <span className="text-xs text-white/90 leading-none mt-0.5">Smart Trolley Management</span>
              </div>
            </div>
          </div>

          {/* Right: User Info + Dark Mode + Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center text-sm">
              <span className="text-white/90">Welcome,&nbsp;</span>
              <span className="font-semibold text-white">{user?.name}</span>
              {user?.role === 'admin' && (
                <span className="ml-2 px-3 py-1 text-xs bg-white text-shoprite-red rounded-full font-bold shadow-sm">
                  ADMIN
                </span>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-white hover:bg-shoprite-redDark rounded-lg transition-all duration-200"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-white hover:bg-shoprite-redDark rounded-lg transition-all duration-200"
              title="Logout"
            >
              <LogOut size={20} />
              <span className="hidden md:inline text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar - Flush Below Header */}
      <aside
        className={`
          fixed left-0 top-16 z-20 bg-white dark:bg-grey-800 border-r-2 border-grey-200 dark:border-grey-700 shadow-lg
          transition-transform duration-200 ease-out will-change-transform
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${sidebarCollapsed ? 'lg:w-20 w-64' : 'lg:w-64 w-64'}
        `}
        style={{
          height: 'calc(100vh - 4rem)'
        }}
      >
        <nav className="h-full flex flex-col py-4 overflow-y-auto">
          {/* Navigation Items */}
          <ul className="flex-1 space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path} className="relative group">
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center w-full rounded-lg transition-all duration-200
                      ${sidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'}
                      ${active
                        ? 'bg-shoprite-red dark:bg-shoprite-red text-white shadow-md'
                        : item.highlight
                        ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-grey-700 hover:text-purple-700 dark:hover:text-purple-300 font-semibold'
                        : 'text-grey-700 dark:text-grey-300 hover:bg-red-50 dark:hover:bg-grey-700 hover:text-shoprite-red dark:hover:text-shoprite-redLight'
                      }
                    `}
                  >
                    <Icon
                      size={22}
                      className={`flex-shrink-0 ${active ? '' : 'group-hover:scale-110'} transition-transform duration-200`}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    {!sidebarCollapsed && (
                      <span className="ml-3 font-medium whitespace-nowrap">
                        {item.label}
                        {item.highlight && !active && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                            NEW
                          </span>
                        )}
                      </span>
                    )}
                  </Link>

                  {/* Tooltip for collapsed sidebar */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-grey-900 text-white text-sm font-medium rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                      {item.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-grey-900"></div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Sidebar Footer */}
          <div className="px-3 py-4 border-t border-grey-200 dark:border-grey-700 mt-auto">
            {sidebarCollapsed ? (
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-shoprite-red flex items-center justify-center" title="CartSaver v1.0">
                  <ShoppingCart size={20} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-grey-500 dark:text-grey-400">
                <p className="font-semibold text-shoprite-red dark:text-shoprite-redLight">CartSaver v1.0</p>
                <p className="mt-1">Powered by Shoprite</p>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 z-10 bg-black transition-opacity duration-200 lg:hidden ${
          sidebarOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Main Content Area */}
      <main
        className={`min-h-screen bg-white dark:bg-grey-900 transition-all duration-300 pt-16 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <div className="p-4 lg:p-8 bg-grey-50 dark:bg-grey-900">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
