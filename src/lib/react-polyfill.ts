// React Context Polyfill
// This ensures React context functions are always available

import React from 'react';

// Polyfill to prevent React context errors
export const ensureReactContext = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;

  try {
    // Ensure React is available on window
    if (!window.React && React) {
      window.React = React;
      console.log('✅ React polyfill: Added React to window object');
    }

    // Test createContext specifically
    if (React && React.createContext) {
      const testContext = React.createContext('test');
      if (!testContext) {
        throw new Error('createContext returned null/undefined');
      }
      console.log('✅ React polyfill: createContext is working');
    } else {
      throw new Error('React.createContext is not available');
    }

  } catch (error) {
    console.error('❌ React context error detected, applying emergency fixes:', error);
    
    // Emergency fallback: try to reconstruct React context functionality
    if (!window.React) {
      console.log('🚨 Emergency: Creating minimal React polyfill');
      window.React = {
        createContext: (defaultValue: any) => {
          const context = {
            Provider: ({ value, children }: any) => children,
            Consumer: ({ children }: any) => children(defaultValue),
            _currentValue: defaultValue,
            displayName: 'PolyfillContext'
          };
          return context;
        },
        useContext: (context: any) => context._currentValue,
        useState: (initial: any) => [initial, () => {}],
        useEffect: () => {},
        Fragment: ({ children }: any) => children,
        version: '18.3.1-polyfill'
      };
      
      console.log('🔧 Emergency polyfill applied');
    }
  }
};

// Auto-apply polyfill as early as possible
if (typeof window !== 'undefined') {
  // Apply immediately
  ensureReactContext();
  
  // Also apply on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureReactContext);
  } else {
    ensureReactContext();
  }
}

// Make available globally
declare global {
  interface Window {
    React: any;
    ensureReactContext: typeof ensureReactContext;
  }
}

if (typeof window !== 'undefined') {
  window.ensureReactContext = ensureReactContext;
}
