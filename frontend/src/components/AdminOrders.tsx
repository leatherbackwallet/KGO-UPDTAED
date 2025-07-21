import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface Order {
  _id: string;
  userId?: { firstName: string; lastName: string; email: string };
  orderItems?: { productId: { name: { en: string; de: string } }; quantity: number; price: number }[];
  totalPrice: number;
  shippingDetails?: {
    recipientName: string;
    recipientPhone: string;
    address: {
      streetName: string;
      houseNumber: string;
      postalCode: string;
      city: string;
      countryCode: string;
    };
  };
  orderStatus: string;
  createdAt: string;
}

export default function AdminOrders() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && user?.roleName === 'admin') {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [token, user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get<Order[]>('/orders', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setOrders(res.data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      // Don't show error for empty data, just set empty array
      setOrders([]);
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

  if (!token || user?.roleName !== 'admin') {
    return <div className="text-red-600">Access denied. Admin privileges required.</div>;
  }

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
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">No orders found</div>
          <div className="text-sm text-gray-400">Orders will appear here when customers place them</div>
        </div>
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
                <td className="p-2">{order.userId ? `${order.userId.firstName} ${order.userId.lastName}` : 'Guest User'}<br /><span className="text-xs text-gray-500">{order.userId?.email || 'N/A'}</span></td>
                <td className="p-2">
                  <ul>
                    {order.orderItems?.map((item, i) => (
                      <li key={i}>{item.productId?.name?.en || 'Unknown Product'} x {item.quantity} ₹{(item.price * item.quantity).toFixed(2)}</li>
                    )) || <li>No products</li>}
                  </ul>
                </td>
                <td className="p-2">₹{(order.totalPrice || 0).toFixed(2)}</td>
                <td className="p-2">{order.shippingDetails ? `${order.shippingDetails.address.streetName}, ${order.shippingDetails.address.city}` : 'N/A'}</td>
                <td className="p-2">
                  <span className={`status-${order.orderStatus}`}>
                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                  </span>
                </td>
                <td className="p-2">
                  <select value={order.orderStatus} onChange={e => updateStatus(order._id, e.target.value)} className="form-input text-sm">
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
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