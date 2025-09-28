/**
 * Legacy Admin Page - Redirects to new admin dashboard
 * This page now redirects to the new isolated admin panel
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

export default function Admin() {
  const router = useRouter();
  const { user } = useAuth();
  const { canAccessAdmin } = usePermissions();

  useEffect(() => {
    // Check authorization
    if (!user || !canAccessAdmin()) {
      router.push('/login');
      return;
    }

    // Redirect to new admin dashboard
    router.push('/admin/dashboard');
  }, [user, canAccessAdmin, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to admin panel...</p>
      </div>
    </div>
  );
}

// Disable static generation for this page
export async function getServerSideProps() {
  return {
    props: {},
  };
}