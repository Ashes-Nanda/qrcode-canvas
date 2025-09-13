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
  averageLatency: number;
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
    averageLatency: 0,
    scansByDay: [],
    scansByDevice: [],
    scansByCountry: [],
    topQRs: [],
  });
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [reportingFrequency, setReportingFrequency] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, reportingFrequency]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found for analytics');
        return;
      }

      console.log('Fetching analytics for user:', user.id);

      // Calculate date range
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      
      console.log('Date range:', { startDate, daysBack });

      // Fetch QR codes stats with graceful column handling
      let qrData, qrError;
      try {
        // Try with all columns first (after database migration)
        const result = await supabase
          .from('qr_codes')
          .select('id, title, scan_count, is_active, qr_type, form_data, content_preview')
          .eq('user_id', user.id);
        qrData = result.data;
        qrError = result.error;
      } catch (error) {
        console.log('Full column query failed, trying basic columns:', error);
        // Fallback to basic columns if the above fails
        const result = await supabase
          .from('qr_codes')
          .select('id, title, scan_count, is_active, qr_type')
          .eq('user_id', user.id);
        qrData = result.data;
        qrError = result.error;
      }

      if (qrError) {
        console.error('Error fetching QR codes for analytics:', qrError);
        throw qrError;
      }
      
      console.log('QR codes found for analytics:', qrData?.length || 0);

      const totalQRs = qrData?.length || 0;
      const activeQRs = qrData?.filter(qr => qr.is_active)?.length || 0;
      const totalScans = qrData?.reduce((sum, qr) => sum + (qr.scan_count || 0), 0) || 0;

      // Fetch scan logs for detailed analytics
      const qrIds = qrData?.map(qr => qr.id) || [];
      console.log('QR IDs for scan logs:', qrIds.length);
      
      let scanLogs = [];
      if (qrIds.length > 0) {
        try {
          const { data: scanData, error: scanError } = await supabase
            .from('qr_scan_logs')
            .select('*')
            .in('qr_code_id', qrIds)
            .gte('scanned_at', startDate.toISOString());

          if (scanError) {
            console.error('Error fetching scan logs:', scanError);
            // Don't throw here - continue with empty scan logs
            scanLogs = [];
          } else {
            scanLogs = scanData || [];
            console.log('Scan logs found:', scanLogs.length);
          }
        } catch (error) {
          console.error('Exception fetching scan logs:', error);
          scanLogs = [];
        }
      }

      const recentScans = scanLogs.length;

      // Calculate average latency (handle missing scan_latency column gracefully)
      const latencies = scanLogs.filter(log => log.scan_latency && typeof log.scan_latency === 'number').map(log => log.scan_latency);
      const averageLatency = latencies.length > 0 
        ? Math.round(latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length)
        : 0;
      
      console.log('Analytics calculated:', { totalQRs: qrData?.length || 0, recentScans, averageLatency });

      // Process scans by time period
      const scansByDay = processScansByTimePeriod(scanLogs, daysBack, reportingFrequency);
      
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
        averageLatency,
        scansByDay,
        scansByDevice,
        scansByCountry,
        topQRs,
      });
    } catch (error: any) {
      console.error('Analytics error:', error);
      toast({
        title: "Error",
        description: `Failed to fetch analytics: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
      
      // Set default analytics data on error
      setAnalytics({
        totalQRs: 0,
        totalScans: 0,
        activeQRs: 0,
        recentScans: 0,
        averageLatency: 0,
        scansByDay: [],
        scansByDevice: [],
        scansByCountry: [],
        topQRs: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const processScansByTimePeriod = (scanLogs: any[], daysBack: number, frequency: string) => {
    const periods = [];
    
    switch (frequency) {
      case 'hourly':
        // Last 24 hours by hour
        for (let i = 23; i >= 0; i--) {
          const date = new Date();
          date.setHours(date.getHours() - i);
          const hourStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
          const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
          
          const scansForHour = scanLogs.filter(log => {
            const scanTime = new Date(log.scanned_at);
            return scanTime >= hourStart && scanTime < hourEnd;
          }).length;
          
          periods.push({
            date: hourStart.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
            scans: scansForHour
          });
        }
        break;
        
      case 'weekly':
        // Last weeks
        const weeksToShow = Math.ceil(daysBack / 7);
        for (let i = weeksToShow - 1; i >= 0; i--) {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          
          const scansForWeek = scanLogs.filter(log => {
            const scanTime = new Date(log.scanned_at);
            return scanTime >= weekStart && scanTime < weekEnd;
          }).length;
          
          periods.push({
            date: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            scans: scansForWeek
          });
        }
        break;
        
      case 'monthly':
        // Last months
        const monthsToShow = Math.ceil(daysBack / 30);
        for (let i = monthsToShow - 1; i >= 0; i--) {
          const monthStart = new Date();
          monthStart.setMonth(monthStart.getMonth() - i);
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          
          const scansForMonth = scanLogs.filter(log => {
            const scanTime = new Date(log.scanned_at);
            return scanTime >= monthStart && scanTime < monthEnd;
          }).length;
          
          periods.push({
            date: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            scans: scansForMonth
          });
        }
        break;
        
      default: // daily
        for (let i = daysBack - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const scansForDay = scanLogs.filter(log => 
            log.scanned_at.startsWith(dateStr)
          ).length;
          
          periods.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            scans: scansForDay
          });
        }
    }
    
    return periods;
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
    <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-mono">{value.toLocaleString()}</div>
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-gray-600">
            Track your QR code performance and engagement metrics
          </p>
        </div>
        
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
            <SelectTrigger className="w-36 rounded-xl border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={reportingFrequency} onValueChange={(value: 'hourly' | 'daily' | 'weekly' | 'monthly') => setReportingFrequency(value)}>
            <SelectTrigger className="w-32 rounded-xl border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
        
        <StatCard
          title="Avg Latency"
          value={analytics.averageLatency}
          description="Milliseconds"
          icon={TrendingUp}
          trend={analytics.averageLatency < 500 ? "✓ Under 500ms" : "⚠ Over 500ms"}
        />
      </div>

      {/* Scans Over Time Chart */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Scans Over Time</CardTitle>
          <CardDescription className="text-body">
            {reportingFrequency.charAt(0).toUpperCase() + reportingFrequency.slice(1)} scan activity for the selected period
          </CardDescription>
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
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Smartphone className="h-5 w-5" />
              Device Types
            </CardTitle>
            <CardDescription className="text-body">Breakdown of scans by device type</CardDescription>
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
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Globe className="h-5 w-5" />
              Geographic Distribution
            </CardTitle>
            <CardDescription className="text-body">Top countries by scan count</CardDescription>
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
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Top Performing QR Codes</CardTitle>
          <CardDescription className="text-body">Your most scanned QR codes</CardDescription>
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