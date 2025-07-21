import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data as { success: boolean; data: { token: string; user: any } };
      
      if (data.success && data.data.token) {
        login(data.data.token, data.data.user);
        router.push('/');
      } else {
        setError('Login failed - invalid response');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <form onSubmit={handleSubmit} className="card p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-kgo-red">Login</h2>
          {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
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
          <button type="submit" className="btn-primary w-full">Login</button>
        </form>
      </main>
    </>
  );
}
