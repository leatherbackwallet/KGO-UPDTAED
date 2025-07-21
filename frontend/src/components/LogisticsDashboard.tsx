/**
 * Logistics Dashboard - Hub and Delivery Run Management
 * Provides interface for managing physical hubs and delivery runs for hyperlocal logistics
 */

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import AdminTabs from './AdminTabs';

interface Hub {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  operatingHours?: string;
  isActive: boolean;
}

interface DeliveryRun {
  _id: string;
  runId: string;
  deliveryAgentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  assignedHubId: {
    _id: string;
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
    };
  };
  status: 'planning' | 'collecting_items' | 'at_hub_packing' | 'out_for_delivery' | 'completed' | 'cancelled';
  orders: Array<{
    _id: string;
    orderId: string;
    totalPrice: number;
    orderStatus: string;
  }>;
  routePlan: Array<{
    stopType: 'pickup' | 'hub' | 'dropoff';
    location: {
      address: string;
    };
    status: 'pending' | 'completed' | 'skipped';
  }>;
  estimatedStartTime?: string;
  actualStartTime?: string;
  estimatedCompletionTime?: string;
  actualCompletionTime?: string;
  createdAt: string;
}

export default function LogisticsDashboard() {
  const [activeTab, setActiveTab] = useState<'hubs' | 'delivery-runs'>('hubs');
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [deliveryRuns, setDeliveryRuns] = useState<DeliveryRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateHub, setShowCreateHub] = useState(false);
  const [showCreateRun, setShowCreateRun] = useState(false);

  const tabs = [
    { id: 'hubs', label: `Hubs (${hubs.length})` },
    { id: 'delivery-runs', label: `Delivery Runs (${deliveryRuns.length})` }
  ];

  const fetchHubs = async () => {
    try {
      const response = await api.get('/hubs');
      setHubs(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load hubs');
    }
  };

  const fetchDeliveryRuns = async () => {
    try {
      const response = await api.get('/delivery-runs');
      setDeliveryRuns(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load delivery runs');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchHubs(), fetchDeliveryRuns()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'bg-yellow-100 text-yellow-800',
      collecting_items: 'bg-blue-100 text-blue-800',
      at_hub_packing: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h1 className="text-3xl font-bold text-gray-900">Logistics Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage hubs and delivery runs for hyperlocal logistics</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <AdminTabs
          tabs={tabs.map(t => t.label)}
          activeTab={tabs.find(t => t.id === activeTab)?.label || `Hubs (${hubs.length})`}
          onTabChange={(tabLabel) => {
            const tabId = tabs.find(t => t.label === tabLabel)?.id as any;
            setActiveTab(tabId);
          }}
        />
      </div>

      {/* Hubs Tab */}
      {activeTab === 'hubs' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Hubs Management</h2>
            <button
              onClick={() => setShowCreateHub(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add New Hub
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hubs.map((hub) => (
                <div key={hub._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{hub.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      hub.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {hub.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>{hub.address.street}</p>
                    <p>{hub.address.city}, {hub.address.state} {hub.address.postalCode}</p>
                    {hub.operatingHours && (
                      <p className="text-blue-600">🕒 {hub.operatingHours}</p>
                    )}
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                      Edit
                    </button>
                    <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delivery Runs Tab */}
      {activeTab === 'delivery-runs' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Delivery Runs</h2>
            <button
              onClick={() => setShowCreateRun(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Run
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveryRuns.map((run) => (
                <div key={run._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{run.runId}</h3>
                      <p className="text-sm text-gray-600">
                        Agent: {run.deliveryAgentId.firstName} {run.deliveryAgentId.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Hub: {run.assignedHubId.name}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(run.status)}`}>
                      {run.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Orders</p>
                      <p className="text-lg font-semibold text-gray-900">{run.orders.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Route Stops</p>
                      <p className="text-lg font-semibold text-gray-900">{run.routePlan.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Created</p>
                      <p className="text-sm text-gray-600">{formatDate(run.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                      View Details
                    </button>
                    <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                      Track
                    </button>
                    {run.status === 'planning' && (
                      <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Hub Modal Placeholder */}
      {showCreateHub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Hub</h3>
            <p className="text-gray-600 mb-4">Hub creation form will be implemented here.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateHub(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Create Hub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Delivery Run Modal Placeholder */}
      {showCreateRun && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Delivery Run</h3>
            <p className="text-gray-600 mb-4">Delivery run creation form will be implemented here.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateRun(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Create Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 