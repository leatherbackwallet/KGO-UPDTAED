/**
 * Admin Occasions Page
 * Occasion management interface for administrators
 */

import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminOccasions from '../../components/AdminOccasions';

const AdminOccasionsPage: React.FC = () => {
  return (
    <AdminLayout 
      title="Occasion Management" 
      subtitle="Manage special occasions and seasonal categories"
    >
      <AdminOccasions />
    </AdminLayout>
  );
};

export default AdminOccasionsPage;
