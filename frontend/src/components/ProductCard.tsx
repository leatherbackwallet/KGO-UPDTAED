import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import WishlistButton from './WishlistButton';
import ComboOrderingModal from './ComboOrderingModal';
import { getProductImage, getOptimizedImagePath, DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';
import { getMultilingualText } from '../utils/api';
import { Product } from '../types/product';
import { ComboItemConfiguration } from '../utils/comboUtils';
import { ProductImage } from './ProgressiveImage';
import { useConnectionMonitor } from '../hooks/useConnectionMonitor';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onClick?: (product: Product) => void;
  priority?: 'high' | 'normal' | 'low';
  lazy?: boolean;
  index?: number; // For virtual scrolling optimization
}

const ProductCard = memo<ProductCardProps>(({ 
  product, 
  onQuickView, 
  onClick, 
  priority = 'normal',
  lazy = false,
  index = 0
}) => {
  const { addToCart } = useCart();
  const { connectionQuality } = useConnectionMonitor();
  const [isHovered, setIsHovered] = useState(false);
  const [showComboModal, setShowComboModal] = useState(false);

  // Performance monitoring
  const performanceMonitor = usePerformanceMonitor({
    componentName: `ProductCard-${product._id}`,
    enabled: process.env.NODE_ENV === 'development',
    logThreshold: 20 // Log renders > 20ms
  });

  // Memoize expensive computations
  const imageData = useMemo(() => {
    const baseImagePath = product.images?.[0] || product.defaultImage;
    const primaryImageUrl = baseImagePath ? getOptimizedImagePath(baseImagePath, 'medium') : null;
    
    // Build fallback chain
    const fallbackUrls = [
      // Try different sizes of the same image
      baseImagePath ? getOptimizedImagePath(baseImagePath, 'small') : null,
      baseImagePath ? getOptimizedImagePath(baseImagePath, 'thumb') : null,
      // Try direct product image
      baseImagePath ? getProductImage(baseImagePath) : null,
    ].filter(Boolean) as string[];

    return {
      primaryImageUrl,
      fallbackUrls,
      baseImagePath
    };
  }, [product.images, product.defaultImage]);

  // Memoize product display data
  const productDisplayData = useMemo(() => ({
    name: getMultilingualText(product.name),
    description: getMultilingualText(product.description),
    price: product.price?.toFixed(2) || '0.00',
    comboBasePrice: product.comboBasePrice?.toFixed(2) || '0.00',
    stock: product.stock || 0,
    isOutOfStock: (product.stock || 0) === 0,
    imageAlt: getMultilingualText(product.name)
  }), [product.name, product.description, product.price, product.comboBasePrice, product.stock]);

  // Calculate optimal image dimensions based on connection quality
  const imageDimensions = useMemo(() => {
    const baseWidth = 300;
    const baseHeight = 256; // h-64 = 16rem = 256px
    
    // Reduce image quality on poor connections
    if (connectionQuality === 'poor') {
      return { width: Math.round(baseWidth * 0.75), height: Math.round(baseHeight * 0.75) };
    } else if (connectionQuality === 'good') {
      return { width: baseWidth, height: baseHeight };
    } else {
      return { width: Math.round(baseWidth * 1.25), height: Math.round(baseHeight * 1.25) };
    }
  }, [connectionQuality]);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.isCombo) {
      setShowComboModal(true);
    } else {
      addToCart({
        product: product._id,
        name: productDisplayData.name,
        price: product.price || 0,
        image: getProductImage(product.images?.[0], product.slug),
        quantity: 1,
        stock: productDisplayData.stock
      });
    }
  }, [product.isCombo, product._id, product.price, product.images, product.slug, productDisplayData.name, productDisplayData.stock, addToCart]);

  const handleComboAddToCart = useCallback((comboConfig: {
    productId: string;
    quantity: number;
    price: number;
    isCombo: boolean;
    comboBasePrice: number;
    comboItemConfigurations: ComboItemConfiguration[];
  }) => {
    addToCart({
      product: comboConfig.productId,
      name: productDisplayData.name,
      price: comboConfig.price,
      image: getProductImage(product.images?.[0], product.slug),
      quantity: comboConfig.quantity,
      stock: productDisplayData.stock,
      isCombo: comboConfig.isCombo,
      comboBasePrice: comboConfig.comboBasePrice,
      comboItemConfigurations: comboConfig.comboItemConfigurations
    });
  }, [productDisplayData.name, productDisplayData.stock, product.images, product.slug, addToCart]);

  const handleCardClick = useCallback(() => {
    onQuickView(product);
  }, [onQuickView, product]);

  const handleCloseComboModal = useCallback(() => {
    setShowComboModal(false);
  }, []);

  return (
    <div 
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-100">
        <ProductImage
          src={imageData.primaryImageUrl || DEFAULT_PRODUCT_IMAGE}
          alt={productDisplayData.imageAlt}
          productSlug={product.slug}
          priority={priority}
          lazy={lazy}
          containerWidth={imageDimensions.width}
          containerHeight={imageDimensions.height}
          enableWebP={true}
          enableResponsive={true}
          autoResize={false}
          quality={connectionQuality === 'poor' ? 60 : connectionQuality === 'good' ? 75 : 85}
          className="w-full h-64 object-cover transition-all duration-300 group-hover:scale-105"
          showLoadingProgress={true}
        />
        
        {/* Overlay with only Add to Cart action */}
        <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={productDisplayData.isOutOfStock}
              className="w-12 h-12 rounded-full bg-kgo-red flex items-center justify-center hover:bg-red-700 transition-all duration-200 hover:scale-110 disabled:bg-gray-400 disabled:cursor-not-allowed"
              aria-label="Add to cart"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </button>
          </div>
        </div>

        {/* Wishlist Button */}
        <div className="absolute top-3 right-3">
          <WishlistButton product={product} />
        </div>

        {/* Stock Badge */}
        {productDisplayData.isOutOfStock && (
          <div className="absolute top-3 left-3">
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Out of Stock
            </span>
          </div>
        )}

        {/* Featured Badge */}
        {product.isFeatured && (
          <div className="absolute top-3 left-3">
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {productDisplayData.name}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {productDisplayData.description}
        </p>
        <div className="flex items-center justify-between">
          <div>
            {product.isCombo ? (
              <div>
                <span className="text-xl font-bold text-gray-900">
                  From ₹{productDisplayData.comboBasePrice}
                </span>
                <div className="text-xs text-blue-600 font-medium">
                  Combo Product
                </div>
              </div>
            ) : (
              <span className="text-xl font-bold text-gray-900">
                ₹{productDisplayData.price}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {productDisplayData.stock > 0 ? `${productDisplayData.stock} in stock` : 'Out of stock'}
          </span>
        </div>
      </div>

      {/* Combo Ordering Modal */}
      <ComboOrderingModal
        product={product}
        isOpen={showComboModal}
        onClose={handleCloseComboModal}
        onAddToCart={handleComboAddToCart}
      />
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
