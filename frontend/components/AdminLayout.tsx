/**
 * AdminLayout Component
 * Standardized layout component for all admin tabs
 * Provides consistent left sidebar + main content structure
 * Features: Responsive design, consistent spacing, full width utilization
 */

import React from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  className?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  sidebar,
  title,
  subtitle,
  headerActions,
  className = ''
}) => {
  return (
    <div className={`flex gap-6 ${className}`}>
      {/* Left Sidebar - CRUD Operations */}
      <div className="w-72 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
          {sidebar}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-4">
              {headerActions}
            </div>
          )}
        </div>

        {/* Main Content */}
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
