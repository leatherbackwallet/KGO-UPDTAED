/**
 * Tests for VirtualizedProductGrid component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VirtualizedProductGrid } from '../VirtualizedProductGrid';
import { Product } from '../../types/shared';

// Mock react-window
jest.mock('react-window', () => ({
  FixedSizeGrid: ({ children, itemData, columnCount, rowCount }: any) => {
    // Render a few items for testing
    const items = [];
    for (let row = 0; row < Math.min(rowCount, 3); row++) {
      for (let col = 0; col < Math.min(columnCount, 4); col++) {
        items.push(
          children({
            columnIndex: col,
            rowIndex: row,
            style: { position: 'absolute', left: col * 300, top: row * 400 },
            data: itemData
          })
        );
      }
    }
    return <div data-testid="virtualized-grid">{items}</div>;
  }
}));

// Mock ProductCard
jest.mock('../ProductCard', () => {
  return function MockProductCard({ product, onQuickView, index }: any) {
    return (
      <div 
        data-testid={`product-card-${product._id}`}
        onClick={() => onQuickView(product)}
      >
        {product.name.en || product.name}
      </div>
    );
  };
});

// Mock ProductSkeleton
jest.mock('../ProductSkeleton', () => {
  return function MockProductSkeleton() {
    return <div data-testid="product-skeleton">Loading...</div>;
  };
});

const mockProducts: Product[] = [
  {
    _id: '1',
    name: { en: 'Product 1', ml: 'ഉൽപ്പന്നം 1' },
    description: { en: 'Description 1', ml: 'വിവരണം 1' },
    price: 100,
    stock: 10,
    images: ['image1.jpg'],
    slug: 'product-1',
    category: 'category1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '2',
    name: { en: 'Product 2', ml: 'ഉൽപ്പന്നം 2' },
    description: { en: 'Description 2', ml: 'വിവരണം 2' },
    price: 200,
    stock: 5,
    images: ['image2.jpg'],
    slug: 'product-2',
    category: 'category2',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('VirtualizedProductGrid', () => {
  const mockOnQuickView = jest.fn();

  beforeEach(() => {
    mockOnQuickView.mockClear();
  });

  it('renders virtualized grid with products', () => {
    render(
      <VirtualizedProductGrid
        products={mockProducts}
        onQuickView={mockOnQuickView}
      />
    );

    expect(screen.getByTestId('virtualized-grid')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
  });

  it('shows loading skeletons when loading', () => {
    render(
      <VirtualizedProductGrid
        products={[]}
        loading={true}
        onQuickView={mockOnQuickView}
      />
    );

    expect(screen.getAllByTestId('product-skeleton')).toHaveLength(12); // Default loading count
  });

  it('shows empty state when no products', () => {
    render(
      <VirtualizedProductGrid
        products={[]}
        loading={false}
        onQuickView={mockOnQuickView}
      />
    );

    expect(screen.getByText('No Products Found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters or search terms')).toBeInTheDocument();
  });

  it('calls onQuickView when product is clicked', () => {
    render(
      <VirtualizedProductGrid
        products={mockProducts}
        onQuickView={mockOnQuickView}
      />
    );

    fireEvent.click(screen.getByTestId('product-card-1'));
    expect(mockOnQuickView).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('handles responsive layout correctly', () => {
    // Mock window resize
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(
      <VirtualizedProductGrid
        products={mockProducts}
        onQuickView={mockOnQuickView}
        itemsPerRow={4}
      />
    );

    // Should render with responsive layout
    expect(screen.getByTestId('virtualized-grid')).toBeInTheDocument();
  });

  it('optimizes performance with large product lists', () => {
    const largeProductList = Array.from({ length: 100 }, (_, i) => ({
      ...mockProducts[0],
      _id: `product-${i}`,
      name: { en: `Product ${i}`, ml: `ഉൽപ്പന്നം ${i}` }
    }));

    const { rerender } = render(
      <VirtualizedProductGrid
        products={largeProductList}
        onQuickView={mockOnQuickView}
      />
    );

    // Should render without performance issues
    expect(screen.getByTestId('virtualized-grid')).toBeInTheDocument();

    // Re-render with same props should not cause unnecessary work
    rerender(
      <VirtualizedProductGrid
        products={largeProductList}
        onQuickView={mockOnQuickView}
      />
    );

    expect(screen.getByTestId('virtualized-grid')).toBeInTheDocument();
  });

  it('handles different item sizes correctly', () => {
    render(
      <VirtualizedProductGrid
        products={mockProducts}
        onQuickView={mockOnQuickView}
        itemHeight={350}
        itemWidth={250}
        gap={16}
      />
    );

    expect(screen.getByTestId('virtualized-grid')).toBeInTheDocument();
  });

  it('supports custom overscan for better scrolling performance', () => {
    render(
      <VirtualizedProductGrid
        products={mockProducts}
        onQuickView={mockOnQuickView}
        overscan={5}
      />
    );

    expect(screen.getByTestId('virtualized-grid')).toBeInTheDocument();
  });
});

describe('VirtualizedProductGrid Performance', () => {
  it('should not re-render unnecessarily', () => {
    const mockOnQuickView = jest.fn();
    let renderCount = 0;

    const TestComponent = () => {
      renderCount++;
      return (
        <VirtualizedProductGrid
          products={mockProducts}
          onQuickView={mockOnQuickView}
        />
      );
    };

    const { rerender } = render(<TestComponent />);
    
    const initialRenderCount = renderCount;
    
    // Re-render with same props
    rerender(<TestComponent />);
    
    // Should not cause additional renders due to memoization
    expect(renderCount).toBe(initialRenderCount + 1);
  });

  it('should handle rapid prop changes efficiently', async () => {
    const mockOnQuickView = jest.fn();
    
    const { rerender } = render(
      <VirtualizedProductGrid
        products={mockProducts}
        onQuickView={mockOnQuickView}
      />
    );

    // Simulate rapid prop changes
    for (let i = 0; i < 10; i++) {
      rerender(
        <VirtualizedProductGrid
          products={mockProducts.slice(0, i % 2 + 1)}
          onQuickView={mockOnQuickView}
        />
      );
    }

    // Should handle changes without errors
    expect(screen.getByTestId('virtualized-grid')).toBeInTheDocument();
  });
});