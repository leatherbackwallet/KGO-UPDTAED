import React, { useState, useEffect } from 'react';

interface BrowserInfo {
  name: string;
  version: string;
  isSupported: boolean;
  issues: string[];
}

const BrowserCompatibility: React.FC = () => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const detectBrowser = (): BrowserInfo => {
      const userAgent = navigator.userAgent;
      let name = 'Unknown';
      let version = 'Unknown';
      const issues: string[] = [];

      // Detect browser
      if (userAgent.includes('Chrome')) {
        name = 'Chrome';
        const match = userAgent.match(/Chrome\/(\d+)/);
        version = match ? match[1] : 'Unknown';
      } else if (userAgent.includes('Firefox')) {
        name = 'Firefox';
        const match = userAgent.match(/Firefox\/(\d+)/);
        version = match ? match[1] : 'Unknown';
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        name = 'Safari';
        const match = userAgent.match(/Version\/(\d+)/);
        version = match ? match[1] : 'Unknown';
      } else if (userAgent.includes('Edge')) {
        name = 'Edge';
        const match = userAgent.match(/Edge\/(\d+)/);
        version = match ? match[1] : 'Unknown';
      } else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) {
        name = 'Internet Explorer';
        const match = userAgent.match(/(?:MSIE |rv:)(\d+)/);
        version = match ? match[1] : 'Unknown';
      }

      // Check for compatibility issues
      const versionNum = parseInt(version);
      
      // Check for modern JavaScript features
      if (!window.Promise) {
        issues.push('Promises not supported');
      }
      
      if (!window.fetch) {
        issues.push('Fetch API not supported');
      }
      
      if (!window.localStorage) {
        issues.push('LocalStorage not supported');
      }
      
      if (!window.JSON) {
        issues.push('JSON not supported');
      }

      // Browser-specific version checks
      if (name === 'Internet Explorer') {
        issues.push('Internet Explorer is not supported. Please use a modern browser.');
      } else if (name === 'Safari' && versionNum < 12) {
        issues.push('Safari version 12 or higher is recommended');
      } else if (name === 'Firefox' && versionNum < 60) {
        issues.push('Firefox version 60 or higher is recommended');
      } else if (name === 'Chrome' && versionNum < 70) {
        issues.push('Chrome version 70 or higher is recommended');
      } else if (name === 'Edge' && versionNum < 79) {
        issues.push('Edge version 79 or higher is recommended');
      }

      const isSupported = issues.length === 0;

      return { name, version, isSupported, issues };
    };

    const info = detectBrowser();
    setBrowserInfo(info);
    
    if (!info.isSupported) {
      setShowWarning(true);
    }
  }, []);

  if (!showWarning || !browserInfo) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b border-yellow-200 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Browser Compatibility Warning
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                You're using {browserInfo.name} {browserInfo.version}. Some features may not work properly.
              </p>
              {browserInfo.issues.length > 0 && (
                <ul className="text-xs text-yellow-600 mt-1 list-disc list-inside">
                  {browserInfo.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowWarning(false)}
            className="text-yellow-600 hover:text-yellow-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrowserCompatibility; 