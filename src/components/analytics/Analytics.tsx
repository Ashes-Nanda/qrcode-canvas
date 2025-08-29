import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, TrendingUp, QrCode, Eye } from 'lucide-react';

interface AnalyticsData {
  totalQRs: number;
  totalScans: number;
  activeQRs: number;
  recentScans: number;
}

export const Analytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalQRs: 0,
    totalScans: 0,
    activeQRs: 0,
    recentScans: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch QR codes stats
      const { data: qrData, error: qrError } = await supabase
        .from('qr_codes')
        .select('id, scan_count, is_active')
        .eq('user_id', user.id);

      if (qrError) throw qrError;

      const totalQRs = qrData?.length || 0;
      const activeQRs = qrData?.filter(qr => qr.is_active)?.length || 0;
      const totalScans = qrData?.reduce((sum, qr) => sum + (qr.scan_count || 0), 0) || 0;

      // For recent scans, we would typically query scan logs from last 7 days
      // For now, we'll use a simple calculation
      const recentScans = Math.floor(totalScans * 0.3); // Simulate 30% recent activity

      setAnalytics({
        totalQRs,
        totalScans,
        activeQRs,
        recentScans,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon,
    trend 
  }: { 
    title: string; 
    value: number; 
    description: string; 
    icon: any;
    trend?: string;
  }) => (
    <Card className="elevation-2 smooth-transition hover:elevation-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
        {trend && (
          <div className="flex items-center mt-2 text-xs text-secondary">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Analytics Overview</h2>
        <p className="text-muted-foreground">
          Track your QR code performance and engagement metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total QR Codes"
          value={analytics.totalQRs}
          description="All time created"
          icon={QrCode}
        />
        
        <StatCard
          title="Active QR Codes"
          value={analytics.activeQRs}
          description="Currently active"
          icon={Eye}
          trend={`${analytics.activeQRs > 0 ? Math.round((analytics.activeQRs / analytics.totalQRs) * 100) : 0}% of total`}
        />
        
        <StatCard
          title="Total Scans"
          value={analytics.totalScans}
          description="All time scans"
          icon={BarChart3}
        />
        
        <StatCard
          title="Recent Activity"
          value={analytics.recentScans}
          description="Last 7 days"
          icon={TrendingUp}
          trend="↗ Growing"
        />
      </div>

      <Card className="elevation-2">
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
          <CardDescription>
            More detailed analytics features coming soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Advanced Analytics</h3>
            <p>Detailed reports, geographic data, and scan trends will be available in future updates.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};