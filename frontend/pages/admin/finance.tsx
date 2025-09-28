/**
 * Admin Finance Page
 * Financial management interface for administrators
 */

import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import FinanceDashboard from '../../components/FinanceDashboard';

const AdminFinancePage: React.FC = () => {
  return (
    <AdminLayout 
      title="Financial Management" 
      subtitle="Monitor revenue, transactions, and financial reports"
    >
      <FinanceDashboard />
    </AdminLayout>
  );
};

export default AdminFinancePage;
