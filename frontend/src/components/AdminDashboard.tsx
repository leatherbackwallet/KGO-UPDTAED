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
  totalPrice: number;
}

export default function AdminDashboard() {
  const { tokens, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tokens?.accessToken && user?.roleName === 'admin') {
      fetchStats();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [tokens, user]);

  const fetchStats = async () => {
    try {
      setError(null);
      // In a real app, you'd have a dedicated stats endpoint
      // For now, we'll fetch basic data
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        api.get<User[]>('/users', { headers: { Authorization: `Bearer ${tokens?.accessToken}` } }),
        api.get<Product[]>('/products'),
        api.get<Order[]>('/orders', { headers: { Authorization: `Bearer ${tokens?.accessToken}` } })
      ]);

      const totalRevenue = ordersRes.data?.reduce((sum: number, order: Order) => sum + (order.totalPrice || 0), 0) || 0;
      
      setStats({
        totalUsers: usersRes.data?.length || 0,
        totalProducts: productsRes.data?.length || 0,
        totalOrders: ordersRes.data?.length || 0,
        totalRevenue
      });
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      // Don't show error for empty data, just set defaults
      setStats({
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  if (!tokens?.accessToken || user?.roleName !== 'admin') {
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
        <div className="bg-kgo-red-light p-4 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-kgo-red">{stats?.totalUsers || 0}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-kgo-green-light p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-kgo-green">{stats?.totalProducts || 0}</div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{stats?.totalOrders || 0}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">₹{stats?.totalRevenue?.toFixed(2) || '0.00'}</div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">📊 Quick Actions:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-blue-700">
            <strong>Users:</strong> {stats?.totalUsers || 0} registered users
          </div>
          <div className="text-blue-700">
            <strong>Products:</strong> {stats?.totalProducts || 0} active products
          </div>
          <div className="text-blue-700">
            <strong>Orders:</strong> {stats?.totalOrders || 0} total orders
          </div>
        </div>
      </div>
    </div>
  );
}
