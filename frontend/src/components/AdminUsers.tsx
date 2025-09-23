import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface UserLocation {
  type: 'Point';
  coordinates: number[];
}

interface UserSchedule {
  type: 'work_shift' | 'time_off';
  startDate: string;
  endDate: string;
  isRecurring: boolean;
}

interface RecipientAddress {
  name: string;
  phone: string;
  address: {
    streetName: string;
    houseNumber?: string;
    postalCode: string;
    city: string;
    countryCode: string;
  };
  additionalInstructions?: string;
  isDefault: boolean;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  location?: UserLocation;
  schedules?: UserSchedule[];
  recipientAddresses?: RecipientAddress[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  roleId: {
    _id: string;
    name: string;
  };
}

export default function AdminUsers() {
  const { tokens, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (tokens?.accessToken && user?.roleName === 'admin') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [tokens, user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get<User[]>('/users', { 
        headers: { Authorization: `Bearer ${tokens?.accessToken}` } 
      });
      setUsers(res.data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const grantAdmin = async (id: string) => {
    try {
      await api.put(`/users/${id}/grant`, {}, { 
        headers: { Authorization: `Bearer ${tokens?.accessToken}` } 
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error granting admin');
    }
  };

  const revokeAdmin = async (id: string) => {
    try {
      await api.put(`/users/${id}/revoke`, {}, { 
        headers: { Authorization: `Bearer ${tokens?.accessToken}` } 
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error revoking admin');
    }
  };

  const toggleUserDetails = (user: User) => {
    setSelectedUser(selectedUser?._id === user._id ? null : user);
    setShowDetails(selectedUser?._id !== user._id);
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

  const formatSchedule = (schedule: UserSchedule) => {
    const startDate = new Date(schedule.startDate).toLocaleDateString();
    const endDate = new Date(schedule.endDate).toLocaleDateString();
    return `${schedule.type} (${startDate} - ${endDate})${schedule.isRecurring ? ' - Recurring' : ''}`;
  };

  const exportUsersToCSV = () => {
    if (users.length === 0) {
      setError('No users to export');
      return;
    }

    setExporting(true);
    try {
      // Prepare CSV data
      const csvHeaders = [
        'ID',
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Role',
        'Status',
        'Active',
        'Created At',
        'Updated At',
        'Location Type',
        'Location Coordinates',
        'Schedules Count',
        'Recipient Addresses Count'
      ];

      const csvData = users.map(user => [
        user._id,
        user.firstName,
        user.lastName,
        user.email,
        user.phone,
        user.roleId?.name || 'Unknown',
        user.isActive ? 'Active' : 'Inactive',
        user.isActive ? 'Yes' : 'No',
        formatDate(user.createdAt),
        formatDate(user.updatedAt),
        user.location?.type || '',
        user.location?.coordinates?.join(', ') || '',
        user.schedules?.length || 0,
        user.recipientAddresses?.length || 0
      ]);

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setError('');
    } catch (err) {
      console.error('Error exporting users:', err);
      setError('Error exporting users. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (!tokens?.accessToken || user?.roleName !== 'admin') {
    return <div className="text-red-600">Access denied. Admin privileges required.</div>;
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">User Management</h2>
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Left Sidebar - CRUD Operations */}
      <div className="w-72 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
          
          <div className="space-y-3">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Refreshing...
                </div>
              ) : (
                '🔄 Refresh Users'
              )}
            </button>
            
            <button
              onClick={exportUsersToCSV}
              disabled={exporting || users.length === 0}
              className={`w-full px-4 py-3 rounded-lg transition-colors font-medium ${
                exporting || users.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {exporting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </div>
              ) : (
                '📊 Export Users'
              )}
            </button>
          </div>
          
          {/* User Statistics */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">User Statistics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Users:</span>
                <span className="font-medium">{users.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active:</span>
                <span className="font-medium text-green-600">
                  {users.filter(u => u.isActive && !u.isDeleted).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Admins:</span>
                <span className="font-medium text-blue-600">
                  {users.filter(u => u.roleId?.name === 'admin').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customers:</span>
                <span className="font-medium text-gray-600">
                  {users.filter(u => u.roleId?.name === 'customer').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
            <p className="text-sm text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {users.length} users
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {users.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No users found</div>
            <div className="text-sm text-gray-400">Users will appear here when they register</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <React.Fragment key={user._id}>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-2">
                            {user.avatar && (
                              <img 
                                src={user.avatar} 
                                alt={`${user.firstName} ${user.lastName}`}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium text-sm">{user.firstName} {user.lastName}</div>
                              <button 
                                onClick={() => toggleUserDetails(user)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                {selectedUser?._id === user._id ? 'Hide Details' : 'View Details'}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 truncate">{user.email}</td>
                        <td className="px-4 py-4 text-sm text-gray-900">{user.phone}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.roleId?.name === 'admin' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.roleId?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          {user.roleId?.name === 'admin' ? (
                            <button 
                              onClick={() => revokeAdmin(user._id)} 
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Revoke Admin
                            </button>
                          ) : (
                            <button 
                              onClick={() => grantAdmin(user._id)} 
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              Grant Admin
                            </button>
                          )}
                        </td>
                      </tr>
                      {selectedUser?._id === user._id && (
                        <tr>
                          <td colSpan={7} className="p-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Basic Information */}
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-3">Basic Information</h4>
                                <div className="space-y-2 text-sm">
                                  <div><span className="font-medium">Full Name:</span> {user.firstName} {user.lastName}</div>
                                  <div><span className="font-medium">Email:</span> {user.email}</div>
                                  <div><span className="font-medium">Phone:</span> {user.phone}</div>
                                  <div><span className="font-medium">Role:</span> {user.roleId?.name}</div>
                                  <div><span className="font-medium">Status:</span> {user.isActive ? 'Active' : 'Inactive'}</div>
                                  <div><span className="font-medium">Created:</span> {formatDate(user.createdAt)}</div>
                                  <div><span className="font-medium">Last Updated:</span> {formatDate(user.updatedAt)}</div>
                                </div>
                              </div>

                              {/* Location Information */}
                              {user.location && (
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-3">Location</h4>
                                  <div className="space-y-2 text-sm">
                                    <div><span className="font-medium">Type:</span> {user.location.type}</div>
                                    <div><span className="font-medium">Coordinates:</span> {user.location.coordinates.join(', ')}</div>
                                  </div>
                                </div>
                              )}

                              {/* Schedules */}
                              {user.schedules && user.schedules.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-3">Schedules ({user.schedules.length})</h4>
                                  <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                                    {user.schedules.map((schedule, index) => (
                                      <div key={index} className="text-gray-700">
                                        {formatSchedule(schedule)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Recipient Addresses */}
                              {user.recipientAddresses && user.recipientAddresses.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-3">Addresses ({user.recipientAddresses.length})</h4>
                                  <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
                                    {user.recipientAddresses.map((address, index) => (
                                      <div key={index} className="p-2 bg-white rounded border">
                                        <div className="font-medium">{address.name}</div>
                                        <div>{address.phone}</div>
                                        <div className="text-gray-600">
                                          {address.address.streetName} {address.address.houseNumber}, {address.address.city} {address.address.postalCode}
                                        </div>
                                        {address.isDefault && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}