import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const { user, token } = useAuth();
  const [shippingAddress, setShippingAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/orders', {
        products: cart.map(item => ({ product: item.product, quantity: item.quantity })),
        shippingAddress,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Order placed successfully!');
      clearCart();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {success && <div className="mb-4 text-green-600">{success}</div>}
        <form onSubmit={handleOrder} className="bg-white p-6 rounded shadow">
          <div className="mb-4">
            <label className="block mb-2 font-semibold">Shipping Address</label>
            <input
              type="text"
              value={shippingAddress}
              onChange={e => setShippingAddress(e.target.value)}
              className="w-full px-4 py-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-semibold">Order Summary</label>
            <ul className="mb-2">
              {cart.map(item => (
                <li key={item.product} className="flex justify-between">
                  <span>{item.name} x {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="text-right font-bold">Total: ${subtotal.toFixed(2)}</div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition" disabled={loading}>
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      </main>
    </>
  );
}
