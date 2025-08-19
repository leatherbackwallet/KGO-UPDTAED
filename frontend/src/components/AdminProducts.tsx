import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import FileUpload from './FileUpload';
import { extractProductNameFromImage, generateSlug } from '../utils/imageUtils';

interface Product {
  _id: string;
  name: string | { en: string; de: string };
  description: string | { en: string; de: string };
  price?: number;
  categories: string[] | Array<{ _id: string; name: string | { en: string; de: string }; slug: string }>;
  stock?: number;
  images: string[];
  occasions?: string[];
  vendors?: string[] | Array<{ _id: string; storeName: string }>;
  isFeatured: boolean;
  slug?: string;
  defaultImage?: string;
}

interface Category {
  _id: string;
  name: string | { en: string; de: string };
  slug: string;
}

interface Vendor {
  _id: string;
  storeName: string;
  status?: string;
}

export default function AdminProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<{
    name?: string;
    description?: string;
    price?: number;
    categories?: string[];
    stock?: number;
    defaultImage?: string;
    occasions?: string[];
    vendors?: string[];
    isFeatured?: boolean;
  }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Available occasions for tag selection
  const availableOccasions = [
    'DIWALI', 'ANNIVERSARY', 'BIRTHDAY', 'CONDOLENCES', 'CONGRATULATION',
    'FATHERS DAY', 'GET WELL SOON', 'HOUSE WARMING', 'JUST BECAUSE',
    'MISS YOU', 'NEW BORN', 'ONAM', 'SYMPATHY', 'THANK YOU',
    'TRADITIONAL', 'WEDDING'
  ];

  // Get all used occasions from existing products
  const usedOccasions = Array.from(new Set(
    Array.isArray(products) ? products.flatMap(product => product.occasions || []) : []
  ));

  // Combine available and used occasions
  const allOccasions = Array.from(new Set([...availableOccasions, ...usedOccasions]));

  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      try {
        await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchVendors()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setDataLoading(false);
      }
    };
    
    loadData();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      // Handle the nested data structure from the API
      const productsData = res.data.data || res.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]); // Ensure products is always an array
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      // Handle the nested data structure from the API
      const categoriesData = res.data.data || res.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]); // Ensure categories is always an array
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await api.get('/vendors/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle the nested data structure from the API
      const vendorsData = res.data.data || res.data || [];
      setVendors(Array.isArray(vendorsData) ? vendorsData : []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setVendors([]); // Ensure vendors is always an array
    }
  };

  const handleEdit = (product: Product) => {
    setEditing(product);
    setForm({
      ...product,
      name: getText(product.name),
      description: getText(product.description),
      categories: Array.isArray(product.categories) 
        ? product.categories.map(cat => typeof cat === 'string' ? cat : cat._id)
        : [],
      vendors: Array.isArray(product.vendors)
        ? product.vendors.map(vendor => typeof vendor === 'string' ? vendor : vendor._id)
        : []
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  // Helper function to get text from multilingual object or string
  const getText = (text: string | { en: string; de: string }): string => {
    if (typeof text === 'string') return text;
    return text.en || text.de || '';
  };

  const handleImageUpload = (fileData: { url: string; filename?: string }) => {
    setForm(f => ({ 
      ...f, 
      defaultImage: fileData.url 
    }));

    // Auto-extract product name from image filename if name is empty
    if (!form.name && fileData.filename) {
      const extractedName = extractProductNameFromImage(fileData.filename);
      if (extractedName) {
        setForm(f => ({ 
          ...f, 
          name: extractedName,
          defaultImage: fileData.url 
        }));
      }
    }
  };

  const toggleOccasion = (occasion: string) => {
    setForm(f => ({
      ...f,
      occasions: f.occasions?.includes(occasion)
        ? f.occasions.filter(o => o !== occasion)
        : [...(f.occasions || []), occasion]
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setForm(f => ({
      ...f,
      categories: f.categories?.includes(categoryId)
        ? f.categories.filter(c => c !== categoryId)
        : [...(f.categories || []), categoryId]
    }));
  };

  const toggleVendor = (vendorId: string) => {
    setForm(f => ({
      ...f,
      vendors: f.vendors?.includes(vendorId)
        ? f.vendors.filter(v => v !== vendorId)
        : [...(f.vendors || []), vendorId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const productData = {
        ...form,
        name: { en: (form.name as string) || '', de: (form.name as string) || '' },
        description: { en: (form.description as string) || '', de: (form.description as string) || '' },
        slug: form.name ? generateSlug(form.name as string) : undefined,
        images: form.defaultImage ? [form.defaultImage] : [],
        categories: form.categories || [],
        vendors: form.vendors || [],
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
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setEditing(null);
    setForm({});
    setError('');
  };

  // Show loading state while data is being fetched
  if (dataLoading) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Product Management</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading products, categories, and vendors...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Product Management</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">📝 How to Add Products:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• <strong>Image Upload:</strong> Upload an image first - the product name will be auto-extracted from the filename</li>
          <li>• <strong>Categories:</strong> Select multiple categories by clicking on them</li>
          <li>• <strong>Occasions:</strong> Click on occasion tags to add/remove them</li>
          <li>• <strong>Vendors:</strong> Select vendors who can supply this product (optional)</li>
        </ul>
        <p className="text-blue-600 text-sm mt-2">
          💡 <strong>Tip:</strong> Use descriptive filenames like "birthday-cake-chocolate.jpg" for better auto-naming.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-6 rounded-lg">
        {error && <div className="text-red-600 mb-4 p-3 bg-red-50 rounded">{error}</div>}
        
        {/* Image Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Image *</label>
          <FileUpload
            onUploadSuccess={handleImageUpload}
            onUploadError={(error) => setError(error)}
            className="mb-2"
          />
          {form.defaultImage && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>✓ Image uploaded successfully</span>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, defaultImage: undefined }))}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
            <input 
              type="text" 
              placeholder="Product name (auto-filled from image filename)" 
              value={form.name || ''} 
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={form.price || ''} 
              onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
          <textarea 
            placeholder="Product description" 
            value={form.description || ''} 
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            rows={3} 
            required 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
            <input 
              type="number" 
              placeholder="0" 
              value={form.stock || ''} 
              onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              min="0"
              required
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={form.isFeatured || false} 
                onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} 
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
              />
              <span className="text-sm font-medium text-gray-700">Featured Product</span>
            </label>
          </div>
        </div>

        {/* Categories Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Categories *</label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {categories.map(category => {
              const categoryName = getText(category.name);
              const isSelected = form.categories?.includes(category._id);
              return (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => toggleCategory(category._id)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {categoryName}
                </button>
              );
            })}
          </div>
          {form.categories && form.categories.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Selected: {form.categories.length} category{form.categories.length !== 1 ? 'ies' : 'y'}
            </p>
          )}
        </div>

        {/* Occasions Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Occasions (Tags)</label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {allOccasions.map(occasion => {
              const isSelected = form.occasions?.includes(occasion);
              const isUsed = usedOccasions.includes(occasion);
              return (
                <button
                  key={occasion}
                  type="button"
                  onClick={() => toggleOccasion(occasion)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    isSelected
                      ? 'bg-green-600 text-white border-green-600'
                      : isUsed
                      ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {occasion}
                </button>
              );
            })}
          </div>
          {form.occasions && form.occasions.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Selected: {form.occasions.length} occasion{form.occasions.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Vendors Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Vendors (Optional)</label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {vendors.map(vendor => {
              const isSelected = form.vendors?.includes(vendor._id);
              return (
                <button
                  key={vendor._id}
                  type="button"
                  onClick={() => toggleVendor(vendor._id)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {vendor.storeName}
                </button>
              );
            })}
          </div>
          {form.vendors && form.vendors.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Selected: {form.vendors.length} vendor{form.vendors.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-3">
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (editing ? 'Update Product' : 'Create Product')}
          </button>
          {editing && (
            <button 
              type="button" 
              onClick={clearForm}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Products ({Array.isArray(products) ? products.length : 0})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(products) && products.map(product => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {/* Product Thumbnail */}
                      <div className="flex-shrink-0 mr-3">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={`http://localhost:5001/images/${product.images[0]}`}
                            alt={getText(product.name)}
                            className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/products/placeholder.svg';
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-200 border border-gray-200 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{getText(product.name)}</div>
                        <div className="text-sm text-gray-500">{product.occasions?.join(', ') || 'No occasions'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.price ? product.price.toFixed(2) : '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Array.isArray(product.categories) 
                      ? product.categories.map(cat => 
                          typeof cat === 'string' ? cat : getText(cat.name)
                        ).join(', ')
                      : 'No categories'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.isFeatured ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Featured
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEdit(product)} 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(product._id)} 
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 