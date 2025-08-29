import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, TrendingUp, QrCode, Eye, MapPin, Smartphone, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  totalQRs: number;
  totalScans: number;
  activeQRs: number;
  recentScans: number;
  scansByDay: Array<{ date: string; scans: number }>;
  scansByDevice: Array<{ device: string; count: number; percentage: number }>;
  scansByCountry: Array<{ country: string; count: number }>;
  topQRs: Array<{ title: string; scans: number; qr_type: string }>;
}

export const Analytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalQRs: 0,
    totalScans: 0,
    activeQRs: 0,
    recentScans: 0,
    scansByDay: [],
    scansByDevice: [],
    scansByCountry: [],
    topQRs: [],
  });
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate date range
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Fetch QR codes stats
      const { data: qrData, error: qrError } = await supabase
        .from('qr_codes')
        .select('id, title, scan_count, is_active, qr_type')
        .eq('user_id', user.id);

      if (qrError) throw qrError;

      const totalQRs = qrData?.length || 0;
      const activeQRs = qrData?.filter(qr => qr.is_active)?.length || 0;
      const totalScans = qrData?.reduce((sum, qr) => sum + (qr.scan_count || 0), 0) || 0;

      // Fetch scan logs for detailed analytics
      const qrIds = qrData?.map(qr => qr.id) || [];
      
      let scanLogs = [];
      if (qrIds.length > 0) {
        const { data: scanData, error: scanError } = await supabase
          .from('qr_scan_logs')
          .select('*')
          .in('qr_code_id', qrIds)
          .gte('scanned_at', startDate.toISOString());

        if (scanError) throw scanError;
        scanLogs = scanData || [];
      }

      const recentScans = scanLogs.length;

      // Process scans by day
      const scansByDay = processScansByDay(scanLogs, daysBack);
      
      // Process scans by device
      const scansByDevice = processScansByDevice(scanLogs);
      
      // Process scans by country
      const scansByCountry = processScansByCountry(scanLogs);
      
      // Get top performing QRs
      const topQRs = qrData
        ?.sort((a, b) => (b.scan_count || 0) - (a.scan_count || 0))
        .slice(0, 5)
        .map(qr => ({
          title: qr.title,
          scans: qr.scan_count || 0,
          qr_type: qr.qr_type
        })) || [];

      setAnalytics({
        totalQRs,
        totalScans,
        activeQRs,
        recentScans,
        scansByDay,
        scansByDevice,
        scansByCountry,
        topQRs,
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

  const processScansByDay = (scanLogs: any[], daysBack: number) => {
    const days = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const scansForDay = scanLogs.filter(log => 
        log.scanned_at.startsWith(dateStr)
      ).length;
      
      days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        scans: scansForDay
      });
    }
    return days;
  };

  const processScansByDevice = (scanLogs: any[]) => {
    const deviceCounts = scanLogs.reduce((acc, log) => {
      const device = log.device_type || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    const total = scanLogs.length;
    return Object.entries(deviceCounts).map(([device, count]) => ({
      device: device.charAt(0).toUpperCase() + device.slice(1),
      count: count as number,
      percentage: total > 0 ? Math.round(((count as number) / total) * 100) : 0
    }));
  };

  const processScansByCountry = (scanLogs: any[]) => {
    const countryCounts = scanLogs.reduce((acc, log) => {
      const country = log.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
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

  const COLORS = ['#1976D2', '#42A5F5', '#90CAF9', '#E3F2FD'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Analytics Overview</h2>
          <p className="text-muted-foreground">
            Track your QR code performance and engagement metrics
          </p>
        </div>
        
        <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
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
          title="Recent Scans"
          value={analytics.recentScans}
          description={`Last ${timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} days`}
          icon={TrendingUp}
          trend={analytics.recentScans > 0 ? "↗ Active" : "No activity"}
        />
      </div>

      {/* Scans Over Time Chart */}
      <Card className="elevation-2">
        <CardHeader>
          <CardTitle>Scans Over Time</CardTitle>
          <CardDescription>Daily scan activity for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.scansByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.scansByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="scans" fill="#1976D2" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scan data available for the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Device Analytics */}
        <Card className="elevation-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Device Types
            </CardTitle>
            <CardDescription>Breakdown of scans by device type</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.scansByDevice.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analytics.scansByDevice}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="count"
                      nameKey="device"
                    >
                      {analytics.scansByDevice.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-2">
                  {analytics.scansByDevice.map((device, index) => (
                    <div key={device.device} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span>{device.device}</span>
                      </div>
                      <span className="font-medium">{device.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No device data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Geographic Analytics */}
        <Card className="elevation-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Geographic Distribution
            </CardTitle>
            <CardDescription>Top countries by scan count</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.scansByCountry.length > 0 ? (
              <div className="space-y-3">
                {analytics.scansByCountry.map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <span>{country.country}</span>
                    </div>
                    <span className="font-medium">{country.count} scans</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No geographic data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing QRs */}
      <Card className="elevation-2">
        <CardHeader>
          <CardTitle>Top Performing QR Codes</CardTitle>
          <CardDescription>Your most scanned QR codes</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.topQRs.length > 0 ? (
            <div className="space-y-3">
              {analytics.topQRs.map((qr, index) => (
                <div key={qr.title} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                    <div>
                      <p className="font-medium">{qr.title}</p>
                      <p className="text-sm text-muted-foreground capitalize">{qr.qr_type.replace('-', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{qr.scans}</p>
                    <p className="text-sm text-muted-foreground">scans</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <QrCode className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No QR codes with scans yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};