import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import PasswordRequirements from '../components/PasswordRequirements';
import api from '../utils/api';

interface AuthResponse {
  success: boolean;
  data: {
    tokens: {
      accessToken: string;
      refreshToken: string;
      accessTokenExpiry: number;
      refreshTokenExpiry: number;
    };
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      roleId: string;
      roleName: string;
    };
  };
}

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  // Validation functions
  const validateForm = () => {
    if (!firstName.trim()) {
      setError('First name is required');
      return false;
    }
    
    if (!lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    // Phone number validation (basic)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    if (!phoneRegex.test(phone)) {
      setError('Please enter a valid phone number');
      return false;
    }
    
    if (!password) {
      setError('Password is required');
      return false;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
    if (!passwordRegex.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // Validate form
      if (!validateForm()) {
        setLoading(false);
        return;
      }
      
      const res = await api.post<AuthResponse>('/auth/register', { 
        firstName: firstName.trim(), 
        lastName: lastName.trim(), 
        email: email.trim().toLowerCase(), 
        password, 
        phone: phone.trim()
      });
      
      if (res.data.success && res.data.data.tokens) {
        setSuccess('Registration successful! Redirecting...');
        
        // Reset form fields
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setPhone('');
        
        // Login the user
        login(res.data.data.tokens, res.data.data.user);
        
        // Redirect after a short delay
        setTimeout(() => {
          // Check for return URL parameter
          const returnUrl = router.query.returnUrl as string;
          if (returnUrl) {
            router.push(decodeURIComponent(returnUrl));
          } else {
            router.push('/');
          }
        }, 1500);
      } else {
        setError('Registration failed - invalid response from server');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle different types of errors
      if (err.response) {
        // Server responded with error
        const errorMessage = err.response.data?.error?.message || 
                           err.response.data?.message || 
                           'Registration failed - server error';
        setError(errorMessage);
        
        // If email already exists, suggest login
        if (err.response.data?.error?.code === 'EMAIL_EXISTS') {
          setError('Email already in use. Please use a different email or try logging in.');
        }
      } else if (err.request) {
        // Network error
        setError('Network error - please check your connection and try again');
      } else {
        // Other error
        setError('Registration failed - please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
    
    switch (field) {
      case 'firstName':
        setFirstName(value);
        break;
      case 'lastName':
        setLastName(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'phone':
        setPhone(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <form onSubmit={handleSubmit} className="card p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-kgo-red">Create Account</h2>
          
          {error && (
            <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}
          
          {success && (
            <div className="mb-4 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="firstName" className="form-label">First Name *</label>
              <input
                id="firstName"
                type="text"
                placeholder="Enter your first name"
                value={firstName}
                onChange={e => handleInputChange('firstName', e.target.value)}
                className="form-input w-full"
                required
                disabled={loading}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="form-label">Last Name *</label>
              <input
                id="lastName"
                type="text"
                placeholder="Enter your last name"
                value={lastName}
                onChange={e => handleInputChange('lastName', e.target.value)}
                className="form-input w-full"
                required
                disabled={loading}
                autoComplete="family-name"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="form-label">Email Address *</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => handleInputChange('email', e.target.value)}
              className="form-input w-full"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="phone" className="form-label">Phone Number *</label>
            <input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              className="form-input w-full"
              required
              disabled={loading}
              autoComplete="tel"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="form-label">Password *</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => handleInputChange('password', e.target.value)}
              className="form-input w-full"
              required
              disabled={loading}
              autoComplete="new-password"
            />
            <PasswordRequirements password={password} />
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={e => handleInputChange('confirmPassword', e.target.value)}
              className="form-input w-full"
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary w-full flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-kgo-red hover:text-red-700 underline">
                Login here
              </a>
            </p>
          </div>
        </form>
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
