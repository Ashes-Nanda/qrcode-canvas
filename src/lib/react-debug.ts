// React Context Debugging Utility
// This helps identify and fix React context issues in production

export const debugReactContext = () => {
  if (typeof window === 'undefined') return;
  
  // Check if React is properly loaded
  const reactVersion = (window as any).React?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactVersion;
  
  console.log('React Debug Info:', {
    hasReact: !!(window as any).React,
    hasReactDOM: !!(window as any).ReactDOM,
    version: reactVersion,
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production'
  });

  // Check for multiple React instances
  const globalReacts = [];
  if ((window as any).React) globalReacts.push('window.React');
  if ((window as any).ReactDOM) globalReacts.push('window.ReactDOM');
  
  if (globalReacts.length > 0) {
    console.log('Found React globals:', globalReacts);
  }

  // Test createContext availability
  try {
    const React = (window as any).React;
    if (React && React.createContext) {
      const testContext = React.createContext('test');
      console.log('✅ React.createContext is working:', !!testContext);
    } else {
      console.error('❌ React.createContext is not available');
    }
  } catch (error) {
    console.error('❌ Error testing React.createContext:', error);
  }
};

// Auto-run in development
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('load', () => {
    setTimeout(() => debugReactContext(), 1000);
  });
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).debugReactContext = debugReactContext;
}
