/**
 * Admin Monitoring Page
 * Provides access to the monitoring dashboard for administrators
 */

import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import MonitoringDashboard from '../../components/MonitoringDashboard';

const AdminMonitoringPage: React.FC = () => {
  return (
    <AdminLayout 
      title="System Monitoring" 
      subtitle="Monitor system performance, health, and analytics"
    >
      <MonitoringDashboard />
    </AdminLayout>
  );
};

export default AdminMonitoringPage;