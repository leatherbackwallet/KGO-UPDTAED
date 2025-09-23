import React from 'react';

export default function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-64 bg-gray-200"></div>
      
      {/* Content skeleton */}
      <div className="p-6">
        <div className="mb-2">
          <div className="w-16 h-3 bg-gray-200 rounded"></div>
        </div>
        
        <div className="mb-2">
          <div className="w-3/4 h-5 bg-gray-200 rounded"></div>
        </div>
        
        <div className="mb-4">
          <div className="w-full h-4 bg-gray-200 rounded"></div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="w-20 h-6 bg-gray-200 rounded"></div>
          <div className="w-24 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function ProductSkeletonGrid({ count = 8 }: { count?: number }) {
  const gridClasses = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8";
  
  return (
    <div className={gridClasses}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
} 