/**
 * AdminOccasions Component
 * Complete CRUD interface for managing occasions with date ranges and seasonal prioritization
 * Features: Create, Read, Update, Delete occasions with advanced date range management
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

interface Occasion {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  dateRange: {
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
    isRecurring: boolean;
    specificYear?: number;
  };
  priority: {
    level: 'low' | 'medium' | 'high' | 'peak';
    boostMultiplier: number;
  };
  seasonalFlags: {
    isFestival: boolean;
    isHoliday: boolean;
    isPersonal: boolean;
    isSeasonal: boolean;
  };
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isCurrentlyActive?: boolean;
}

interface OccasionFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  dateRange: {
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
    isRecurring: boolean;
    specificYear?: number;
  };
  priority: {
    level: 'low' | 'medium' | 'high' | 'peak';
    boostMultiplier: number;
  };
  seasonalFlags: {
    isFestival: boolean;
    isHoliday: boolean;
    isPersonal: boolean;
    isSeasonal: boolean;
  };
  sortOrder: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'peak', label: 'Peak', color: 'bg-red-100 text-red-800' }
];

export default function AdminOccasions() {
  const { tokens } = useAuth();
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOccasion, setEditingOccasion] = useState<Occasion | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<OccasionFormData>({
    name: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    dateRange: {
      startMonth: 1,
      startDay: 1,
      endMonth: 1,
      endDay: 1,
      isRecurring: true
    },
    priority: {
      level: 'medium',
      boostMultiplier: 1.5
    },
    seasonalFlags: {
      isFestival: false,
      isHoliday: false,
      isPersonal: false,
      isSeasonal: false
    },
    sortOrder: 0
  });

  useEffect(() => {
    if (tokens?.accessToken) {
      fetchOccasions();
    }
  }, [tokens]);

  const fetchOccasions = async () => {
    try {
      const response = await api.get('/occasions?includeInactive=true', {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` }
      });
      setOccasions(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching occasions:', err);
      setError('Failed to fetch occasions');
    } finally {
      setLoading(false);
    }
  };

  const seedOccasions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/occasions/seed', {}, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` }
      });
      
      if (response.data.success) {
        setOccasions(response.data.data || []);
        alert(`Successfully created ${response.data.count} occasions!`);
      }
    } catch (err: any) {
      console.error('Error seeding occasions:', err);
      setError(err.response?.data?.error?.message || 'Failed to seed occasions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const payload = {
        ...formData,
        dateRange: {
          ...formData.dateRange,
          specificYear: formData.dateRange.isRecurring ? undefined : formData.dateRange.specificYear
        }
      };

      if (editingOccasion) {
        await api.put(`/occasions/${editingOccasion._id}`, payload, {
          headers: { Authorization: `Bearer ${tokens?.accessToken}` }
        });
      } else {
        await api.post('/occasions', payload, {
          headers: { Authorization: `Bearer ${tokens?.accessToken}` }
        });
      }

      await fetchOccasions();
      resetForm();
    } catch (err: any) {
      console.error('Error saving occasion:', err);
      setError(err.response?.data?.error?.message || 'Failed to save occasion');
    }
  };

  const handleEdit = (occasion: Occasion) => {
    setEditingOccasion(occasion);
    setFormData({
      name: occasion.name,
      description: occasion.description || '',
      icon: occasion.icon || '',
      color: occasion.color || '#3B82F6',
      dateRange: {
        startMonth: occasion.dateRange.startMonth,
        startDay: occasion.dateRange.startDay,
        endMonth: occasion.dateRange.endMonth,
        endDay: occasion.dateRange.endDay,
        isRecurring: occasion.dateRange.isRecurring,
        specificYear: occasion.dateRange.specificYear
      },
      priority: {
        level: occasion.priority.level,
        boostMultiplier: occasion.priority.boostMultiplier
      },
      seasonalFlags: {
        isFestival: occasion.seasonalFlags.isFestival,
        isHoliday: occasion.seasonalFlags.isHoliday,
        isPersonal: occasion.seasonalFlags.isPersonal,
        isSeasonal: occasion.seasonalFlags.isSeasonal
      },
      sortOrder: occasion.sortOrder
    });
    setShowForm(true);
  };

  const handleDelete = async (occasion: Occasion) => {
    if (!confirm(`Are you sure you want to delete "${occasion.name}"?`)) return;

    try {
      await api.delete(`/occasions/${occasion._id}`, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` }
      });
      await fetchOccasions();
    } catch (err: any) {
      console.error('Error deleting occasion:', err);
      setError(err.response?.data?.error?.message || 'Failed to delete occasion');
    }
  };

  const handleToggleActive = async (occasion: Occasion) => {
    try {
      await api.put(`/occasions/${occasion._id}`, 
        { isActive: !occasion.isActive },
        { headers: { Authorization: `Bearer ${tokens?.accessToken}` } }
      );
      await fetchOccasions();
    } catch (err: any) {
      console.error('Error toggling occasion status:', err);
      setError(err.response?.data?.error?.message || 'Failed to update occasion');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      color: '#3B82F6',
      dateRange: {
        startMonth: 1,
        startDay: 1,
        endMonth: 1,
        endDay: 1,
        isRecurring: true
      },
      priority: {
        level: 'medium',
        boostMultiplier: 1.5
      },
      seasonalFlags: {
        isFestival: false,
        isHoliday: false,
        isPersonal: false,
        isSeasonal: false
      },
      sortOrder: 0
    });
    setEditingOccasion(null);
    setShowForm(false);
  };

  const getDaysInMonth = (month: number) => {
    return new Date(2024, month, 0).getDate();
  };

  const formatDateRange = (occasion: Occasion): string => {
    const { startMonth, startDay, endMonth, endDay, isRecurring, specificYear } = occasion.dateRange;
    const year = specificYear ? ` ${specificYear}` : '';
    const recurring = isRecurring ? ' (Annual)' : '';
    
    if (startMonth === endMonth && startDay === endDay) {
      return `${MONTHS[startMonth - 1]} ${startDay}${year}${recurring}`;
    }
    
    if (startMonth === endMonth) {
      return `${MONTHS[startMonth - 1]} ${startDay}-${endDay}${year}${recurring}`;
    }
    
    return `${MONTHS[startMonth - 1]} ${startDay} - ${MONTHS[endMonth - 1]} ${endDay}${year}${recurring}`;
  };

  const isCurrentlyActive = (occasion: Occasion): boolean => {
    const now = new Date();
    const { startMonth, startDay, endMonth, endDay, isRecurring, specificYear } = occasion.dateRange;
    
    if (!isRecurring && specificYear && now.getFullYear() !== specificYear) {
      return false;
    }
    
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    
    const year = specificYear || now.getFullYear();
    const startDate = new Date(year, startMonth - 1, startDay);
    const endDate = new Date(year, endMonth - 1, endDay);
    
    if (endDate < startDate) {
      endDate.setFullYear(year + 1);
    }
    
    const current = new Date(year, currentMonth - 1, currentDay);
    
    return current >= startDate && current <= endDate;
  };

  // Filter occasions based on search query
  const filteredOccasions = useMemo(() => {
    if (!searchQuery.trim()) {
      return occasions;
    }

    const query = searchQuery.toLowerCase();
    return occasions.filter(occasion => {
      // Search in occasion name
      if (occasion.name.toLowerCase().includes(query)) return true;
      
      // Search in description
      if (occasion.description?.toLowerCase().includes(query)) return true;
      
      // Search in slug
      if (occasion.slug.toLowerCase().includes(query)) return true;
      
      // Search in seasonal flags
      if (occasion.seasonalFlags.isFestival && 'festival'.includes(query)) return true;
      if (occasion.seasonalFlags.isHoliday && 'holiday'.includes(query)) return true;
      if (occasion.seasonalFlags.isPersonal && 'personal'.includes(query)) return true;
      if (occasion.seasonalFlags.isSeasonal && 'seasonal'.includes(query)) return true;
      
      // Search in priority level
      if (occasion.priority.level.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [occasions, searchQuery]);

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
      <div className="w-80 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Occasion Management</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setEditingOccasion(null);
                setFormData({
                  name: '',
                  description: '',
                  icon: '',
                  color: '#3B82F6',
                  dateRange: {
                    startMonth: 1,
                    startDay: 1,
                    endMonth: 1,
                    endDay: 1,
                    isRecurring: true
                  },
                  priority: {
                    level: 'medium',
                    boostMultiplier: 1.5
                  },
                  seasonalFlags: {
                    isFestival: false,
                    isHoliday: false,
                    isPersonal: false,
                    isSeasonal: false
                  },
                  sortOrder: 0
                });
                setShowForm(true);
              }}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Add New Occasion
            </button>
            
            <button
              onClick={fetchOccasions}
              disabled={loading}
              className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Refreshing...
                </div>
              ) : (
                '🔄 Refresh Occasions'
              )}
            </button>
            
            {occasions.length === 0 && (
              <button
                onClick={seedOccasions}
                disabled={loading}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                🌱 Seed Predefined Occasions
              </button>
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Occasions:</span>
                <span className="font-medium">{occasions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active:</span>
                <span className="font-medium">{occasions.filter(o => o.isActive).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Currently Active:</span>
                <span className="font-medium">{occasions.filter(o => isCurrentlyActive(o)).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Peak Priority:</span>
                <span className="font-medium">{occasions.filter(o => o.priority.level === 'peak').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Occasions List</h2>
            <p className="text-sm text-gray-600 mt-1">Manage occasions with date ranges and seasonal prioritization</p>
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
                  placeholder="Search occasions by name, description, or type..."
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
              Showing {filteredOccasions.length} of {occasions.length} occasions
              {filteredOccasions.length === 0 && (
                <span className="text-red-600 ml-2">• No occasions match your search</span>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

      {/* Occasion Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingOccasion ? 'Edit Occasion' : 'Add New Occasion'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occasion Name *
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
                    Icon (Emoji or Icon Name)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="🎂 or cake"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
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
              </div>

              {/* Date Range */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Date Range</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={formData.dateRange.startMonth}
                        onChange={(e) => setFormData({
                          ...formData,
                          dateRange: { ...formData.dateRange, startMonth: parseInt(e.target.value) }
                        })}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {MONTHS.map((month, index) => (
                          <option key={index} value={index + 1}>{month}</option>
                        ))}
                      </select>
                      <select
                        value={formData.dateRange.startDay}
                        onChange={(e) => setFormData({
                          ...formData,
                          dateRange: { ...formData.dateRange, startDay: parseInt(e.target.value) }
                        })}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {Array.from({ length: getDaysInMonth(formData.dateRange.startMonth) }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={formData.dateRange.endMonth}
                        onChange={(e) => setFormData({
                          ...formData,
                          dateRange: { ...formData.dateRange, endMonth: parseInt(e.target.value) }
                        })}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {MONTHS.map((month, index) => (
                          <option key={index} value={index + 1}>{month}</option>
                        ))}
                      </select>
                      <select
                        value={formData.dateRange.endDay}
                        onChange={(e) => setFormData({
                          ...formData,
                          dateRange: { ...formData.dateRange, endDay: parseInt(e.target.value) }
                        })}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {Array.from({ length: getDaysInMonth(formData.dateRange.endMonth) }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.dateRange.isRecurring}
                      onChange={(e) => setFormData({
                        ...formData,
                        dateRange: { ...formData.dateRange, isRecurring: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Recurring (Annual)</span>
                  </label>
                </div>

                {!formData.dateRange.isRecurring && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specific Year
                    </label>
                    <input
                      type="number"
                      value={formData.dateRange.specificYear || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        dateRange: { ...formData.dateRange, specificYear: parseInt(e.target.value) || undefined }
                      })}
                      min="2020"
                      max="2030"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Priority Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority Level
                    </label>
                    <select
                      value={formData.priority.level}
                      onChange={(e) => setFormData({
                        ...formData,
                        priority: { ...formData.priority, level: e.target.value as any }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {PRIORITY_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Boost Multiplier (1.0 - 3.0)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="3.0"
                      value={formData.priority.boostMultiplier}
                      onChange={(e) => setFormData({
                        ...formData,
                        priority: { ...formData.priority, boostMultiplier: parseFloat(e.target.value) || 1.0 }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Seasonal Flags */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Seasonal Flags</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(formData.seasonalFlags).map(([key, value]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setFormData({
                          ...formData,
                          seasonalFlags: { ...formData.seasonalFlags, [key]: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{key.replace('is', '')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
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
                  {editingOccasion ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* Occasions List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Occasion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
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
                {filteredOccasions.map((occasion) => (
                  <tr key={occasion._id} className={!occasion.isActive ? 'opacity-60' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {occasion.icon && (
                          <span className="text-2xl mr-3">{occasion.icon}</span>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {occasion.name}
                            {isCurrentlyActive(occasion) && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active Now
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{occasion.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateRange(occasion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        PRIORITY_LEVELS.find(p => p.value === occasion.priority.level)?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        {occasion.priority.level} ({occasion.priority.boostMultiplier}x)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {occasion.seasonalFlags.isFestival && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            Festival
                          </span>
                        )}
                        {occasion.seasonalFlags.isHoliday && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            Holiday
                          </span>
                        )}
                        {occasion.seasonalFlags.isPersonal && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-pink-100 text-pink-800 rounded-full">
                            Personal
                          </span>
                        )}
                        {occasion.seasonalFlags.isSeasonal && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Seasonal
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        occasion.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {occasion.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(occasion)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(occasion)}
                        className={occasion.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                      >
                        {occasion.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(occasion)}
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

          {filteredOccasions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No occasions found</div>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-900"
              >
                Create your first occasion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
