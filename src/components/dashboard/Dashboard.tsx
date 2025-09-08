import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/layout/Navigation';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { QRGenerator } from '@/components/qr/QRGenerator';
import { QRList } from '@/components/qr/QRList';
import { Analytics } from '@/components/analytics/Analytics';
import { useToast } from '@/hooks/use-toast';
import { EnhancedFooter } from '@/components/layout/EnhancedFooter';

export const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
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

      setProfile({ ...data, email: user.email });
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview 
            onCreateClick={() => setActiveTab('create')}
            onAnalyticsClick={() => setActiveTab('analytics')}
          />
        );
      case 'create':
        return <QRGenerator />;
      case 'manage':
        return <QRList />;
      case 'analytics':
        return <Analytics />;
      default:
        return <DashboardOverview onCreateClick={() => setActiveTab('create')} onAnalyticsClick={() => setActiveTab('analytics')} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        profile={profile}
      />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>

      <EnhancedFooter />
    </div>
  );
};