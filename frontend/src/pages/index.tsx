import React from 'react';
import Navbar from '../components/Navbar';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <section className="bg-white py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to OnYourBehalf</h1>
          <p className="text-lg mb-8">Shop the best products, delivered on your behalf.</p>
          <a href="/products" className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Shop Now</a>
        </section>
        <section className="py-12">
          <h2 className="text-2xl font-semibold text-center mb-8">Featured Products</h2>
          {/* Featured products grid will go here */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* ProductCard components */}
          </div>
        </section>
      </main>
    </>
  );
}
