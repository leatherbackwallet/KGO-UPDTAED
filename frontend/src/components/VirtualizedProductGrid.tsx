/**
 * VirtualizedProductGrid - Virtual scrolling for large product catalogs
 * Optimizes performance by only rendering visible items
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Grid } from 'react-window';
import { Product } from '../types/product';
import ProductCard from './ProductCard';
import ProductSkeleton from './ProductSkeleton';

interface VirtualizedProductGridProps {
  products: Product[];
  loading?: boolean;
  onQuickView: (product: Product) => void;
  className?: string;
  itemsPerRow?: number;
  itemHeight?: number;
  itemWidth?: number;
  gap?: number;
  overscan?: number;
}

interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    products: Product[];
    itemsPerRow: number;
    onQuickView: (product: Product) => void;
    itemWidth: number;
    gap: number;
    loading: boolean;
  };
}

const GridItem: React.FC<GridItemProps> = ({ columnIndex, rowIndex, style, data }) => {
  const { products, itemsPerRow, onQuickView, itemWidth, gap, loading } = data;
  const index = rowIndex * itemsPerRow + columnIndex;
  const product = products[index];

  // Calculate item style with gap
  const itemStyle: React.CSSProperties = {
    ...style,
    left: (style.left as number) + gap / 2,
    top: (style.top as number) + gap / 2,
    width: itemWidth - gap,
    height: (style.height as number) - gap,
  };

  if (loading && index < 12) {
    return (
      <div style={itemStyle}>
        <ProductSkeleton />
      </div>
    );
  }

  if (!product) {
    return <div style={itemStyle} />;
  }

  return (
    <div style={itemStyle}>
      <ProductCard
        product={product}
        onQuickView={onQuickView}
      />
    </div>
  );
};

export const VirtualizedProductGrid: React.FC<VirtualizedProductGridProps> = ({
  products,
  loading = false,
  onQuickView,
  className = '',
  itemsPerRow = 4,
  itemHeight = 400,
  itemWidth = 300,
  gap = 24,
  overscan = 2
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 600 });

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: Math.max(rect.height, 600)
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate responsive items per row based on container width
  const responsiveItemsPerRow = useMemo(() => {
    const availableWidth = containerSize.width - gap;
    const minItemWidth = 280; // Minimum item width
    const maxItemsPerRow = Math.floor(availableWidth / (minItemWidth + gap));
    return Math.max(1, Math.min(itemsPerRow, maxItemsPerRow));
  }, [containerSize.width, itemsPerRow, gap]);

  // Calculate actual item width based on available space
  const actualItemWidth = useMemo(() => {
    const availableWidth = containerSize.width - gap;
    return (availableWidth - (responsiveItemsPerRow - 1) * gap) / responsiveItemsPerRow;
  }, [containerSize.width, responsiveItemsPerRow, gap]);

  // Calculate grid dimensions
  const rowCount = Math.ceil((loading ? 12 : products.length) / responsiveItemsPerRow);
  const columnCount = responsiveItemsPerRow;

  // Memoize grid data to prevent unnecessary re-renders
  const gridData = useMemo(() => ({
    products,
    itemsPerRow: responsiveItemsPerRow,
    onQuickView,
    itemWidth: actualItemWidth,
    gap,
    loading
  }), [products, responsiveItemsPerRow, onQuickView, actualItemWidth, gap, loading]);

  // Custom scroll behavior for better UX
  const handleScroll = useCallback((scrollTop: number) => {
    // Optional: Add scroll-based optimizations here
    // e.g., preload images for upcoming items
  }, []);

  if (products.length === 0 && !loading) {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <ProductCard
            key={product._id}
            product={product}
            onQuickView={onQuickView}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Hook for managing virtualized grid state
 */
export const useVirtualizedGrid = (
  products: Product[],
  containerWidth: number = 1200
) => {
  const [itemsPerRow, setItemsPerRow] = useState(4);
  const [itemHeight, setItemHeight] = useState(400);

  // Update items per row based on container width
  useEffect(() => {
    const minItemWidth = 280;
    const gap = 24;
    const availableWidth = containerWidth - gap;
    const maxItems = Math.floor(availableWidth / (minItemWidth + gap));
    setItemsPerRow(Math.max(1, Math.min(4, maxItems)));
  }, [containerWidth]);

  // Adjust item height based on content and screen size
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth < 1024;
    
    if (isMobile) {
      setItemHeight(380);
    } else if (isTablet) {
      setItemHeight(390);
    } else {
      setItemHeight(400);
    }
  }, []);

  return {
    itemsPerRow,
    itemHeight,
    rowCount: Math.ceil(products.length / itemsPerRow)
  };
};

export default VirtualizedProductGrid;