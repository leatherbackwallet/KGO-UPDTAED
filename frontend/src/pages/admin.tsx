import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/AdminDashboard';
import AdminProducts from '../components/AdminProducts';
import AdminOrders from '../components/AdminOrders';
import AdminUsers from '../components/AdminUsers';
import FinanceDashboard from '../components/FinanceDashboard';
import ReturnsDashboard from '../components/ReturnsDashboard';
import AdminTabs from '../components/AdminTabs';

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'dashboard' | 'products' | 'orders' | 'users' | 'finance' | 'returns'>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'products', label: 'Products' },
    { id: 'orders', label: 'Orders' },
    { id: 'users', label: 'Users' },
    { id: 'finance', label: 'Finance' },
    { id: 'returns', label: 'Returns' }
  ];

  if (!user || user.roleName !== 'admin') {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-red-600 font-bold">Access denied. Admins only.</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
        
        <div className="mb-8">
          <AdminTabs
            tabs={tabs.map(t => t.label)}
            activeTab={tabs.find(t => t.id === tab)?.label || 'Dashboard'}
            onTabChange={(tabLabel) => {
              const tabId = tabs.find(t => t.label === tabLabel)?.id as any;
              setTab(tabId);
            }}
            className="mb-6"
          />
        </div>

        {tab === 'dashboard' && <AdminDashboard />}
        {tab === 'products' && <AdminProducts />}
        {tab === 'orders' && <AdminOrders />}
        {tab === 'users' && <AdminUsers />}
        {tab === 'finance' && <FinanceDashboard />}
        {tab === 'returns' && <ReturnsDashboard />}
      </main>
    </>
  );
}

// Disable static generation for this page
export async function getServerSideProps() {
  return {
    props: {},
  };
}
