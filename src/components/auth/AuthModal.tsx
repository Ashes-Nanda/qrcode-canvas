import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthModal = ({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(defaultMode);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-white border-gray-200 shadow-xl">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-2xl font-bold text-foreground">
            {authMode === 'login' ? 'Welcome back' : 'Create account'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {authMode === 'login' 
              ? 'Sign in to your account to continue' 
              : 'Sign up to start creating QR codes'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {authMode === 'login' ? <LoginForm /> : <SignUpForm />}
          
          <div className="text-center pt-4 border-t border-gray-100">
            <Button
              variant="link"
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-sm text-primary hover:text-primary-hover"
            >
              {authMode === 'login' 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};