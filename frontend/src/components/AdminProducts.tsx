
import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { getMultilingualText } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { Product } from '../types/product';
import { getProductImage, DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';
import FileUpload from './FileUpload';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const AdminProducts: React.FC = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
  const [imageCache, setImageCache] = useState<Map<string, string>>(new Map());
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string>('');

  // Preload all product images
  useEffect(() => {
    const preloadImages = async () => {
      const newCache = new Map<string, string>();
      
      for (const product of products) {
        const imagePath = product.images?.[0] || product.defaultImage;
        if (imagePath) {
          try {
            const imageUrl = getProductImage(imagePath, product.slug);
            // Preload the image
            await new Promise<string>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(imageUrl);
              img.onerror = () => reject(new Error('Failed to load image'));
              img.src = imageUrl;
            });
            newCache.set(product._id, imageUrl);
          } catch (err) {
            console.warn(`Failed to preload image for product ${product._id}:`, err);
            newCache.set(product._id, DEFAULT_PRODUCT_IMAGE);
          }
        } else {
          newCache.set(product._id, DEFAULT_PRODUCT_IMAGE);
        }
      }
      
      setImageCache(newCache);
    };

    if (products.length > 0) {
      preloadImages();
    }
  }, [products]);

  // Helper function to get cached image URL
  const getCachedImageUrl = (product: Product): string => {
    return imageCache.get(product._id) || DEFAULT_PRODUCT_IMAGE;
  };

  // Check authentication and admin role
  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }
    
    // Check if user has admin role
    if (user.roleName !== 'admin') {
      setError('Access denied. Admin privileges required.');
      return;
    }
    
    fetchProducts();
    fetchCategories();
  }, [user, token, router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      const productsData = response.data?.data || response.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch products');
      setProducts([]); // Ensure products is always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      const categoriesData = response.data?.data || response.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setCategories([]); // Ensure categories is always an array
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditingProduct({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      occasions: product.occasions,
      isFeatured: product.isFeatured
    });
    setUploadedImages(product.images || []);
    setShowModal(true);
  };

  const handleSaveProduct = async () => {
    if (!selectedProduct) {
      // Adding new product
      await handleAddProduct();
    } else {
      // Editing existing product
      await handleEditProductSave();
    }
  };

  const handleAddProduct = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Validate required fields
      if (!editingProduct.name || !editingProduct.description) {
        setError('Name and description are required');
        return;
      }

      // Ensure name and description are simple strings
      const validatedData = {
        ...editingProduct,
        name: typeof editingProduct.name === 'string' ? editingProduct.name : '',
        description: typeof editingProduct.description === 'string' ? editingProduct.description : '',
        // Ensure categories is an array
        categories: editingProduct.category ? [editingProduct.category] : [],
        // Include images
        images: uploadedImages,
        defaultImage: uploadedImages[0] || undefined
      };

      console.log('Sending validated new product data:', validatedData);
      
      const response = await api.post('/products', validatedData);
      console.log('Add response:', response.data);
      
      if (response.data) {
        // Refresh the products list
        await fetchProducts();
        setShowModal(false);
        setSelectedProduct(null);
        setEditingProduct({});
        setError(''); // Clear any previous errors
        setSuccess('Product added successfully!');
        setTimeout(() => setSuccess(''), 3000); // Clear success message after 3 seconds
      } else {
        setError('Failed to add product');
      }
    } catch (err: any) {
      console.error('Error adding product:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.error?.message || err.message || 'Failed to add product');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProductSave = async () => {
    if (!selectedProduct) return;

    try {
      setSaving(true);
      setError('');
      
      // Validate required fields
      if (!editingProduct.name || !editingProduct.description) {
        setError('Name and description are required');
        return;
      }

      // Ensure name and description are simple strings
      const validatedData = {
        ...editingProduct,
        name: typeof editingProduct.name === 'string' ? editingProduct.name : '',
        description: typeof editingProduct.description === 'string' ? editingProduct.description : '',
        // Include images
        images: uploadedImages,
        defaultImage: uploadedImages[0] || undefined
      };

      console.log('Sending validated update data:', validatedData);
      console.log('Product ID:', selectedProduct._id);
      
      const response = await api.put(`/products/${selectedProduct._id}`, validatedData);
      console.log('Update response:', response.data);
      
      if (response.data.success) {
        // Refresh the products list
        await fetchProducts();
        setShowModal(false);
        setSelectedProduct(null);
        setEditingProduct({});
        setError(''); // Clear any previous errors
        setSuccess('Product updated successfully!');
        setTimeout(() => setSuccess(''), 3000); // Clear success message after 3 seconds
      } else {
        setError(response.data.error?.message || 'Failed to update product');
      }
    } catch (err: any) {
      console.error('Error updating product:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.error?.message || err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${productId}`);
      fetchProducts();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.response?.data?.error?.message || 'Failed to delete product');
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.error('Image failed to load:', target.src);
    target.src = DEFAULT_PRODUCT_IMAGE;
  };

  const handleImageUploadSuccess = (fileData: { filename: string; url: string; originalName: string }) => {
    setUploadedImages(prev => [...prev, fileData.url]);
    setUploadError('');
  };

  const handleImageUploadError = (error: string) => {
    setUploadError(error);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const getCategoryName = (category: any) => {
    if (!category) return 'No Category';
    if (typeof category === 'string') {
      // If it's a string, try to find the category name from the categories array
      const foundCategory = categories.find(cat => cat._id === category);
      return foundCategory ? getMultilingualText(foundCategory.name) : category;
    }
    if (category.name) {
      return getMultilingualText(category.name);
    }
    return 'Unknown Category';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please log in to access this page.</p>
      </div>
    );
  }

  if (user.roleName !== 'admin') {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">Admin privileges required to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Products Management</h2>
        <button
          onClick={() => {
            setSelectedProduct(null);
            setEditingProduct({});
            setUploadedImages([]);
            setUploadError('');
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products && products.length > 0 ? products.map((product) => {
                // Use cached image for each product
                const imageUrl = getCachedImageUrl(product);

                return (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={imageUrl}
                            alt={getMultilingualText(product.name)}
                            onError={handleImageError}
                            style={{ opacity: 1 }} // No opacity change needed for preloaded images
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getMultilingualText(product.name)}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {getMultilingualText(product.description)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCategoryName(product.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{product.price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.stock || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.isFeatured 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.isFeatured ? 'Featured' : 'Regular'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setUploadedImages([]);
                  setUploadError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (English)
                </label>
                <input
                  type="text"
                  value={typeof editingProduct.name === 'string' ? editingProduct.name : ''}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    name: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (English)
                </label>
                <textarea
                  value={typeof editingProduct.description === 'string' ? editingProduct.description : ''}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    description: e.target.value
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>



              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      price: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={editingProduct.stock || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      stock: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={typeof editingProduct.category === 'object' ? editingProduct.category?._id || '' : (editingProduct.category || '')}
                  onChange={(e) => {
                    const category = categories.find(cat => cat._id === e.target.value);
                    setEditingProduct({
                      ...editingProduct,
                      category: category || ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories && categories.length > 0 ? categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {getMultilingualText(category.name)}
                    </option>
                  )) : (
                    <option value="" disabled>No categories available</option>
                  )}
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingProduct.isFeatured || false}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      isFeatured: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured Product</span>
                </label>
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Images
                </label>
                <FileUpload
                  onUploadSuccess={handleImageUploadSuccess}
                  onUploadError={handleImageUploadError}
                  accept="image/*"
                  maxSize={5}
                  className="mb-4"
                />
                {uploadError && (
                  <p className="text-red-600 text-sm mt-1">{uploadError}</p>
                )}
                
                {/* Display uploaded images */}
                {uploadedImages.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Images:</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedImages.map((imageUrl, index) => (
                        <div key={index} className="relative">
                          <img
                            src={imageUrl}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setUploadedImages([]);
                  setUploadError('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {selectedProduct ? 'Updating...' : 'Adding...'}
                  </div>
                ) : (
                  selectedProduct ? 'Update Product' : 'Add Product'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts; 