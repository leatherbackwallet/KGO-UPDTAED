/**
 * Admin Users Page
 * User management interface for administrators
 */

import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminUsers from '../../components/AdminUsers';

const AdminUsersPage: React.FC = () => {
  return (
    <AdminLayout 
      title="User Management" 
      subtitle="Manage user accounts, roles, and permissions"
    >
      <AdminUsers />
    </AdminLayout>
  );
};

export default AdminUsersPage;
