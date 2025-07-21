import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../../utils/api';
import Navbar from '../../components/Navbar';
import { getProductImage } from '../../utils/imageUtils';

interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  category: string | { _id: string; name: string; slug: string };
  stock?: number;
  images?: string[];
  slug?: string;
}

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) fetchProduct();
    // eslint-disable-next-line
  }, [id]);

  const fetchProduct = async () => {
    const res = await api.get(`/products/${id}`);
    setProduct(res.data as Product);
  };

  const addToCart = () => {
    // Implement cart logic (localStorage or context)
    alert('Added to cart!');
  };

  if (!product) return <div>Loading...</div>;

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <img
              src={getProductImage(product.images?.[0] || '', product.slug)}
              alt={product.name}
              className="w-full h-96 object-cover rounded mb-4"
            />
            <div className="flex gap-2">
              {product.images?.map((img, i) => (
                <img key={i} src={getProductImage(img, product.slug)} alt="" className="w-20 h-20 object-cover rounded" />
              ))}
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="text-xl text-blue-600 font-bold mb-4">${(product.price || 0).toFixed(2)}</div>
            <p className="mb-4">{product.description}</p>
            <div className="mb-4">Stock: {product.stock || 0}</div>
            <div className="mb-4">
              <label className="mr-2">Quantity:</label>
              <input
                type="number"
                min={1}
                max={product.stock || 1}
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-20 px-2 py-1 border rounded"
              />
            </div>
            <button
              onClick={addToCart}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </main>
    </>
  );
} 