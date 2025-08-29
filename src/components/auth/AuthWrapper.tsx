import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">QRCode Canvas Pro</h1>
            <p className="text-muted-foreground mt-2">Create, manage, and track your QR codes</p>
          </div>
          
          <Card className="elevation-3">
            <CardHeader>
              <CardTitle>{authMode === 'login' ? 'Welcome back' : 'Create account'}</CardTitle>
              <CardDescription>
                {authMode === 'login' 
                  ? 'Sign in to your account to continue' 
                  : 'Sign up to start creating QR codes'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authMode === 'login' ? <LoginForm /> : <SignUpForm />}
              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                >
                  {authMode === 'login' 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};