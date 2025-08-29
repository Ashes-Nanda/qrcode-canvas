import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRGenerator } from '@/components/qr/QRGenerator';
import { QRList } from '@/components/qr/QRList';
import { Analytics } from '@/components/analytics/Analytics';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Plus, BarChart3, List, User } from 'lucide-react';
import heroImage from '@/assets/hero-qr.jpg';

export const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-secondary">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto px-4 py-12">
          <div className="flex justify-between items-start mb-8">
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-2">QRCode Canvas Pro</h1>
              <p className="text-xl opacity-90">
                Welcome back, {profile?.full_name || 'User'}!
              </p>
              <p className="opacity-75">Create, manage, and track your QR codes</p>
            </div>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-primary"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Manage
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="animate-fade-in">
            <QRGenerator />
          </TabsContent>

          <TabsContent value="manage" className="animate-fade-in">
            <QRList />
          </TabsContent>

          <TabsContent value="analytics" className="animate-fade-in">
            <Analytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};