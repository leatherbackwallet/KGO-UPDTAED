import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/AdminDashboard';
import AdminProducts from '../components/AdminProducts';
import AdminOrders from '../components/AdminOrders';
import AdminUsers from '../components/AdminUsers';

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'dashboard' | 'products' | 'orders' | 'users'>('dashboard');

  if (!user || user.role !== 'Admin') {
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
        <div className="flex gap-4 mb-6">
          <button onClick={() => setTab('dashboard')} className={`px-4 py-2 rounded ${tab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Dashboard</button>
          <button onClick={() => setTab('products')} className={`px-4 py-2 rounded ${tab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Products</button>
          <button onClick={() => setTab('orders')} className={`px-4 py-2 rounded ${tab === 'orders' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Orders</button>
          <button onClick={() => setTab('users')} className={`px-4 py-2 rounded ${tab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Users</button>
        </div>
        {tab === 'dashboard' && <AdminDashboard />}
        {tab === 'products' && <AdminProducts />}
        {tab === 'orders' && <AdminOrders />}
        {tab === 'users' && <AdminUsers />}
      </main>
    </>
  );
}
