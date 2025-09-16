import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';

interface Address {
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

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  recipientAddresses?: Address[];
}

export default function Profile() {
  const { user, login, tokens } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Address form state
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    address: {
      streetName: '',
      houseNumber: '',
      postalCode: '',
      city: '',
      countryCode: 'DE'
    },
    isDefault: false
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState('profile');
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      const userData = response.data.data;
      setProfile(userData);
      setProfileForm({
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const response = await api.put('/profile', profileForm);
      const updatedUser = response.data.data;
      setProfile(updatedUser);
      setSuccess('Profile updated successfully');
      
      // Update auth context with current tokens
      if (tokens) {
        login(tokens, updatedUser);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }
    
    try {
      await api.put('/profile/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setSuccess('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to change password');
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    
    setUploadingAvatar(true);
    setError('');
    setSuccess('');
    
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const response = await api.post('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setProfile(prev => prev ? { ...prev, avatar: response.data.data.avatar } : null);
      setSuccess('Avatar uploaded successfully');
      setAvatarFile(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    try {
      await api.delete('/profile/avatar');
      setProfile(prev => prev ? { ...prev, avatar: undefined } : null);
      setSuccess('Avatar deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete avatar');
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (editingAddress !== null) {
        // Update existing address
        await api.put(`/profile/addresses/${editingAddress}`, addressForm);
        setSuccess('Address updated successfully');
      } else {
        // Add new address
        await api.post('/profile/addresses', addressForm);
        setSuccess('Address added successfully');
      }
      
      fetchProfile(); // Refresh addresses
      setAddressForm({
        name: '',
        phone: '',
        address: {
          streetName: '',
          houseNumber: '',
          postalCode: '',
          city: '',
          countryCode: 'DE'
        },
        isDefault: false
      });
      setEditingAddress(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save address');
    }
  };

  const handleAddressEdit = (index: number, address: Address) => {
    setEditingAddress(index);
    setAddressForm({
      name: address.name,
      phone: address.phone,
      address: { ...address.address },
      isDefault: address.isDefault
    });
  };

  const handleAddressDelete = async (index: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      await api.delete(`/profile/addresses/${index}`);
      setSuccess('Address deleted successfully');
      fetchProfile(); // Refresh addresses
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (index: number) => {
    try {
      await api.put(`/profile/addresses/${index}/default`);
      setSuccess('Default address updated successfully');
      fetchProfile(); // Refresh addresses
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to set default address');
    }
  };

  const getAvatarUrl = (avatarId?: string) => {
    if (!avatarId) return undefined;
    return `${process.env.NEXT_PUBLIC_API_URL}/images/${avatarId}`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-kgo-red"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'profile', label: 'Profile Info' },
              { id: 'password', label: 'Change Password' },
              { id: 'avatar', label: 'Avatar' },
              { id: 'addresses', label: 'Delivery Addresses' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-kgo-red text-kgo-red'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile Info Tab */}
        {activeTab === 'profile' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
            <form onSubmit={handleProfileUpdate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    className="form-input bg-gray-50"
                    disabled
                  />
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <div className="mt-6">
                <button type="submit" className="btn-primary">
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="space-y-6">
                <div>
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <div className="mt-6">
                <button type="submit" className="btn-primary">
                  Change Password
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Avatar Tab */}
        {activeTab === 'avatar' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Profile Picture</h2>
            
            <div className="flex items-center space-x-8 mb-6">
              <div className="relative">
                {profile?.avatar ? (
                  <img
                    src={getAvatarUrl(profile.avatar)}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                    <span className="text-2xl text-gray-500">
                      {profile?.firstName?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-kgo-red file:text-white hover:file:bg-kgo-red/90"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Upload a profile picture (JPG, PNG, GIF up to 5MB)
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleAvatarUpload}
                disabled={!avatarFile || uploadingAvatar}
                className="btn-primary disabled:opacity-50"
              >
                {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
              </button>
              
              {profile?.avatar && (
                <button
                  onClick={handleAvatarDelete}
                  className="btn-secondary"
                >
                  Remove Avatar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            {/* Add/Edit Address Form */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">
                {editingAddress !== null ? 'Edit Address' : 'Add New Address'}
              </h2>
              
              <form onSubmit={handleAddressSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      value={addressForm.name}
                      onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Street Name</label>
                    <input
                      type="text"
                      value={addressForm.address.streetName}
                      onChange={(e) => setAddressForm({
                        ...addressForm,
                        address: { ...addressForm.address, streetName: e.target.value }
                      })}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">House Number</label>
                    <input
                      type="text"
                      value={addressForm.address.houseNumber}
                      onChange={(e) => setAddressForm({
                        ...addressForm,
                        address: { ...addressForm.address, houseNumber: e.target.value }
                      })}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Postal Code</label>
                    <input
                      type="text"
                      value={addressForm.address.postalCode}
                      onChange={(e) => setAddressForm({
                        ...addressForm,
                        address: { ...addressForm.address, postalCode: e.target.value }
                      })}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      value={addressForm.address.city}
                      onChange={(e) => setAddressForm({
                        ...addressForm,
                        address: { ...addressForm.address, city: e.target.value }
                      })}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="rounded border-gray-300 text-kgo-red focus:ring-kgo-red"
                    />
                    <span className="ml-2 text-sm text-gray-700">Set as default address</span>
                  </label>
                </div>
                
                <div className="mt-6 flex space-x-4">
                  <button type="submit" className="btn-primary">
                    {editingAddress !== null ? 'Update Address' : 'Add Address'}
                  </button>
                  {editingAddress !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddress(null);
                        setAddressForm({
                          name: '',
                          phone: '',
                          address: {
                            streetName: '',
                            houseNumber: '',
                            postalCode: '',
                            city: '',
                            countryCode: 'IN'
                          },
                          isDefault: false
                        });
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Addresses List */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Your Addresses</h2>
              
              {profile?.recipientAddresses && profile.recipientAddresses.length > 0 ? (
                <div className="space-y-4">
                  {profile.recipientAddresses.map((address, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">{address.name}</h3>
                            {address.isDefault && (
                              <span className="bg-kgo-green text-white text-xs px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600">{address.phone}</p>
                          <p className="text-gray-600">
                            {address.address.houseNumber} {address.address.streetName}, {address.address.city} {address.address.postalCode}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          {!address.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(index)}
                              className="text-sm text-kgo-red hover:text-kgo-red/80"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => handleAddressEdit(index, address)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleAddressDelete(index)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No addresses added yet.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
} 
// Disable static generation for this page
export async function getServerSideProps() {
  return {
    props: {},
  };
}
