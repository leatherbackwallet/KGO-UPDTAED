import React from 'react';
import { useCart } from '../context/CartContext';
import Link from 'next/link';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Shopping Cart</h2>
      {cart.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Link href="/items" className="text-blue-600 hover:text-blue-700">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div>
          <div className="space-y-4">
            {cart.map(item => (
              <div key={item.product} className="flex items-center gap-4 p-4 border rounded">
                <img 
                  src={item.image || '/images/products/placeholder.svg'} 
                  alt={item.name} 
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-gray-600">₹{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={item.stock}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.product, Number(e.target.value))}
                    className="w-16 px-2 py-1 border rounded text-center"
                  />
                  <button
                    onClick={() => removeFromCart(item.product)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Subtotal:</span>
              <span className="text-lg font-bold">₹{subtotal.toFixed(2)}</span>
            </div>
            <Link
              href="/checkout"
              className="block w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700 transition"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
