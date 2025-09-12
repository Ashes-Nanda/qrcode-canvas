/**
 * Authentication utilities for handling token errors and session management
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Clears all authentication data and forces a clean state
 * Useful when dealing with invalid/expired tokens
 */
export const clearAuthState = async (): Promise<void> => {
  try {
    // Sign out from Supabase (clears tokens)
    await supabase.auth.signOut();
    
    // Clear any additional localStorage items that might be related to auth
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || 
      key.includes('auth') || 
      key.includes('token') ||
      key.includes('session')
    );
    
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to clear localStorage key: ${key}`, error);
      }
    });
    
    // Clear sessionStorage as well
    const sessionKeys = Object.keys(sessionStorage).filter(key => 
      key.includes('supabase') || 
      key.includes('auth') || 
      key.includes('token') ||
      key.includes('session')
    );
    
    sessionKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to clear sessionStorage key: ${key}`, error);
      }
    });
    
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
};

/**
 * Checks if an error is an authentication/token error
 */
export const isAuthError = (error: any): boolean => {
  if (!error || typeof error.message !== 'string') return false;
  
  const authErrorMessages = [
    'Invalid Refresh Token',
    'Refresh Token Not Found',
    'JWT expired',
    'invalid_grant',
    'Session not found',
    'Unauthorized'
  ];
  
  return authErrorMessages.some(msg => error.message.includes(msg));
};

/**
 * Handles auth errors consistently across the app
 */
export const handleAuthError = async (error: any): Promise<void> => {
  if (isAuthError(error)) {
    console.warn('Auth error detected, clearing auth state:', error.message);
    await clearAuthState();
    
    // Optionally reload the page to start fresh
    // window.location.reload();
  }
};

/**
 * Safe wrapper for Supabase operations that might fail due to auth issues
 */
export const withAuthErrorHandling = async <T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error) {
    if (isAuthError(error)) {
      await handleAuthError(error);
      return fallback;
    }
    throw error; // Re-throw non-auth errors
  }
};

/**
 * Attempts to refresh the current session
 * Returns true if successful, false if refresh failed
 */
export const refreshSession = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      console.warn('Session refresh failed:', error?.message);
      return false;
    }
    
    console.log('Session refreshed successfully');
    return true;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return false;
  }
};
