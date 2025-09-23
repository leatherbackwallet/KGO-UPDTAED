import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  name: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex ${className}`}>
      <ol className="flex items-center space-x-2 text-sm">
        {/* Home Link */}
        <li>
          <div>
            <Link 
              href="/" 
              className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
              aria-label="Go to homepage"
            >
              <HomeIcon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </li>
        
        {/* Breadcrumb Items */}
        {items.map((item, index) => (
          <li key={index}>
            <div className="flex items-center">
              <ChevronRightIcon 
                className="h-4 w-4 text-gray-400 flex-shrink-0" 
                aria-hidden="true" 
              />
              {item.href && !item.current ? (
                <Link 
                  href={item.href}
                  className="ml-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 font-medium"
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ) : (
                <span 
                  className="ml-2 text-gray-900 font-medium"
                  aria-current="page"
                >
                  {item.name}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
