import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

interface Order {
  _id: string;
  orderItems?: { productId: { name: { en: string; de: string }; price: number }; quantity: number; price: number }[];
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

export default function Orders() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get<Order[]>('/orders/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {loading ? (
          <div className="text-gray-600">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-gray-600">You have no orders yet.</div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order._id} className="border rounded p-4 bg-white">
                <div className="flex justify-between mb-2">
                  <div className="font-semibold">Order #{order._id.slice(-6)}</div>
                  <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</div>
                </div>
                <div className="mb-2">Status: <span className="font-semibold">{order.orderStatus}</span></div>
                <div className="mb-2">Shipping: {order.shippingDetails ? `${order.shippingDetails.address.streetName}, ${order.shippingDetails.address.city}` : 'N/A'}</div>
                <ul className="mb-2">
                  {order.orderItems?.map((item, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{item.productId?.name?.en || 'Unknown Product'} x {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-right font-bold">Total: ₹{(order.totalPrice || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
