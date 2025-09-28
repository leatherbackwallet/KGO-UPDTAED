/**
 * Admin Orders Page
 * Order management interface for administrators
 */

import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminOrders from '../../components/AdminOrders';

const AdminOrdersPage: React.FC = () => {
  return (
    <AdminLayout 
      title="Order Management" 
      subtitle="Track, manage, and process customer orders"
    >
      <AdminOrders />
    </AdminLayout>
  );
};

export default AdminOrdersPage;
