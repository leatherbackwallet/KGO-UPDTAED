import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get<User[]>('/users', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setUsers(res.data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
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
        <div className="text-gray-600">No users found</div>
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
                <td className="p-2">{user.name}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">{user.role}</td>
                <td className="p-2">
                  {user.role === 'Admin' ? (
                    <button onClick={() => revokeAdmin(user._id)} className="text-red-600">Revoke Admin</button>
                  ) : (
                    <button onClick={() => grantAdmin(user._id)} className="text-blue-600">Grant Admin</button>
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