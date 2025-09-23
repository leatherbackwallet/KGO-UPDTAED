import React, { useState } from 'react';
import Head from 'next/head';
import ContentViewer from '../components/ContentViewer';
import Navbar from '../components/Navbar';

const ContentPage: React.FC = () => {
  const [contentType, setContentType] = useState<'all' | 'recipes' | 'festivals' | 'language'>('all');
  const [language, setLanguage] = useState<'en' | 'de' | 'ml'>('en');

  return (
    <>
      <Head>
        <title>Cultural Content - KeralGiftsOnline</title>
        <meta name="description" content="Discover authentic Kerala recipes, festival guides, and cultural content" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Content Type Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={() => setContentType('all')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  contentType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Content
              </button>
              <button
                onClick={() => setContentType('recipes')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  contentType === 'recipes'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Recipes
              </button>
              <button
                onClick={() => setContentType('festivals')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  contentType === 'festivals'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Festival Guides
              </button>
              <button
                onClick={() => setContentType('language')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  contentType === 'language'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Language Learning
              </button>
            </div>

            {/* Language Filter */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Language:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    language === 'en'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  English
                </button>

                <button
                  onClick={() => setLanguage('ml')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    language === 'ml'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  മലയാളം
                </button>
              </div>
            </div>
          </div>

          {/* Content Viewer */}
          <ContentViewer
            contentType={contentType}
            language={language}
            limit={12}
          />
        </div>
      </div>
    </>
  );
};

export default ContentPage; 
// Disable static generation for this page
export async function getServerSideProps() {
  return {
    props: {},
  };
}
