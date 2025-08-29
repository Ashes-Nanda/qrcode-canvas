import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User } from 'lucide-react';

export const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            email: email,
            full_name: fullName,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      toast({
        title: "Account created!",
        description: "Welcome to QRCode Canvas Pro. You can now start creating QR codes.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Full Name
        </Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="smooth-transition"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signup-email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email
        </Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="smooth-transition"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signup-password" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Password
        </Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="smooth-transition"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading}
        variant="hero"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Sign Up'
        )}
      </Button>
    </form>
  );
};