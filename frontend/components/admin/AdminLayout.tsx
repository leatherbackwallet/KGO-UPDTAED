/**
 * Admin Layout Component
 * Provides a completely isolated layout for admin pages
 * Independent from main application layout and navigation
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useNotifications } from '../../hooks/useNotifications';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showSidebar?: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title = "Admin Panel",
  subtitle,
  showSidebar = true
}) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { canAccessAdmin, canAccessAdminTab } = usePermissions();
  const { unreadCount } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(true); // Default to minimized
  const [isHydrated, setIsHydrated] = useState(false);

  // Admin navigation items
  const navigationItems = [
    { id: 'products', label: 'Products', href: '/admin/products', icon: '📦' },
    { id: 'categories', label: 'Categories', href: '/admin/categories', icon: '📂' },
    { id: 'occasions', label: 'Occasions', href: '/admin/occasions', icon: '🎉' },
    { id: 'orders', label: 'Orders', href: '/admin/orders', icon: '📋' },
    { id: 'users', label: 'Users', href: '/admin/users', icon: '👥' },
    { id: 'monitoring', label: 'Monitoring', href: '/admin/monitoring', icon: '📈' }
  ].filter(item => canAccessAdminTab(item.id));

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check authorization
  useEffect(() => {
    if (isHydrated && (!user || !canAccessAdmin())) {
      router.push('/login');
    }
  }, [user, canAccessAdmin, router, isHydrated]);

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || !canAccessAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  const currentPath = router.pathname;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Mobile menu button and sidebar toggle */}
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                type="button"
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <span className="sr-only">Open sidebar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Desktop sidebar toggle */}
              <button
                type="button"
                className="hidden lg:block p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                onClick={toggleSidebar}
                title={sidebarMinimized ? "Expand sidebar" : "Minimize sidebar"}
              >
                <span className="sr-only">{sidebarMinimized ? "Expand sidebar" : "Minimize sidebar"}</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {sidebarMinimized ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
              </button>
              
              <div className="ml-4 lg:ml-0">
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
              </div>
            </div>

            {/* Admin user info and actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              {unreadCount > 0 && (
                <div className="relative">
                  <button className="p-2 text-gray-400 hover:text-gray-500">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  </button>
                </div>
              )}

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}</p>
                  <p className="text-gray-500">Administrator</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <>
            {/* Desktop sidebar */}
            <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16 lg:pb-0 lg:bg-white lg:border-r lg:border-gray-200 transition-all duration-300 ${
              sidebarMinimized ? 'lg:w-16' : 'lg:w-64'
            }`}>
              <div className="flex-1 flex flex-col min-h-0">
                <nav className="flex-1 px-2 py-4 space-y-1">
                  {navigationItems.map((item) => {
                    const isActive = currentPath === item.href;
                    const hasNotification = item.id === 'orders' && unreadCount > 0;
                    
                    return (
                      <div key={item.id} className="relative">
                        <a
                          href={item.href}
                          className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                            isActive
                              ? 'bg-indigo-100 text-indigo-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          title={sidebarMinimized ? item.label : undefined}
                        >
                        <span className={`text-lg ${sidebarMinimized ? 'mx-auto' : 'mr-3'}`}>{item.icon}</span>
                        {!sidebarMinimized && (
                          <>
                            <span className="truncate">{item.label}</span>
                            {hasNotification && (
                              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                {unreadCount}
                              </span>
                            )}
                          </>
                        )}
                        {sidebarMinimized && hasNotification && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                        )}
                        </a>
                        
                        {/* Tooltip for minimized sidebar */}
                        {sidebarMinimized && (
                          <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            {item.label}
                            {hasNotification && (
                              <span className="ml-2 text-red-400">({unreadCount})</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Mobile sidebar */}
            {sidebarOpen && (
              <div className="lg:hidden">
                <div className="fixed inset-0 flex z-40">
                  <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
                  <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                      <button
                        type="button"
                        className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="sr-only">Close sidebar</span>
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                      <nav className="mt-5 px-2 space-y-1">
                        {navigationItems.map((item) => {
                          const isActive = currentPath === item.href;
                          const hasNotification = item.id === 'orders' && unreadCount > 0;
                          
                          return (
                            <a
                              key={item.id}
                              href={item.href}
                              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                                isActive
                                  ? 'bg-indigo-100 text-indigo-900'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <span className="mr-3 text-lg">{item.icon}</span>
                              {item.label}
                              {hasNotification && (
                                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                  {unreadCount}
                                </span>
                              )}
                            </a>
                          );
                        })}
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Main content */}
        <div className={`flex-1 transition-all duration-300 ${
          showSidebar 
            ? (sidebarMinimized ? 'lg:ml-16' : 'lg:ml-64') 
            : ''
        }`}>
          <main className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
