import { useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { LandingPage } from '@/components/landing/LandingPage';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAuthError = (error: AuthError | Error) => {
    console.error('Auth error:', error);
    
    // Handle specific authentication errors
    if (error.message.includes('Invalid Refresh Token') || error.message.includes('Refresh Token Not Found')) {
      // Clear any invalid session data
      supabase.auth.signOut();
      setAuthError('Your session has expired. Please sign in again.');
      toast({
        title: "⚠️ Session Expired",
        description: "Your login session has expired. Please sign in again to continue.",
        variant: "destructive",
        duration: 5000
      });
    } else if (error.message.includes('JWT expired')) {
      supabase.auth.signOut();
      setAuthError('Your session has expired. Please sign in again.');
      toast({
        title: "⚠️ Session Expired", 
        description: "Your authentication token has expired. Please sign in again.",
        variant: "destructive",
        duration: 5000
      });
    } else {
      setAuthError('An authentication error occurred. Please try signing in again.');
      toast({
        title: "🔐 Authentication Error",
        description: "There was a problem with your authentication. Please try signing in again.",
        variant: "destructive",
        duration: 5000
      });
    }
    
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Clear any previous auth errors on successful auth
        if (session && event === 'SIGNED_IN') {
          setAuthError(null);
        }
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
        
        if (event === 'SIGNED_OUT') {
          setAuthError(null); // Clear errors on explicit sign out
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session with error handling
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          handleAuthError(error);
          return;
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          // If we have a session, try to refresh it to ensure it's valid
          if (session) {
            try {
              await supabase.auth.refreshSession();
            } catch (refreshError) {
              console.warn('Token refresh failed, but continuing with existing session:', refreshError);
            }
          }
        }
      } catch (error) {
        if (mounted) {
          handleAuthError(error as AuthError);
        }
      }
    };
    
    initializeAuth();
    
    // Handle unhandled promise rejections that might be auth-related
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Invalid Refresh Token') || 
          event.reason?.message?.includes('JWT expired')) {
        event.preventDefault(); // Prevent console spam
        handleAuthError(event.reason);
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your session...</p>
        </div>
      </div>
    );
  }

  // Show auth error state with clear action
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Authentication Required</h2>
            <p className="text-sm text-muted-foreground">{authError}</p>
          </div>
          <button
            onClick={() => {
              setAuthError(null);
              setLoading(true);
              // Force a fresh auth check
              supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
              });
            }}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <>{children}</>;
};