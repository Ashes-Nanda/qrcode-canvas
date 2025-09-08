import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { NotificationBell } from '@/components/ui/notification-bell';
import { QRList } from '@/components/qr/QRList';
import { QrCode, Plus, BarChart3, Eye, TrendingUp, MapPin, Clock, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardOverviewProps {
  onCreateClick: () => void;
  onAnalyticsClick: () => void;
}

interface DashboardStats {
  totalQRs: number;
  activeQRs: number;
  totalScans: number;
  recentScans: number;
  lastScanLocation?: string;
  lastScanTime?: Date;
}

interface UserProfile {
  full_name?: string;
  email?: string;
}

export const DashboardOverview = ({ onCreateClick, onAnalyticsClick }: DashboardOverviewProps) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalQRs: 0,
    activeQRs: 0,
    totalScans: 0,
    recentScans: 0,
  });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .single();

      setProfile(data || { email: user.email });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchDashboardStats = async () => {
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

      // Fetch recent scans (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const qrIds = qrData?.map(qr => qr.id) || [];
      let recentScans = 0;

      if (qrIds.length > 0) {
        const { data: scanData, error: scanError } = await supabase
          .from('qr_scan_logs')
          .select('id')
          .in('qr_code_id', qrIds)
          .gte('scanned_at', sevenDaysAgo.toISOString());

        if (scanError) throw scanError;
        recentScans = scanData?.length || 0;
      }

      setStats({
        totalQRs,
        activeQRs,
        totalScans,
        recentScans,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard stats",
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
    trend,
    onClick 
  }: { 
    title: string; 
    value: number; 
    description: string; 
    icon: any;
    trend?: string;
    onClick?: () => void;
  }) => (
    <Card 
      className={`rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-mono">
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            value.toLocaleString()
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
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

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Welcome Message */}
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}! 👋
              </h1>
              <p className="text-lg text-muted-foreground">
                Here's your QR performance overview
              </p>
              {stats.lastScanTime && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>Last scan: {stats.lastScanLocation}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{stats.lastScanTime.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Button 
                onClick={onCreateClick}
                className="bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create QR Code
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex justify-center">
          <SearchInput
            placeholder="Search your QR codes by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total QR Codes"
          value={stats.totalQRs}
          description="All time created"
          icon={QrCode}
        />
        
        <StatCard
          title="Active QR Codes"
          value={stats.activeQRs}
          description="Currently active"
          icon={Eye}
          trend={`${stats.totalQRs > 0 ? Math.round((stats.activeQRs / stats.totalQRs) * 100) : 0}% of total`}
        />
        
        <StatCard
          title="Total Scans"
          value={stats.totalScans}
          description="All time scans"
          icon={BarChart3}
          onClick={onAnalyticsClick}
        />
        
        <StatCard
          title="Recent Scans"
          value={stats.recentScans}
          description="Last 7 days"
          icon={TrendingUp}
          trend={stats.recentScans > 0 ? "↗ Active" : "No recent activity"}
          onClick={onAnalyticsClick}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card 
          className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
          onClick={onCreateClick}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create New QR Code
            </CardTitle>
            <CardDescription>
              Generate a new QR code for your business needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" className="w-full justify-between rounded-xl">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
          onClick={onAnalyticsClick}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              View Analytics
            </CardTitle>
            <CardDescription>
              Track performance and engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" className="w-full justify-between rounded-xl">
              View Reports
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Quick Tips
            </CardTitle>
            <CardDescription>
              Maximize your QR code effectiveness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use dynamic QRs for trackable links</li>
              <li>• Add logos for brand recognition</li>
              <li>• Monitor scan analytics regularly</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recent QR Codes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Your QR Codes</h2>
          <Button 
            variant="outline" 
            onClick={onCreateClick}
            className="rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>
        
        <QRList />
      </div>
    </div>
  );
};