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
    houseNumber: string;
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">User Management</h2>
        <button
          onClick={exportUsersToCSV}
          disabled={exporting || users.length === 0}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            exporting || users.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {exporting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Users ({users.length})
            </span>
          )}
        </button>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {users.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">No users found</div>
          <div className="text-sm text-gray-400">Users will appear here when they register</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left border-b">Name</th>
                <th className="p-3 text-left border-b">Email</th>
                <th className="p-3 text-left border-b">Phone</th>
                <th className="p-3 text-left border-b">Role</th>
                <th className="p-3 text-left border-b">Status</th>
                <th className="p-3 text-left border-b">Joined</th>
                <th className="p-3 text-left border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <React.Fragment key={user._id}>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        {user.avatar && (
                          <img 
                            src={user.avatar} 
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{user.firstName} {user.lastName}</div>
                          <button 
                            onClick={() => toggleUserDetails(user)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            {selectedUser?._id === user._id ? 'Hide Details' : 'View Details'}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.phone}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.roleId?.name === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.roleId?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="p-3">
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
                            <div className="md:col-span-2">
                              <h4 className="font-semibold text-gray-800 mb-3">Schedules</h4>
                              <div className="space-y-2">
                                {user.schedules.map((schedule, index) => (
                                  <div key={index} className="text-sm bg-white p-2 rounded border">
                                    {formatSchedule(schedule)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recipient Addresses */}
                          {user.recipientAddresses && user.recipientAddresses.length > 0 && (
                            <div className="md:col-span-2">
                              <h4 className="font-semibold text-gray-800 mb-3">Recipient Addresses</h4>
                              <div className="space-y-3">
                                {user.recipientAddresses.map((address, index) => (
                                  <div key={index} className="bg-white p-3 rounded border">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="font-medium">{address.name}</div>
                                      {address.isDefault && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                                      )}
                                    </div>
                                    <div className="text-sm space-y-1">
                                      <div><span className="font-medium">Phone:</span> {address.phone}</div>
                                      <div><span className="font-medium">Address:</span> {address.address.houseNumber} {address.address.streetName}</div>
                                      <div><span className="font-medium">City:</span> {address.address.city} {address.address.postalCode}</div>
                                      <div><span className="font-medium">Country:</span> {address.address.countryCode}</div>
                                      {address.additionalInstructions && (
                                        <div><span className="font-medium">Instructions:</span> {address.additionalInstructions}</div>
                                      )}
                                    </div>
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
      )}
    </div>
  );
} 