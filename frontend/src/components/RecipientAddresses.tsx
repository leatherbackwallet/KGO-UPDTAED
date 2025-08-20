import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface RecipientAddress {
  name: string;
  phone: string;
  address: {
    streetName: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    countryCode: string;
  };
  additionalInstructions?: string;
  isDefault: boolean;
}

interface RecipientAddressesProps {
  onAddressSelect?: (address: RecipientAddress) => void;
  selectedAddress?: RecipientAddress | null;
  showAddButton?: boolean;
  className?: string;
}

export default function RecipientAddresses({ 
  onAddressSelect, 
  selectedAddress, 
  showAddButton = true,
  className = '' 
}: RecipientAddressesProps) {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<RecipientAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    streetName: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    countryCode: 'DE',
    additionalInstructions: '',
    isDefault: false
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profile/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddresses(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingIndex !== null) {
        // Update existing address
        await api.put(`/profile/addresses/${editingIndex}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEditingIndex(null);
      } else {
        // Add new address
        await api.post('/profile/addresses', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Reset form and refresh addresses
      setFormData({
        name: '',
        phone: '',
        streetName: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        countryCode: 'DE',
        additionalInstructions: '',
        isDefault: false
      });
      setShowAddForm(false);
      fetchAddresses();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save address');
    }
  };

  const handleEdit = (index: number) => {
    const address = addresses[index];
    setFormData({
      name: address.name,
      phone: address.phone,
      streetName: address.address.streetName,
      houseNumber: address.address.houseNumber,
      postalCode: address.address.postalCode,
      city: address.address.city,
      countryCode: address.address.countryCode,
      additionalInstructions: address.additionalInstructions || '',
      isDefault: address.isDefault
    });
    setEditingIndex(index);
    setShowAddForm(true);
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      await api.delete(`/profile/addresses/${index}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAddresses();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete address');
    }
  };

  const handleAddressSelect = (address: RecipientAddress) => {
    if (onAddressSelect) {
      onAddressSelect(address);
    }
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingIndex(null);
    setFormData({
      name: '',
      phone: '',
      streetName: '',
      houseNumber: '',
      postalCode: '',
      city: '',
      countryCode: 'DE',
      additionalInstructions: '',
      isDefault: false
    });
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Recipient Addresses</h3>
        {showAddButton && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Add New Address
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            {editingIndex !== null ? 'Edit Address' : 'Add New Address'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Name *
                </label>
                <input
                  type="text"
                  value={formData.streetName}
                  onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  House Number *
                </label>
                <input
                  type="text"
                  value={formData.houseNumber}
                  onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="12345"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="IN">India</option>
                  <option value="AT">Austria</option>
                  <option value="CH">Switzerland</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Instructions
              </label>
              <textarea
                value={formData.additionalInstructions}
                onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Any special delivery instructions, building access codes, or notes for the delivery person..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.additionalInstructions.length}/500 characters
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                Set as default address
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingIndex !== null ? 'Update Address' : 'Add Address'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses List */}
      {addresses.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-500">No recipient addresses saved yet</p>
          {showAddButton && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Add your first address
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedAddress === address
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleAddressSelect(address)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{address.name}</h4>
                    {address.isDefault && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{address.phone}</p>
                  <p className="text-sm text-gray-700">
                    {address.address.streetName} {address.address.houseNumber}
                  </p>
                  <p className="text-sm text-gray-700">
                    {address.address.postalCode} {address.address.city}, {address.address.countryCode}
                  </p>
                  {address.additionalInstructions && (
                    <p className="text-sm text-gray-600 mt-1 italic">
                      📝 {address.additionalInstructions}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(index);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(index);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 