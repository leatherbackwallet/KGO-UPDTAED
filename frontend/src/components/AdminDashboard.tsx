import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
}

interface Order {
  _id: string;
  totalAmount: number;
}

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && user?.role === 'Admin') {
      fetchStats();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [token, user]);

  const fetchStats = async () => {
    try {
      setError(null);
      // In a real app, you'd have a dedicated stats endpoint
      // For now, we'll fetch basic data
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        api.get<User[]>('/users', { headers: { Authorization: `Bearer ${token}` } }),
        api.get<Product[]>('/products'),
        api.get<Order[]>('/orders', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const totalRevenue = ordersRes.data.reduce((sum: number, order: Order) => sum + order.totalAmount, 0);
      
      setStats({
        totalUsers: usersRes.data.length,
        totalProducts: productsRes.data.length,
        totalOrders: ordersRes.data.length,
        totalRevenue
      });
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  if (!token || user?.role !== 'Admin') {
    return <div className="text-red-600">Access denied. Admin privileges required.</div>;
  }

  if (error) {
    return (
      <div>
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={fetchStats} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded">
          <div className="text-2xl font-bold text-blue-600">{stats?.totalUsers || 0}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <div className="text-2xl font-bold text-green-600">{stats?.totalProducts || 0}</div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
        <div className="bg-yellow-100 p-4 rounded">
          <div className="text-2xl font-bold text-yellow-600">{stats?.totalOrders || 0}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="bg-purple-100 p-4 rounded">
          <div className="text-2xl font-bold text-purple-600">${stats?.totalRevenue?.toFixed(2) || '0.00'}</div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
      </div>
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <p className="text-gray-600">Dashboard metrics and recent activity will be displayed here.</p>
      </div>
    </div>
  );
}
