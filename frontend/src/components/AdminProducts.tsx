
import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { getMultilingualText } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { Product, ComboItem } from '../types/product';
import { getProductImage, getOptimizedImagePath, DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';
import FileUpload from './FileUpload';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const AdminProducts: React.FC = () => {
  const { user, tokens } = useAuth();
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
  const [uploadedImages, setUploadedImages] = useState<Array<{ public_id?: string; filename: string; url: string; originalName: string }>>([]);
  const [uploadError, setUploadError] = useState<string>('');
  const [deletingProducts, setDeletingProducts] = useState<Set<string>>(new Set());
  const [recentlyDeleted, setRecentlyDeleted] = useState<Set<string>>(new Set());
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Combo product state
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);

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
    const baseImagePath = product.images?.[0] || product.defaultImage;
    return baseImagePath ? getOptimizedImagePath(baseImagePath, 'medium') : DEFAULT_PRODUCT_IMAGE;
  };

  // Check authentication and admin role
  useEffect(() => {
    if (!user || !tokens?.accessToken) {
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
  }, [user, tokens, router]);

  const clearCacheAndRefresh = async () => {
    try {
      // Clear any cached data
      if (typeof window !== 'undefined') {
        // Clear image cache
        setImageCache(new Map());
        
        // Clear any cached API responses
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
      }
      
      // Fetch fresh data
      await fetchProducts();
    } catch (error) {
      console.error('Error clearing cache:', error);
      // Fallback to regular fetch
      await fetchProducts();
    }
  };

  // Debug function to log current products
  const debugProducts = () => {
    console.log('Current products in state:', products.map(p => ({ id: p._id, name: p.name })));
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Get all products for admin without pagination limits
      const response = await api.get('/products', {
        params: {
          _t: Date.now(), // Cache busting parameter
          admin: true, // Bypass pagination limits
          includeDeleted: false // Only get active products
        }
      });
      
      const productsData = response.data?.data || response.data || [];
      console.log('🔍 Fetched products data:', productsData);
      console.log('🔍 First product combo fields:', productsData[0] ? {
        isCombo: productsData[0].isCombo,
        comboBasePrice: productsData[0].comboBasePrice,
        comboItems: productsData[0].comboItems
      } : 'No products');
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to fetch products';
      setError(errorMessage);
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
    console.log('🔍 Editing product:', product);
    console.log('🔍 Combo fields:', {
      isCombo: product.isCombo,
      comboBasePrice: product.comboBasePrice,
      comboItems: product.comboItems
    });
    
    setSelectedProduct(product);
    setEditingProduct({
      name: product.name,
      description: product.description,
      price: product.price,
      categories: product.categories,
      stock: product.stock,
      occasions: product.occasions,
      isFeatured: product.isFeatured,
      isCombo: product.isCombo,
      comboBasePrice: product.comboBasePrice,
      comboItems: product.comboItems
    });
    
    // Initialize combo items state
    setComboItems(product.comboItems || []);
    console.log('🔍 Set combo items:', product.comboItems || []);
            // Convert existing images to the upload preview format, preserving Cloudinary IDs
        const existingImages = product.images || [];
        const formattedImages = existingImages.map((path: string) => {
          const isCloudinary = typeof path === 'string' && path.startsWith('keralagiftsonline/products/');
          const filenameOnly = typeof path === 'string' ? (path.split('/').pop() || path) : '';
          return {
            public_id: isCloudinary ? path : undefined,
            filename: filenameOnly,
            url: getProductImage(path, product.slug),
            originalName: filenameOnly
          };
        });
        setUploadedImages(formattedImages);
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

      // Validate that we have valid Cloudinary public IDs for images
      const validImages = uploadedImages.filter(img => img.public_id && img.public_id.startsWith('keralagiftsonline/products/'));
      if (uploadedImages.length > 0 && validImages.length === 0) {
        setError('Please upload valid images. All images must be uploaded to Cloudinary.');
        return;
      }

      // Ensure name and description are simple strings
      const validatedData = {
        ...editingProduct,
        name: typeof editingProduct.name === 'string' ? editingProduct.name : '',
        description: typeof editingProduct.description === 'string' ? editingProduct.description : '',
        // Ensure categories is an array of ObjectId strings
        categories: editingProduct.categories?.map(cat => typeof cat === 'string' ? cat : cat._id) || [],
        // Include images - use Cloudinary public_id only
        images: validImages.map(img => img.public_id),
        defaultImage: validImages[0]?.public_id || undefined,
        // Include combo-specific fields
        isCombo: editingProduct.isCombo || false,
        comboBasePrice: editingProduct.comboBasePrice || 0,
        comboItems: editingProduct.comboItems || []
      };

      console.log('📦 Creating new product with data:', {
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        categories: validatedData.categories,
        images: validatedData.images,
        defaultImage: validatedData.defaultImage,
        imageCount: validatedData.images?.length || 0
      });
      
      const response = await api.post('/products', validatedData);
      
      if (response.data) {
        console.log('✅ Product created successfully!', {
          productId: response.data._id,
          name: response.data.name,
          images: response.data.images,
          defaultImage: response.data.defaultImage,
          status: 'SAVED_TO_DATABASE'
        });
        
        // Refresh the products list
        await fetchProducts();
        setShowModal(false);
        setSelectedProduct(null);
        setEditingProduct({});
        setComboItems([]);
        setError(''); // Clear any previous errors
        setSuccess('Product added successfully!');
        setTimeout(() => setSuccess(''), 3000); // Clear success message after 3 seconds
      } else {
        console.error('❌ Product creation failed - no data returned');
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

      // Validate that we have valid Cloudinary public IDs for images
      const validImages = uploadedImages.filter(img => img.public_id && img.public_id.startsWith('keralagiftsonline/products/'));
      if (uploadedImages.length > 0 && validImages.length === 0) {
        setError('Please upload valid images. All images must be uploaded to Cloudinary.');
        return;
      }

              // Ensure name and description are simple strings
        const validatedData = {
          ...editingProduct,
          name: typeof editingProduct.name === 'string' ? editingProduct.name : '',
          description: typeof editingProduct.description === 'string' ? editingProduct.description : '',
          // Include images - use Cloudinary public_id only
          images: validImages.map(img => img.public_id),
          defaultImage: validImages[0]?.public_id || undefined,
          // Include combo-specific fields
          isCombo: editingProduct.isCombo || false,
          comboBasePrice: editingProduct.comboBasePrice || 0,
          comboItems: editingProduct.comboItems || []
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
        setComboItems([]);
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
    
    // Prevent multiple deletions of the same product
    if (deletingProducts.has(productId)) {
      return;
    }
    
    // Prevent deleting recently deleted products
    if (recentlyDeleted.has(productId)) {
      setError('This product was recently deleted. Please refresh the page.');
      return;
    }

    try {
      setError(''); // Clear any previous errors
      setDeletingProducts(prev => new Set(prev).add(productId));
      
      // Optimistic update - remove product from state immediately
      setProducts(prevProducts => prevProducts.filter(product => product._id !== productId));
      
      await api.delete(`/products/${productId}`);
      setSuccess('Product deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Add to recently deleted set to prevent immediate re-deletion
      setRecentlyDeleted(prev => new Set(prev).add(productId));
      setTimeout(() => {
        setRecentlyDeleted(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      }, 5000); // Remove from recently deleted after 5 seconds
      
      // Fetch fresh data to ensure consistency
      await fetchProducts();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete product';
      setError(errorMessage);
      
      // If the product was not found, refresh the products list to get the latest data
      if (err.response?.status === 404) {
        console.log('Product not found, refreshing products list...');
        await fetchProducts();
      } else {
        // If it was a different error, revert the optimistic update
        await fetchProducts();
      }
    } finally {
      setDeletingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.error('Image failed to load:', target.src);
    target.src = DEFAULT_PRODUCT_IMAGE;
  };

  const handleImageUploadSuccess = (fileData: { public_id?: string; filename: string; url: string; originalName: string }) => {
    // Validate that we have a proper Cloudinary public_id
    if (!fileData.public_id || !fileData.public_id.startsWith('keralagiftsonline/products/')) {
      setUploadError('Image upload failed: Invalid Cloudinary public ID received');
      return;
    }
    
    setUploadedImages(prev => [...prev, {
      public_id: fileData.public_id,
      filename: fileData.filename,
      url: fileData.url,
      originalName: fileData.originalName
    }]);
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

  const getCategoryNames = (productCategories: any[]) => {
    if (!productCategories || productCategories.length === 0) return 'No Categories';
    
    const categoryNames = productCategories.map(category => getCategoryName(category));
    
    if (categoryNames.length === 1) {
      return categoryNames[0];
    } else if (categoryNames.length <= 3) {
      return categoryNames.join(', ');
    } else {
      return `${categoryNames.slice(0, 2).join(', ')} +${categoryNames.length - 2} more`;
    }
  };

  const getOccasionNames = (productOccasions: string[]) => {
    if (!productOccasions || productOccasions.length === 0) return 'No Occasions';
    
    const occasionNames = productOccasions.map(occasion => occasion.replace('_', ' '));
    
    if (occasionNames.length === 1) {
      return occasionNames[0];
    } else if (occasionNames.length <= 3) {
      return occasionNames.join(', ');
    } else {
      return `${occasionNames.slice(0, 2).join(', ')} +${occasionNames.length - 2} more`;
    }
  };

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }

    const query = searchQuery.toLowerCase().trim();
    return products.filter(product => {
      // Search in product name
      const name = getMultilingualText(product.name).toLowerCase();
      if (name.includes(query)) return true;

      // Search in product description
      const description = getMultilingualText(product.description).toLowerCase();
      if (description.includes(query)) return true;

      // Search in categories (handle products with no categories)
      const categoryNames = getCategoryNames(product.categories || []).toLowerCase();
      if (categoryNames.includes(query)) return true;

      // Search in occasions (handle products with no occasions)
      const occasionNames = getOccasionNames(product.occasions || []).toLowerCase();
      if (occasionNames.includes(query)) return true;

      // Search in price
      const price = product.price?.toString() || '';
      if (price.includes(query)) return true;

      return false;
    });
  }, [products, searchQuery]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (!user || !tokens?.accessToken) {
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
    <div className="flex gap-6">
      {/* Left Sidebar - CRUD Operations */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Management</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setSelectedProduct(null);
                setEditingProduct({
                  stock: 200, // Set default stock to 200
                  isCombo: false,
                  comboBasePrice: 0,
                  comboItems: []
                });
                setComboItems([]);
                setUploadedImages([]);
                setUploadError('');
                setShowModal(true);
              }}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Add New Product
            </button>
            
            <button
              onClick={clearCacheAndRefresh}
              disabled={loading}
              className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Refreshing...
                </div>
              ) : (
                '🔄 Refresh Products'
              )}
            </button>
            
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={debugProducts}
                className="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                🐛 Debug Products
              </button>
            )}
          </div>
          
          {/* Product Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Product Actions</h4>
            
            {/* Product Selection Dropdown */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Select Product to Edit/Delete:
              </label>
              <select
                value={selectedProductId || ''}
                onChange={(e) => setSelectedProductId(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a product...</option>
                {filteredProducts.map((product) => (
                  <option 
                    key={product._id} 
                    value={product._id}
                    disabled={deletingProducts.has(product._id) || recentlyDeleted.has(product._id)}
                  >
                    {getMultilingualText(product.name)} - ₹{product.price?.toFixed(2) || '0.00'}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Product Info */}
            {selectedProductId && (() => {
              const product = filteredProducts.find(p => p._id === selectedProductId);
              if (!product) return null;
              
              return (
                <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {getMultilingualText(product.name)}
                  </div>
                  <div className="text-xs text-gray-600">
                    ₹{product.price?.toFixed(2) || '0.00'} • Stock: {product.stock || 0} • {product.isFeatured ? 'Featured' : 'Regular'}
                  </div>
                </div>
              );
            })()}
            
            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  const product = filteredProducts.find(p => p._id === selectedProductId);
                  if (product) {
                    handleEditProduct(product);
                  }
                }}
                disabled={Boolean(!selectedProductId || (selectedProductId && (deletingProducts.has(selectedProductId) || recentlyDeleted.has(selectedProductId))))}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  Boolean(!selectedProductId || (selectedProductId && (deletingProducts.has(selectedProductId) || recentlyDeleted.has(selectedProductId))))
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                ✏️ Edit Selected Product
              </button>
              
              <button
                onClick={() => {
                  if (selectedProductId) {
                    handleDeleteProduct(selectedProductId);
                    setSelectedProductId(null);
                  }
                }}
                disabled={Boolean(!selectedProductId || (selectedProductId && (deletingProducts.has(selectedProductId) || recentlyDeleted.has(selectedProductId))))}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  !selectedProductId
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : selectedProductId && deletingProducts.has(selectedProductId)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : selectedProductId && recentlyDeleted.has(selectedProductId)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {!selectedProductId
                  ? '🗑️ Select Product to Delete'
                  : selectedProductId && deletingProducts.has(selectedProductId)
                  ? '🗑️ Deleting...'
                  : selectedProductId && recentlyDeleted.has(selectedProductId)
                  ? '🗑️ Deleted'
                  : '🗑️ Delete Selected Product'
                }
              </button>
              
              {selectedProductId && (
                <button
                  onClick={() => setSelectedProductId(null)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  ✕ Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Products:</span>
                <span className="font-medium">{products.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Featured:</span>
                <span className="font-medium">{products.filter(p => p.isFeatured).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">In Stock:</span>
                <span className="font-medium">{products.filter(p => (p.stock || 0) > 0).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Products List</h2>
            <p className="text-sm text-gray-600 mt-1">Click on any product row to select it, or use the dropdown in the sidebar</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search products by name, description, categories, occasions, or price..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
              {filteredProducts.length === 0 && (
                <span className="text-red-600 ml-2">• No products match your search</span>
              )}
            </div>
          )}
        </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700 ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-green-800 font-medium">Success</p>
              <p className="text-green-700 mt-1">{success}</p>
            </div>
            <button
              onClick={() => setSuccess('')}
              className="text-green-500 hover:text-green-700 ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Categories
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Occasions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts && filteredProducts.length > 0 ? filteredProducts.map((product) => {
                // Use cached image for each product
                const imageUrl = getCachedImageUrl(product);

                const isSelected = selectedProductId === product._id;
                const isDisabled = deletingProducts.has(product._id) || recentlyDeleted.has(product._id);
                
                return (
                  <tr 
                    key={product._id} 
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'bg-blue-50 border-l-4 border-blue-500 shadow-sm' 
                        : isDisabled
                        ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                        : 'hover:bg-gray-50 hover:shadow-sm'
                    }`}
                    onClick={() => {
                      if (!isDisabled) {
                        setSelectedProductId(isSelected ? null : product._id);
                      }
                    }}
                    title={isDisabled ? 'Product is being processed' : isSelected ? 'Click to deselect' : 'Click to select this product'}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={imageUrl}
                            alt={getMultilingualText(product.name)}
                            onError={handleImageError}
                            style={{ opacity: 1 }} // No opacity change needed for preloaded images
                          />
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {getMultilingualText(product.name)}
                          </div>
                          <div className="text-xs text-gray-500 break-words whitespace-normal leading-relaxed max-w-xs">
                            {getMultilingualText(product.description)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        {getCategoryNames(product.categories || [])}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        {getOccasionNames(product.occasions || [])}
                      </div>
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
                  setComboItems([]);
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
                    step="1"
                    min="0"
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      price: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={editingProduct.stock || 200}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      stock: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories (Select multiple)
                </label>
                <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50">
                  {categories && categories.length > 0 ? (
                    <div className="space-y-2">
                      {categories.map((category) => {
                        const isSelected = editingProduct.categories?.some(catId => 
                          typeof catId === 'string' ? catId === category._id : catId._id === category._id
                        );
                        
                        return (
                          <label key={category._id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={isSelected || false}
                              onChange={(e) => {
                                const categoryId = category._id;
                                let newCategories = [...(editingProduct.categories || [])];
                                
                                if (e.target.checked) {
                                  // Add category if not already present
                                  if (!newCategories.some(catId => 
                                    typeof catId === 'string' ? catId === categoryId : catId._id === categoryId
                                  )) {
                                    newCategories.push(categoryId);
                                  }
                                } else {
                                  // Remove category
                                  newCategories = newCategories.filter(catId => 
                                    typeof catId === 'string' ? catId !== categoryId : catId._id !== categoryId
                                  );
                                }
                                
                                setEditingProduct({
                                  ...editingProduct,
                                  categories: newCategories
                                });
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {getMultilingualText(category.name)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No categories available</p>
                  )}
                </div>
                {editingProduct.categories && editingProduct.categories.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {editingProduct.categories.length} category{editingProduct.categories.length > 1 ? 'ies' : 'y'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occasions (Optional - Select multiple)
                </label>
                <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'DIWALI', 'ANNIVERSARY', 'BIRTHDAY', 'CONDOLENCES', 'CONGRATULATION',
                      'FATHERS DAY', 'GET WELL SOON', 'HOUSE WARMING', 'JUST BECAUSE',
                      'MISS YOU', 'NEW BORN', 'ONAM', 'SYMPATHY', 'THANK YOU',
                      'TRADITIONAL', 'WEDDING'
                    ].map((occasion) => {
                      const isSelected = editingProduct.occasions?.includes(occasion) || false;
                      
                      return (
                        <label key={occasion} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              let newOccasions = [...(editingProduct.occasions || [])];
                              
                              if (e.target.checked) {
                                // Add occasion if not already present
                                if (!newOccasions.includes(occasion)) {
                                  newOccasions.push(occasion);
                                }
                              } else {
                                // Remove occasion
                                newOccasions = newOccasions.filter(occ => occ !== occasion);
                              }
                              
                              setEditingProduct({
                                ...editingProduct,
                                occasions: newOccasions
                              });
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {occasion.replace('_', ' ')}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                {editingProduct.occasions && editingProduct.occasions.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {editingProduct.occasions.length} occasion{editingProduct.occasions.length > 1 ? 's' : ''}
                  </p>
                )}
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

              {/* Combo Product Section */}
              <div className="border-t pt-4">
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingProduct.isCombo || false}
                      onChange={(e) => {
                        const isCombo = e.target.checked;
                        setEditingProduct({
                          ...editingProduct,
                          isCombo,
                          comboBasePrice: isCombo ? (editingProduct.comboBasePrice || 0) : 0,
                          comboItems: isCombo ? (editingProduct.comboItems || []) : []
                        });
                        if (!isCombo) {
                          setComboItems([]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Combo Product</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Enable this to create a combo product with multiple items and customizable quantities
                  </p>
                </div>

                {editingProduct.isCombo && (
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Combo Base Price (₹)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={editingProduct.comboBasePrice || ''}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          comboBasePrice: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 5000"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Base price for the combo (additional items will be added to this)
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Combo Items
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newItem: ComboItem = {
                              name: '',
                              unitPrice: 0,
                              defaultQuantity: 1,
                              unit: 'piece'
                            };
                            const newComboItems = [...comboItems, newItem];
                            setComboItems(newComboItems);
                            setEditingProduct({
                              ...editingProduct,
                              comboItems: newComboItems
                            });
                          }}
                          className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          + Add Item
                        </button>
                      </div>

                      {comboItems.map((item, index) => (
                        <div key={index} className="bg-white p-3 rounded border mb-3">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Item Name
                              </label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  const newComboItems = [...comboItems];
                                  newComboItems[index].name = e.target.value;
                                  setComboItems(newComboItems);
                                  setEditingProduct({
                                    ...editingProduct,
                                    comboItems: newComboItems
                                  });
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                placeholder="e.g., Birthday Cake"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Unit
                              </label>
                              <select
                                value={item.unit}
                                onChange={(e) => {
                                  const newComboItems = [...comboItems];
                                  newComboItems[index].unit = e.target.value;
                                  setComboItems(newComboItems);
                                  setEditingProduct({
                                    ...editingProduct,
                                    comboItems: newComboItems
                                  });
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="piece">Piece</option>
                                <option value="kg">Kilogram</option>
                                <option value="set">Set</option>
                                <option value="dozen">Dozen</option>
                                <option value="gram">Gram</option>
                                <option value="liter">Liter</option>
                                <option value="box">Box</option>
                                <option value="pack">Pack</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Unit Price (₹)
                              </label>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => {
                                  const newComboItems = [...comboItems];
                                  newComboItems[index].unitPrice = parseInt(e.target.value) || 0;
                                  setComboItems(newComboItems);
                                  setEditingProduct({
                                    ...editingProduct,
                                    comboItems: newComboItems
                                  });
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                placeholder="e.g., 1000"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Default Quantity
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={item.defaultQuantity}
                                onChange={(e) => {
                                  const newComboItems = [...comboItems];
                                  newComboItems[index].defaultQuantity = parseFloat(e.target.value) || 0;
                                  setComboItems(newComboItems);
                                  setEditingProduct({
                                    ...editingProduct,
                                    comboItems: newComboItems
                                  });
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                placeholder="e.g., 1"
                              />
                            </div>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const newComboItems = comboItems.filter((_, i) => i !== index);
                                setComboItems(newComboItems);
                                setEditingProduct({
                                  ...editingProduct,
                                  comboItems: newComboItems
                                });
                              }}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove Item
                            </button>
                          </div>
                        </div>
                      ))}

                      {comboItems.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No combo items added yet. Click "Add Item" to get started.
                        </p>
                      )}
                    </div>
                  </div>
                )}
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
                      {uploadedImages.map((imageData, index) => (
                        <div key={index} className="relative">
                          <img
                            src={imageData.url}
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
                  setComboItems([]);
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