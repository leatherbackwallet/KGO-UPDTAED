/**
 * Content Viewer Component
 * Displays multi-language content, recipes, and cultural guides
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

interface Content {
  _id: string;
  title: {
    en: string;
    de: string;
    ml: string;
  };
  content: {
    en: string;
    de: string;
    ml: string;
  };
  type: string;
  status: string;
  engagement: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
  recipe?: {
    cookingTime: number;
    preparationTime: number;
    servings: number;
    difficulty: string;
    ingredients: Array<{
      name: { en: string; de: string; ml: string };
      amount: string;
      unit: string;
    }>;
    instructions: Array<{
      step: number;
      instruction: { en: string; de: string; ml: string };
    }>;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    dietaryTags: string[];
  };
  festivalGuide?: {
    festivalDate: string;
    duration: number;
    significance: { en: string; de: string; ml: string };
    traditions: { en: string[]; de: string[]; ml: string[] };
  };
  createdAt: string;
}

interface ContentViewerProps {
  contentType?: 'recipes' | 'festivals' | 'language' | 'all';
  language?: 'en' | 'de' | 'ml';
  limit?: number;
}

const ContentViewer: React.FC<ContentViewerProps> = ({
  contentType = 'all',
  language = 'en',
  limit = 10,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [viewTime, setViewTime] = useState<number>(0);

  useEffect(() => {
    fetchContent();
  }, [contentType, language, limit]);

  useEffect(() => {
    if (selectedContent) {
      const timer = setInterval(() => {
        setViewTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [selectedContent]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      let endpoint = '/content';
      
      if (contentType === 'recipes') {
        endpoint = '/content/recipes';
      } else if (contentType === 'festivals') {
        endpoint = '/content/festivals';
      } else if (contentType === 'language') {
        endpoint = '/content/language';
      }

      const params = new URLSearchParams();
      if (language) params.append('language', language);
      if (limit) params.append('limit', limit.toString());

      const response = await api.get(`${endpoint}?${params}`);
      setContent(response.data.data);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleContentClick = async (contentItem: Content) => {
    setSelectedContent(contentItem);
    setViewTime(0);

    // Update engagement metrics
    try {
      await api.put(`/content/${contentItem._id}/engagement`, {
        viewTime: 0,
        liked: false,
        shared: false,
        commented: false,
      });
    } catch (err) {
      console.error('Error updating engagement:', err);
    }
  };

  const handleLike = async () => {
    if (!selectedContent) return;

    try {
      await api.put(`/content/${selectedContent._id}/engagement`, {
        liked: true,
      });
      setSelectedContent(prev => prev ? {
        ...prev,
        engagement: {
          ...prev.engagement,
          likes: prev.engagement.likes + 1,
        },
      } : null);
    } catch (err) {
      console.error('Error liking content:', err);
    }
  };

  const handleShare = async () => {
    if (!selectedContent) return;

    try {
      await api.put(`/content/${selectedContent._id}/engagement`, {
        shared: true,
      });
      setSelectedContent(prev => prev ? {
        ...prev,
        engagement: {
          ...prev.engagement,
          shares: prev.engagement.shares + 1,
        },
      } : null);

      // Share functionality
      if (navigator.share) {
        navigator.share({
          title: selectedContent.title[language],
          text: selectedContent.content[language].substring(0, 100) + '...',
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing content:', err);
    }
  };

  const getLanguageText = (obj: any, lang: string) => {
    return obj[lang] || obj.en || obj.de || obj.ml || '';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-3 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {contentType === 'recipes' && 'Traditional Recipes'}
          {contentType === 'festivals' && 'Festival Guides'}
          {contentType === 'language' && 'Language Learning'}
          {contentType === 'all' && 'Cultural Content'}
        </h1>
        <p className="text-gray-600">
          Discover authentic {contentType === 'recipes' ? 'Kerala recipes' : 
                           contentType === 'festivals' ? 'festival traditions' :
                           contentType === 'language' ? 'language lessons' : 'cultural content'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {content.map((item) => (
          <div
            key={item._id}
            className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => handleContentClick(item)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  {item.type.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {getLanguageText(item.title, language)}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {getLanguageText(item.content, language).substring(0, 150)}...
              </p>

              {/* Recipe-specific info */}
              {item.recipe && (
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>⏱️ {item.recipe.cookingTime} min</span>
                  <span>👥 {item.recipe.servings} servings</span>
                  <span>📊 {item.recipe.difficulty}</span>
                </div>
              )}

              {/* Festival-specific info */}
              {item.festivalGuide && (
                <div className="text-sm text-gray-500 mb-3">
                  <span>📅 {new Date(item.festivalGuide.festivalDate).toLocaleDateString()}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>👁️ {item.engagement.views}</span>
                  <span>❤️ {item.engagement.likes}</span>
                  <span>📤 {item.engagement.shares}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Detail Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                    {selectedContent.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(selectedContent.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedContent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {getLanguageText(selectedContent.title, language)}
              </h2>

              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 leading-relaxed">
                  {getLanguageText(selectedContent.content, language)}
                </p>
              </div>

              {/* Recipe Details */}
              {selectedContent.recipe && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Recipe Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Ingredients</h4>
                      <ul className="space-y-2">
                        {selectedContent.recipe.ingredients.map((ingredient, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                            <span>{ingredient.amount} {ingredient.unit} {getLanguageText(ingredient.name, language)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Instructions</h4>
                      <ol className="space-y-3">
                        {selectedContent.recipe.instructions.map((instruction, index) => (
                          <li key={index} className="flex">
                            <span className="font-medium text-blue-600 mr-3">{instruction.step}.</span>
                            <span>{getLanguageText(instruction.instruction, language)}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Nutrition Information</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Calories:</span>
                        <span className="font-medium ml-2">{selectedContent.recipe.nutrition.calories}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Protein:</span>
                        <span className="font-medium ml-2">{selectedContent.recipe.nutrition.protein}g</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Carbs:</span>
                        <span className="font-medium ml-2">{selectedContent.recipe.nutrition.carbs}g</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Fat:</span>
                        <span className="font-medium ml-2">{selectedContent.recipe.nutrition.fat}g</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Fiber:</span>
                        <span className="font-medium ml-2">{selectedContent.recipe.nutrition.fiber}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Festival Guide Details */}
              {selectedContent.festivalGuide && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Festival Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Significance</h4>
                      <p className="text-gray-700">
                        {getLanguageText(selectedContent.festivalGuide.significance, language)}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Traditions</h4>
                      <ul className="space-y-2">
                        {getLanguageText(selectedContent.festivalGuide.traditions, language).map((tradition: string, index: number) => (
                          <li key={index} className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                            <span>{tradition}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Engagement Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>👁️ {selectedContent.engagement.views} views</span>
                  <span>❤️ {selectedContent.engagement.likes} likes</span>
                  <span>📤 {selectedContent.engagement.shares} shares</span>
                  <span>💬 {selectedContent.engagement.comments} comments</span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleLike}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                  >
                    <span>❤️</span>
                    <span>Like</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    <span>📤</span>
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentViewer; 