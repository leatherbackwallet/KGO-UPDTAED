import React from 'react';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import Link from 'next/link';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
        {cart.length === 0 ? (
          <div>Your cart is empty. <Link href="/products" className="text-blue-600">Shop now</Link>.</div>
        ) : (
          <div>
            <ul className="divide-y">
              {cart.map(item => (
                <li key={item.product} className="flex items-center gap-4 py-4">
                  <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-gray-600">₹{item.price.toFixed(2)}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <label>Qty:</label>
                      <input
                        type="number"
                        min={1}
                        max={item.stock}
                        value={item.quantity}
                        onChange={e => updateQuantity(item.product, Number(e.target.value))}
                        className="w-16 px-2 py-1 border rounded"
                      />
                      <button onClick={() => removeFromCart(item.product)} className="ml-2 text-red-600">Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="text-right mt-6">
              <div className="text-xl font-bold">Subtotal: ₹{subtotal.toFixed(2)}</div>
              <Link href="/checkout" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Proceed to Checkout</Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
