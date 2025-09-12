/**
 * Quick utility to clear authentication state from browser storage
 * Call this in the browser console if you're stuck with auth errors:
 * 
 * import { clearAuthStorage } from '@/lib/clear-auth';
 * clearAuthStorage();
 */

export const clearAuthStorage = (): void => {
  console.log('🔧 Clearing all authentication storage...');
  
  // Clear localStorage
  const localKeys = Object.keys(localStorage);
  let localCleared = 0;
  localKeys.forEach(key => {
    if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
      localStorage.removeItem(key);
      localCleared++;
      console.log(`✓ Cleared localStorage: ${key}`);
    }
  });
  
  // Clear sessionStorage  
  const sessionKeys = Object.keys(sessionStorage);
  let sessionCleared = 0;
  sessionKeys.forEach(key => {
    if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
      sessionCleared++;
      console.log(`✓ Cleared sessionStorage: ${key}`);
    }
  });
  
  console.log(`✅ Cleared ${localCleared} localStorage items and ${sessionCleared} sessionStorage items`);
  console.log('🔄 Please refresh the page to complete the reset');
  
  // Option to auto-reload
  const shouldReload = confirm('Would you like to reload the page now to complete the auth reset?');
  if (shouldReload) {
    window.location.reload();
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).clearAuthStorage = clearAuthStorage;
  console.log('🛠️  Debug utility available: clearAuthStorage()');
}
