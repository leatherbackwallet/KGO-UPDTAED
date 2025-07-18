import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  category: string | { _id: string; name: string; slug: string };
  celebrationType?: string;
  stock?: number;
  images: string[];
  tags: string[];
  isFeatured: boolean;
  slug?: string;
  defaultImage?: string;
}

export default function AdminProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{_id: string, name: string, slug: string}>>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // eslint-disable-next-line
  }, []);

  const fetchProducts = async () => {
    const res = await api.get('/products');
    setProducts(res.data as Product[]);
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data as Array<{_id: string, name: string, slug: string}>);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleEdit = (product: Product) => {
    setEditing(product);
    setForm({
      ...product,
      category: typeof product.category === 'object' ? product.category._id : product.category
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchProducts();
  };

  // Generate slug from product name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const productData = {
        ...form,
        slug: form.name ? generateSlug(form.name) : undefined,
        images: form.defaultImage ? [form.defaultImage] : [],
        category: form.category,
        price: form.price || 0,
        stock: form.stock || 0
      };

      if (editing) {
        await api.put(`/products/${editing._id}`, productData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await api.post('/products', productData, { headers: { Authorization: `Bearer ${token}` } });
      }
      setEditing(null);
      setForm({});
      fetchProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error saving product');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Product Management</h2>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">📝 How to Add Products:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• <strong>Name:</strong> Enter the product name (slug will be auto-generated)</li>
          <li>• <strong>Image:</strong> Enter just the filename (e.g., "chocolate-cake.jpg") - the image should be in your sd-images folder</li>
          <li>• <strong>Category:</strong> Select from bakery categories</li>
          <li>• <strong>Tags:</strong> Add relevant tags separated by commas</li>
        </ul>
        <p className="text-blue-600 text-sm mt-2">
          💡 <strong>Tip:</strong> After creating a product, run <code className="bg-blue-100 px-1 rounded">node scripts/organize-images.js</code> to copy your images to the right location.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded">
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input type="text" placeholder="Product name" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="px-3 py-2 border rounded" required />
          <input type="number" placeholder="Price" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="px-3 py-2 border rounded" />
        </div>
        <textarea placeholder="Product description" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full mb-4 px-3 py-2 border rounded" rows={3} required />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select value={typeof form.category === 'string' ? form.category : form.category?._id || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="px-3 py-2 border rounded" required>
            <option value="">Select Category</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>

          <input type="number" placeholder="Stock quantity" value={form.stock || ''} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} className="px-3 py-2 border rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input type="text" placeholder="Default image filename (e.g., chocolate-cake.jpg)" value={form.defaultImage?.replace('/images/products/', '') || ''} onChange={e => setForm(f => ({ ...f, defaultImage: e.target.value ? `/images/products/${e.target.value}` : undefined }))} className="px-3 py-2 border rounded" />
          <input type="text" placeholder="Tags (comma separated)" value={form.tags?.join(',') || ''} onChange={e => setForm(f => ({ ...f, tags: e.target.value.split(',').map(s => s.trim()) }))} className="px-3 py-2 border rounded" />
        </div>
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center">
            <input type="checkbox" checked={form.isFeatured || false} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="mr-2" />
            Featured Product
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{editing ? 'Update' : 'Create'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({}); }} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>}
        </div>
      </form>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Name</th>
            <th className="p-2">Price</th>
            <th className="p-2">Category</th>
            <th className="p-2">Stock</th>
            <th className="p-2">Featured</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product._id} className="border-t">
              <td className="p-2">{product.name}</td>
              <td className="p-2">${product.price ? product.price.toFixed(2) : '0.00'}</td>
              <td className="p-2">{typeof product.category === 'object' ? product.category.name : product.category}</td>
              <td className="p-2">{product.stock || 0}</td>
              <td className="p-2">{product.isFeatured ? '✓' : '-'}</td>
              <td className="p-2">
                <button onClick={() => handleEdit(product)} className="mr-2 text-blue-600">Edit</button>
                <button onClick={() => handleDelete(product._id)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 