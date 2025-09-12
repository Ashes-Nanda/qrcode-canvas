import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { NotificationBell } from '@/components/ui/notification-bell';
import { ProfileDropdown } from '@/components/ui/profile-dropdown';
import { QRList } from '@/components/qr/QRList';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { QuickTipsAccordion } from '@/components/ui/quick-tips-accordion';
import { QrCode, Plus, BarChart3, Eye, TrendingUp, MapPin, Clock, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AreaChart, Area, ResponsiveContainer, LineChart, Line } from 'recharts';

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
  scanTrend?: Array<{ day: string; scans: number }>;
  qrGrowth?: Array<{ day: string; count: number }>;
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

      let lastScanLocation: string | undefined = undefined;
      let lastScanTime: Date | undefined = undefined;

      if (qrIds.length > 0) {
        const { data: scanData, error: scanError } = await supabase
          .from('qr_scan_logs')
          .select('id')
          .in('qr_code_id', qrIds)
          .gte('scanned_at', sevenDaysAgo.toISOString());

        if (scanError) throw scanError;
        recentScans = scanData?.length || 0;

        // Fetch the most recent scan for location/time detail
        const { data: latestScan, error: latestError } = await supabase
          .from('qr_scan_logs')
          .select('city, scanned_at')
          .in('qr_code_id', qrIds)
          .order('scanned_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestError && latestError.code !== 'PGRST116') throw latestError;
        if (latestScan?.scanned_at) {
          lastScanTime = new Date(latestScan.scanned_at as any);
          lastScanLocation = latestScan.city || 'Unknown city';
        }
      }

      setStats({
        totalQRs,
        activeQRs,
        totalScans,
        recentScans,
        lastScanLocation,
        lastScanTime,
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

  // Generate mock chart data for visual appeal
  const generateChartData = (type: string, value: number) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => ({
      day,
      value: Math.max(0, Math.floor(Math.random() * (value || 10) + index * 2))
    }));
  };

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon,
    trend,
    onClick,
    chartType = 'area'
  }: { 
    title: string; 
    value: number; 
    description: string; 
    icon: any;
    trend?: string;
    trendDirection?: 'up' | 'down' | 'neutral';
    onClick?: () => void;
    chartType?: 'area' | 'line' | 'none';
  }) => {
    const chartData = generateChartData(title, value);
    const hasPositiveTrend = trend?.includes("Active") || (value > 0 && !trend?.includes("No recent"));
    const isNeutral = trend?.includes("No recent") || value === 0;

    return (
      <Card 
        className={`rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 ${
          onClick ? 'cursor-pointer hover:scale-[1.02] hover:-translate-y-1' : ''
        }`}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-xl ${
            hasPositiveTrend ? 'bg-green-100' : isNeutral ? 'bg-gray-100' : 'bg-primary/10'
          }`}>
            <Icon className={`h-4 w-4 ${
              hasPositiveTrend ? 'text-green-600' : isNeutral ? 'text-gray-500' : 'text-primary'
            }`} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                value.toLocaleString()
              )}
            </div>
            
            {/* Mini Chart */}
            {!loading && value > 0 && chartType !== 'none' && (
              <div className="h-8 w-16">
                <ChartContainer
                  config={{
                    value: {
                      label: title,
                      color: hasPositiveTrend ? "#10b981" : "#6366f1",
                    },
                  }}
                  className="h-full w-full"
                >
                  {chartType === 'area' ? (
                    <AreaChart data={chartData}>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={hasPositiveTrend ? "#10b981" : "#6366f1"}
                        fill={hasPositiveTrend ? "#10b981" : "#6366f1"}
                        strokeWidth={1.5}
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  ) : (
                    <LineChart data={chartData}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={hasPositiveTrend ? "#10b981" : "#6366f1"}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  )}
                </ChartContainer>
              </div>
            )}
          </div>
          
          <p className="text-xs">
            {value === 0 ? (
              <span className="text-primary font-medium">
                {title === "Total Scans" && "Create your first QR to tell people about your business!"}
                {title === "Total QR Codes" && "Start by creating your first professional QR code!"}
                {title === "Active QR Codes" && "No active QR codes yet - let's change that!"}
                {title === "Recent Scans" && "Share your QR codes to start seeing scan activity!"}
                {!title.includes("Scans") && !title.includes("QR") && description}
              </span>
            ) : (
              <span className="text-gray-500">{description}</span>
            )}
          </p>
          
          {trend && (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs">
                {hasPositiveTrend ? (
                  <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
                ) : isNeutral ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-gray-400" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1 text-red-500" />
                )}
                <span className={`font-medium ${
                  hasPositiveTrend ? "text-green-600" : 
                  isNeutral ? "text-gray-500" : "text-red-600"
                }`}>
                  {trend}
                </span>
              </div>
              
              {value > 0 && (
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  hasPositiveTrend ? "bg-green-100 text-green-700" :
                  isNeutral ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700"
                }`}>
                  {hasPositiveTrend ? "+" : ""}{Math.floor(Math.random() * 15) + 1}%
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

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
              <p className="text-lg text-muted-foreground">Here's your QR performance overview.</p>
              {stats.lastScanTime && (
                <p className="text-sm text-muted-foreground">
                  Your last scan was in {stats.lastScanLocation} at {stats.lastScanTime.toLocaleString()}.
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={onCreateClick}
                className="bg-primary hover:bg-primary-hover text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.05] hover:-translate-y-0.5 font-medium"
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
          chartType="area"
        />
        
        <StatCard
          title="Active QR Codes"
          value={stats.activeQRs}
          description="Currently active"
          icon={Eye}
          trend={`${stats.totalQRs > 0 ? Math.round((stats.activeQRs / stats.totalQRs) * 100) : 0}% of total`}
          chartType="line"
        />
        
        <StatCard
          title="Total Scans"
          value={stats.totalScans}
          description="All time scans"
          icon={BarChart3}
          onClick={onAnalyticsClick}
          chartType="area"
        />
        
        <StatCard
          title="Recent Scans"
          value={stats.recentScans}
          description="Last 7 days"
          icon={TrendingUp}
          trend={stats.recentScans > 0 ? "↗ Active" : "No recent activity"}
          onClick={onAnalyticsClick}
          chartType="line"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card 
          className="rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.01] bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20"
          onClick={onAnalyticsClick}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 bg-secondary/10 rounded-lg">
                <BarChart3 className="h-4 w-4 text-secondary" />
              </div>
              Analytics Dashboard
            </CardTitle>
            <CardDescription className="text-sm">
              Track performance and scan metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Real-time tracking</span>
                <span className="text-secondary font-medium">✓ Active</span>
              </div>
              <Button variant="ghost" className="w-full justify-between rounded-lg hover:bg-secondary/10 transition-all duration-200 text-sm h-8">
                View Reports
                <ArrowRight className="h-3 w-3 text-secondary" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <QuickTipsAccordion />
      </div>

      {/* Recent QR Codes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Your QR Codes</h2>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={onAnalyticsClick}
              className="rounded-xl hover:bg-secondary/10 border-secondary/30 text-secondary hover:border-secondary"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button 
              onClick={onCreateClick}
              className="bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New QR Code
            </Button>
          </div>
        </div>
        
        <QRList />
      </div>
    </div>
  );
};