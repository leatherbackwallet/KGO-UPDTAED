import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown, Tag, Calendar, DollarSign } from 'lucide-react';

interface ProductFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  selectedOccasions: string[];
  setSelectedOccasions: (value: string[]) => void;
  min: string;
  setMin: (value: string) => void;
  max: string;
  setMax: (value: string) => void;
  categories: Array<{_id: string, name: string | { en: string; ml: string }, slug: string}>;
  occasions: string[];
  onClearFilters: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  search,
  setSearch,
  category,
  setCategory,
  selectedOccasions,
  setSelectedOccasions,
  min,
  setMin,
  max,
  setMax,
  categories,
  occasions,
  onClearFilters
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Calculate active filter count
  React.useEffect(() => {
    let count = 0;
    if (search) count++;
    if (category) count++;
    if (selectedOccasions.length > 0) count++;
    if (min || max) count++;
    setActiveFilterCount(count);
  }, [search, category, selectedOccasions, min, max]);

  const handleOccasionToggle = (occasion: string) => {
    const currentOccasions = selectedOccasions;
    if (currentOccasions.includes(occasion)) {
      setSelectedOccasions(currentOccasions.filter(o => o !== occasion));
    } else {
      setSelectedOccasions([...currentOccasions, occasion]);
    }
  };

  const removeOccasion = (occasion: string) => {
    setSelectedOccasions(selectedOccasions.filter(o => o !== occasion));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden backdrop-blur-sm">
      {/* Main Search Bar */}
      <div className="p-6 border-b border-gray-50">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search for gifts, cakes, flowers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="px-6 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between">
                      <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors hover:bg-gray-50 px-3 py-2 rounded-lg"
            >
            <Filter className="h-5 w-5" />
            <span className="font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1 hover:bg-gray-50 px-3 py-2 rounded-lg"
            >
              <X className="h-4 w-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-6 space-y-6 transition-all duration-300 ease-out">
          {/* Category Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Tag className="h-4 w-4" />
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-gray-900"
            >
              <option value="">All Categories</option>
              {categories.map(cat => {
                const categoryName = typeof cat.name === 'string' ? cat.name : (cat.name as any).en || cat.name;
                return (
                  <option key={cat._id} value={cat.slug}>
                    {categoryName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <DollarSign className="h-4 w-4" />
              Price Range
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="number"
                  placeholder="Min"
                  value={min}
                  onChange={e => setMin(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="flex-1 relative">
                <input
                  type="number"
                  placeholder="Max"
                  value={max}
                  onChange={e => setMax(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Occasions */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Calendar className="h-4 w-4" />
              Occasions
            </label>
            
            {/* Selected Occasions */}
            {selectedOccasions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedOccasions.map(occasion => (
                  <span
                    key={occasion}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {occasion.replace('_', ' ')}
                    <button
                      onClick={() => removeOccasion(occasion)}
                      className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Occasion Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {occasions.map(occasion => (
                <button
                  key={occasion}
                  onClick={() => handleOccasionToggle(occasion)}
                  className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                    selectedOccasions.includes(occasion)
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {occasion.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
