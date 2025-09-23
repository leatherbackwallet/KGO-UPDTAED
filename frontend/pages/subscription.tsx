import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';

const SubscriptionPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page since subscription is disabled
    router.replace('/');
  }, [router]);

  return (
    <>
      <Head>
        <title>Page Not Found - KeralGiftsOnline</title>
        <meta name="description" content="The requested page is not available" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
            <p className="text-gray-600 mb-8">The subscription page is currently unavailable.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubscriptionPage;
// Disable static generation for this page
export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };
}
