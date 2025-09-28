/**
 * Admin Dashboard Page
 * Main dashboard for administrators with overview statistics
 */

import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminDashboard from '../../components/AdminDashboard';

const AdminDashboardPage: React.FC = () => {
  return (
    <AdminLayout 
      title="Admin Dashboard" 
      subtitle="Overview of your platform's performance and key metrics"
    >
      <AdminDashboard />
    </AdminLayout>
  );
};

export default AdminDashboardPage;
