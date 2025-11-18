/**
 * AdminCategories Component
 * Complete CRUD interface for managing product categories
 * Features: Create, Read, Update, Delete categories with product assignment
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AdminLayout from './AdminLayout';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentCategory?: {
    _id: string;
    name: string;
    slug: string;
  };
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images?: string[];
  defaultImage?: string;
  isFeatured: boolean;
}

interface CategoryFormData {
  name: string;
  description: string;
  parentCategory: string;
  sortOrder: number;
}

export default function AdminCategories() {
  const { tokens } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showProductAssignment, setShowProductAssignment] = useState<Category | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryProducts, setCategoryProducts] = useState<{[categoryId: string]: Product[]}>({});
  const [loadingProducts, setLoadingProducts] = useState<{[categoryId: string]: boolean}>({});
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parentCategory: '',
    sortOrder: 0
  });

  // Memoize fetch functions to prevent infinite loops
  const fetchCategories = React.useCallback(async () => {
    if (!tokens?.accessToken) return;
    
    try {
      setLoading(true);
      setError(null);
      // Use dedicated admin categories endpoint - always MongoDB
      const response = await api.get(`/admin/categories?includeInactive=true&_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` }
      });
      console.log('🔍 Fetched admin categories data from MongoDB:', response.data);
      setCategories(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching admin categories:', err);
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, [tokens?.accessToken]);

  const fetchProducts = React.useCallback(async () => {
    try {
      const response = await api.get('/products', {
        params: {
          admin: true, // Bypass pagination limits
          includeDeleted: false // Only get active products
        }
      });
      setProducts(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
    }
  }, []);

  useEffect(() => {
    if (tokens?.accessToken) {
      fetchCategories();
      fetchProducts();
    }
  }, [tokens?.accessToken, fetchCategories, fetchProducts]);

  const fetchCategoryProducts = async (categoryId: string) => {
    try {
      setLoadingProducts(prev => ({ ...prev, [categoryId]: true }));
      const response = await api.get(`/admin/categories/${categoryId}/products`, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` }
      });
      setCategoryProducts(prev => ({ 
        ...prev, 
        [categoryId]: response.data.data || [] 
      }));
    } catch (err: any) {
      console.error('Error fetching category products:', err);
      setCategoryProducts(prev => ({ 
        ...prev, 
        [categoryId]: [] 
      }));
    } finally {
      setLoadingProducts(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const payload = {
        ...formData,
        parentCategory: formData.parentCategory || undefined
      };

      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory._id}`, payload, {
          headers: { Authorization: `Bearer ${tokens?.accessToken}` }
        });
      } else {
        await api.post('/admin/categories', payload, {
          headers: { Authorization: `Bearer ${tokens?.accessToken}` }
        });
      }

      await fetchCategories();
      resetForm();
    } catch (err: any) {
      console.error('Error saving category:', err);
      setError(err.response?.data?.error?.message || 'Failed to save category');
    }
  };

  const clearCacheAndRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use dedicated admin categories endpoint - always MongoDB
      const response = await api.get(`/admin/categories?includeInactive=true&_t=${Date.now()}&_refresh=${Math.random()}`, {
        headers: { 
          Authorization: `Bearer ${tokens?.accessToken}`
        }
      });
      console.log('🔄 Refreshed admin categories data from MongoDB:', response.data);
      setCategories(response.data.data || []);
    } catch (err: any) {
      console.error('Error refreshing admin categories:', err);
      setError('Failed to refresh categories');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentCategory: category.parentCategory?._id || '',
      sortOrder: category.sortOrder
    });
    setShowForm(true);
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;

    try {
      await api.delete(`/admin/categories/${category._id}`, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` }
      });
      await fetchCategories();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError(err.response?.data?.error?.message || 'Failed to delete category');
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await api.put(`/admin/categories/${category._id}`, 
        { isActive: !category.isActive },
        { headers: { Authorization: `Bearer ${tokens?.accessToken}` } }
      );
      await fetchCategories();
    } catch (err: any) {
      console.error('Error toggling category status:', err);
      setError(err.response?.data?.error?.message || 'Failed to update category');
    }
  };

  const handleAssignProducts = async () => {
    if (!showProductAssignment || selectedProducts.length === 0) return;

    try {
      await api.put(`/admin/categories/${showProductAssignment._id}/products`, 
        { productIds: selectedProducts },
        { headers: { Authorization: `Bearer ${tokens?.accessToken}` } }
      );
      setShowProductAssignment(null);
      setSelectedProducts([]);
      await fetchCategories();
      // Refresh the category products for the assigned category
      await fetchCategoryProducts(showProductAssignment._id);
    } catch (err: any) {
      console.error('Error assigning products:', err);
      setError(err.response?.data?.error?.message || 'Failed to assign products');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parentCategory: '',
      sortOrder: 0
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const getCategoryPath = (category: Category): string => {
    if (category.parentCategory) {
      return `${category.parentCategory.name} > ${category.name}`;
    }
    return category.name;
  };

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }

    const query = searchQuery.toLowerCase();
    return categories.filter(category => {
      // Search in category name
      if (category.name.toLowerCase().includes(query)) return true;
      
      // Search in description
      if (category.description?.toLowerCase().includes(query)) return true;
      
      // Search in slug
      if (category.slug.toLowerCase().includes(query)) return true;
      
      // Search in parent category name
      if (category.parentCategory?.name.toLowerCase().includes(query)) return true;
      
      // Search in full path
      if (getCategoryPath(category).toLowerCase().includes(query)) return true;

      return false;
    });
  }, [categories, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Left Sidebar - CRUD Operations */}
      <div className="w-72 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Management</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setEditingCategory(null);
                setFormData({
                  name: '',
                  description: '',
                  parentCategory: '',
                  sortOrder: 0
                });
                setShowForm(true);
              }}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Add New Category
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
                '🔄 Refresh Categories'
              )}
            </button>
          </div>
          
          {/* Category Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Category Actions</h4>
            
            {/* Category Selection Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Category
              </label>
              <select
                value={editingCategory?._id || ''}
                onChange={(e) => {
                  const category = categories.find(c => c._id === e.target.value);
                  if (category) {
                    handleEdit(category);
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a category to edit...</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {getCategoryPath(category)}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (editingCategory) {
                    setShowForm(true);
                  }
                }}
                disabled={!editingCategory}
                className="w-full bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                ✏️ Edit Selected
              </button>
              
              <button
                onClick={() => {
                  if (editingCategory) {
                    setShowProductAssignment(editingCategory);
                  }
                }}
                disabled={!editingCategory}
                className="w-full bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                📦 Assign Products
              </button>
              
              <button
                onClick={() => {
                  if (editingCategory) {
                    handleToggleActive(editingCategory);
                  }
                }}
                disabled={!editingCategory}
                className={`w-full px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium ${
                  editingCategory?.isActive 
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {editingCategory?.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
              </button>
              
              <button
                onClick={() => {
                  if (editingCategory) {
                    handleDelete(editingCategory);
                  }
                }}
                disabled={!editingCategory}
                className="w-full bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
          
          {/* Category Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Statistics</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Total Categories:</span>
                <span className="font-medium">{categories.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active:</span>
                <span className="font-medium text-green-600">
                  {categories.filter(c => c.isActive).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Inactive:</span>
                <span className="font-medium text-red-600">
                  {categories.filter(c => !c.isActive).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Root Categories:</span>
                <span className="font-medium">
                  {categories.filter(c => !c.parentCategory).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600">
              Showing {filteredCategories.length} of {categories.length} categories
              {filteredCategories.length === 0 && (
                <span className="text-red-600 ml-2">• No categories match your search</span>
              )}
            </div>
          )}
        </div>

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  value={formData.parentCategory}
                  onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No parent (root category)</option>
                  {categories
                    .filter(cat => !cat.parentCategory && cat._id !== editingCategory?._id)
                    .map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Assignment Modal */}
      {showProductAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Assign Products to "{showProductAssignment.name}"
            </h3>
            
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                {products.map(product => (
                  <label key={product._id} className="flex items-center p-3 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, product._id]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(id => id !== product._id));
                        }
                      }}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">₹{product.price}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowProductAssignment(null);
                    setSelectedProducts([]);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignProducts}
                  disabled={selectedProducts.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign {selectedProducts.length} Products
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-96">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Sort Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Products
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category) => {
                  const isSelected = editingCategory?._id === category._id;
                  
                  return (
                    <tr 
                      key={category._id} 
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'bg-blue-50 border-l-4 border-blue-500 shadow-sm' 
                          : !category.isActive
                          ? 'bg-gray-100 opacity-60'
                          : 'hover:bg-gray-50 hover:shadow-sm'
                      }`}
                      onClick={() => {
                        setEditingCategory(isSelected ? null : category);
                        // Load products for this category when selected
                        if (!isSelected && !categoryProducts[category._id]) {
                          fetchCategoryProducts(category._id);
                        }
                      }}
                      title={isSelected ? 'Click to deselect' : 'Click to select this category'}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-start">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {getCategoryPath(category)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 truncate">{category.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {category.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {category.sortOrder}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          category.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          {loadingProducts[category._id] ? (
                            <div className="flex items-center text-sm text-gray-500">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                              Loading...
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">
                                {categoryProducts[category._id]?.length || 0} products
                              </span>
                              {categoryProducts[category._id] && categoryProducts[category._id].length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowProductAssignment(category);
                                    setSelectedProducts(categoryProducts[category._id].map(p => p._id));
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                  View
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No categories found</div>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-900"
              >
                Create your first category
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
