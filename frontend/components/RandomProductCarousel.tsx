import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { Product } from '../types/shared';

interface RandomProductCarouselProps {
    allProducts: Product[];
    onProductClick: (product: Product) => void;
}

const RandomProductCarousel: React.FC<RandomProductCarouselProps> = ({ allProducts, onProductClick }) => {
    const [randomProducts, setRandomProducts] = useState<Product[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Function to shuffle and select random products
    const selectRandomProducts = useCallback(() => {
        if (allProducts.length > 0) {
            // Shuffle and pick 12
            const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
            setRandomProducts(shuffled.slice(0, 12));
            
            // Reset scroll position to start when products change
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            }
        }
    }, [allProducts]);

    // Initial selection and when allProducts changes
    useEffect(() => {
        selectRandomProducts();
    }, [selectRandomProducts]);

    // Rotate products every 10 seconds
    useEffect(() => {
        if (allProducts.length === 0) return;

        const rotationInterval = setInterval(() => {
            selectRandomProducts();
        }, 10000); // 10 seconds

        return () => clearInterval(rotationInterval);
    }, [selectRandomProducts, allProducts.length]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            // Scroll by one item width (approx 300px + gap)
            const scrollAmount = 316;
            const scrollBy = direction === 'left' ? -scrollAmount : scrollAmount;
            current.scrollBy({ left: scrollBy, behavior: 'smooth' });
        }
    };

    // Auto-scroll
    useEffect(() => {
        const interval = setInterval(() => {
            if (scrollContainerRef.current) {
                const { current } = scrollContainerRef;
                // Check if we are near the end
                const isNearEnd = current.scrollLeft + current.clientWidth >= current.scrollWidth - 10;

                if (isNearEnd) {
                    current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    current.scrollBy({ left: 316, behavior: 'smooth' });
                }
            }
        }, 4000); // 4 seconds
        return () => clearInterval(interval);
    }, [randomProducts]);

    if (randomProducts.length === 0) return null;

    return (
        <div className="w-full py-12 bg-gradient-to-b from-white to-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Featured Picks</h2>
                        <p className="text-gray-600">Handpicked products just for you</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => scroll('left')}
                            className="p-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="p-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {randomProducts.map((product) => (
                        <div key={product._id} className="min-w-[280px] md:min-w-[300px] snap-start">
                            <ProductCard
                                product={product}
                                onQuickView={onProductClick}
                                onClick={onProductClick}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RandomProductCarousel;
