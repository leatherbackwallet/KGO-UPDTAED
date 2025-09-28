/**
 * Admin Returns Page
 * Returns management interface for administrators
 */

import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ReturnsDashboard from '../../components/ReturnsDashboard';

const AdminReturnsPage: React.FC = () => {
  return (
    <AdminLayout 
      title="Returns Management" 
      subtitle="Process returns, refunds, and exchanges"
    >
      <ReturnsDashboard />
    </AdminLayout>
  );
};

export default AdminReturnsPage;
