import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';

interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: any;
  };
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post<AuthResponse>('/auth/register', { name, email, password, phone });
      
      if (res.data.success && res.data.data.token) {
        login(res.data.data.token, res.data.data.user);
        router.push('/');
      } else {
        setError('Registration failed - invalid response');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <form onSubmit={handleSubmit} className="card p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-kgo-red">Register</h2>
          {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
          <div className="mb-4">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="form-input w-full"
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-input w-full"
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="form-input w-full"
              required
            />
          </div>
          <div className="mb-6">
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input w-full"
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full">Register</button>
        </form>
      </main>
    </>
  );
}
