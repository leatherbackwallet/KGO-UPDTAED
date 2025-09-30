/**
 * PersonalizedRecommendations Component
 * Displays AI-powered personalized product recommendations
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProductCard from './ProductCard';
import LoadingSpinner from './LoadingSpinner';

interface RecommendationResult {
  products: any[];
  score: number;
  reason: string;
  category: 'browsing' | 'purchase' | 'cultural' | 'seasonal' | 'collaborative';
}

interface PersonalizedRecommendationsProps {
  limit?: number;
  showReasons?: boolean;
  className?: string;
}

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  limit = 10,
  showReasons = true,
  className = ''
}) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [user, limit]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/personalization/recommendations?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.data.recommendations);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load personalized recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'browsing':
        return '👀';
      case 'purchase':
        return '🛒';
      case 'cultural':
        return '🎭';
      case 'seasonal':
        return '🌺';
      case 'collaborative':
        return '👥';
      default:
        return '✨';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'browsing':
        return 'bg-blue-100 text-blue-800';
      case 'purchase':
        return 'bg-green-100 text-green-800';
      case 'cultural':
        return 'bg-purple-100 text-purple-800';
      case 'seasonal':
        return 'bg-orange-100 text-orange-800';
      case 'collaborative':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${className}`}>
        <div className="text-gray-500 mb-4">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-lg font-medium">Sign in for personalized recommendations</p>
          <p className="text-sm">Get AI-powered product suggestions based on your preferences</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-gray-600">Loading personalized recommendations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={fetchRecommendations}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${className}`}>
        <div className="text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-lg font-medium">No recommendations yet</p>
          <p className="text-sm">Start browsing products to get personalized suggestions</p>
        </div>
      </div>
    );
  }

  // Flatten all products from recommendations
  const allProducts = recommendations.flatMap(rec => 
    (Array.isArray(rec.products) ? rec.products : []).map(product => ({
      ...product,
      recommendationReason: rec.reason,
      recommendationCategory: rec.category,
      recommendationScore: rec.score
    }))
  );

  // Remove duplicates based on product ID
  const uniqueProducts = allProducts.filter((product, index, self) => 
    index === self.findIndex(p => p._id === product._id)
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recommended for You</h2>
            <p className="text-sm text-gray-600 mt-1">
              AI-powered suggestions based on your preferences
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Powered by AI</span>
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {uniqueProducts.slice(0, limit).map((product) => (
            <div key={product._id} className="relative">
              <ProductCard
                product={{
                  _id: product._id,
                  name: product.name.en || product.name,
                  description: product.description.en || product.description,
                  category: product.category || 'general',
                  categories: product.categories || [],
                  images: product.images,
                  slug: product.slug,
                  isFeatured: product.isFeatured,
                  price: product.price
                }}
                onQuickView={() => {}}
              />
              
              {showReasons && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{getCategoryIcon(product.recommendationCategory)}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(product.recommendationCategory)}`}>
                      {product.recommendationCategory}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(product.recommendationScore * 100)}% match
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {product.recommendationReason}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {uniqueProducts.length > limit && (
          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.href = '/items'}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              View All Recommendations
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizedRecommendations; 