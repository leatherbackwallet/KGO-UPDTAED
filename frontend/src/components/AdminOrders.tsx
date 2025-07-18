import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface Order {
  _id: string;
  user: { name: string; email: string };
  products: { product: { name: string }; quantity: number }[];
  totalAmount: number;
  shippingAddress: string;
  status: string;
  createdAt: string;
}

export default function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get<Order[]>('/orders', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setOrders(res.data);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/orders/${id}/status`, { status }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      fetchOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating status');
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Order Management</h2>
        <div className="text-gray-600">Loading orders...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Order Management</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {orders.length === 0 ? (
        <div className="text-gray-600">No orders found</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Order</th>
              <th className="p-2">Customer</th>
              <th className="p-2">Products</th>
              <th className="p-2">Total</th>
              <th className="p-2">Shipping</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id} className="border-t">
                <td className="p-2">{order._id.slice(-6)}</td>
                <td className="p-2">{order.user?.name || 'N/A'}<br /><span className="text-xs text-gray-500">{order.user?.email}</span></td>
                <td className="p-2">
                  <ul>
                    {order.products.map((item, i) => (
                      <li key={i}>{item.product.name} x {item.quantity}</li>
                    ))}
                  </ul>
                </td>
                <td className="p-2">${order.totalAmount.toFixed(2)}</td>
                <td className="p-2">{order.shippingAddress}</td>
                <td className="p-2">{order.status}</td>
                <td className="p-2">
                  <select value={order.status} onChange={e => updateStatus(order._id, e.target.value)} className="border rounded px-2 py-1">
                    <option value="Pending">Pending</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 