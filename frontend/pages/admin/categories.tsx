/**
 * Admin Categories Page
 * Category management interface for administrators
 */

import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminCategories from '../../components/AdminCategories';

const AdminCategoriesPage: React.FC = () => {
  return (
    <AdminLayout 
      title="Category Management" 
      subtitle="Organize your products with categories and subcategories"
    >
      <AdminCategories />
    </AdminLayout>
  );
};

export default AdminCategoriesPage;
