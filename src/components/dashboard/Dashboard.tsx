import { useState, useEffect, Suspense, lazy } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/layout/Navigation';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { useToast } from '@/hooks/use-toast';
import { EnhancedFooter } from '@/components/layout/EnhancedFooter';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components
const QRGenerator = lazy(() => import('@/components/qr/QRGenerator').then(module => ({ default: module.QRGenerator })));
const QRList = lazy(() => import('@/components/qr/QRList').then(module => ({ default: module.QRList })));
const Analytics = lazy(() => import('@/components/analytics/Analytics').then(module => ({ default: module.Analytics })));

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

  // Component loading fallback
  const ComponentLoader = () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading component...</p>
      </div>
    </div>
  );

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
        return (
          <Suspense fallback={<ComponentLoader />}>
            <QRGenerator />
          </Suspense>
        );
      case 'manage':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <QRList />
          </Suspense>
        );
      case 'analytics':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Analytics />
          </Suspense>
        );
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
      
      <main id="main-content" className="max-w-7xl mx-auto px-6 py-8 mobile-padding mobile-container">
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>

      <EnhancedFooter />
    </div>
  );
};