/**
 * AdminTabs Component
 * Reusable pill-style tab switcher for admin panel.
 * - Accepts tab labels and manages active state.
 * - Styled to match modern pill tab UI (see Figma/screenshot).
 * - Use for toggling between views (e.g., Annual/Monthly, Users/Products).
 */

import React from 'react';

interface AdminTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
  notificationBadges?: { [key: string]: number };
}

const AdminTabs: React.FC<AdminTabsProps> = ({ tabs, activeTab, onTabChange, className, notificationBadges = {} }) => (
          <div
          className={`inline-flex bg-gray-50 rounded-full p-1 transition-colors ${className || ''}`}
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`
                px-6 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${activeTab === tab
                  ? 'bg-kgo-red text-white shadow-sm font-semibold'
                  : 'bg-transparent text-gray-400 hover:text-kgo-red hover:bg-red-50'}
              `}
              style={{ minWidth: 90 }}
              aria-selected={activeTab === tab}
              onClick={() => onTabChange(tab)}
              role="tab"
            >
        <span className="flex items-center">
          {tab}
          {notificationBadges[tab] && notificationBadges[tab] > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
              {notificationBadges[tab] > 99 ? '99+' : notificationBadges[tab]}
            </span>
          )}
        </span>
      </button>
    ))}
  </div>
);

export default AdminTabs; 