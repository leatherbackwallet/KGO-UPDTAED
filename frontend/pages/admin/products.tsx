/**
 * Admin Products Page
 * Product management interface for administrators
 */

import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminProducts from '../../components/AdminProducts';

const AdminProductsPage: React.FC = () => {
  return (
    <AdminLayout 
      title="Product Management" 
      subtitle="Manage your product catalog, inventory, and pricing"
    >
      <AdminProducts />
    </AdminLayout>
  );
};

export default AdminProductsPage;
