import React from 'react';
import Head from 'next/head';
import SubscriptionManager from '../components/SubscriptionManager';
import Navbar from '../components/Navbar';

const SubscriptionPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Subscription Management - KeralGiftsOnline</title>
        <meta name="description" content="Manage your subscription tier and loyalty points" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <SubscriptionManager />
      </div>
    </>
  );
};

export default SubscriptionPage; 