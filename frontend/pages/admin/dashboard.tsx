/**
 * Admin Dashboard Page
 * Main dashboard for administrators with overview statistics
 * NOTE: This page is hidden from navigation and redirects to /admin/orders
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminDashboard from '../../components/AdminDashboard';

const AdminDashboardPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to orders page as dashboard is hidden
    router.replace('/admin/orders');
  }, [router]);

  // Show loading state while redirecting
  return (
    <AdminLayout 
      title="Admin Dashboard" 
      subtitle="Redirecting..."
    >
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to orders...</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
