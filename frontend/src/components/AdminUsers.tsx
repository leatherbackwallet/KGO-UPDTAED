import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: {
    name: string;
  };
}

export default function AdminUsers() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && user?.roleName === 'admin') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [token, user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get<User[]>('/users', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setUsers(res.data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      // Don't show error for empty data, just set empty array
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const grantAdmin = async (id: string) => {
    try {
      await api.put(`/users/${id}/grant`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error granting admin');
    }
  };

  const revokeAdmin = async (id: string) => {
    try {
      await api.put(`/users/${id}/revoke`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error revoking admin');
    }
  };

  if (!token || user?.roleName !== 'admin') {
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
      <h2 className="text-xl font-bold mb-4">User Management</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {users.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">No users found</div>
          <div className="text-sm text-gray-400">Users will appear here when they register</div>
        </div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} className="border-t">
                <td className="p-2">{user.firstName} {user.lastName}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">{user.roleId?.name || 'Unknown'}</td>
                <td className="p-2">
                  {user.roleId?.name === 'admin' ? (
                    <button onClick={() => revokeAdmin(user._id)} className="text-red-600 hover:text-red-700">Revoke Admin</button>
                  ) : (
                    <button onClick={() => grantAdmin(user._id)} className="text-blue-600 hover:text-blue-700">Grant Admin</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 