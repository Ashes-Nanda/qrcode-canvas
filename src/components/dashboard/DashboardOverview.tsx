import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Eye, TrendingUp, Plus, BarChart3, ExternalLink } from 'lucide-react';

interface QRCodeData {
  id: string;
  title: string;
  qr_type: string;
  scan_count: number;
  is_active: boolean;
  created_at: string;
}

interface DashboardOverviewProps {
  onCreateClick: () => void;
  onAnalyticsClick: () => void;
}

export const DashboardOverview = ({ onCreateClick, onAnalyticsClick }: DashboardOverviewProps) => {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [stats, setStats] = useState({
    totalQRs: 0,
    activeQRs: 0,
    totalScans: 0,
    recentScans: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch QR codes
      const { data: qrData, error: qrError } = await supabase
        .from('qr_codes')
        .select('id, title, qr_type, scan_count, is_active, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (qrError) throw qrError;

      setQrCodes(qrData || []);

      // Calculate stats
      const totalQRs = qrData?.length || 0;
      const activeQRs = qrData?.filter(qr => qr.is_active)?.length || 0;
      const totalScans = qrData?.reduce((sum, qr) => sum + (qr.scan_count || 0), 0) || 0;

      // Get recent scans (last 7 days)
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

        if (!scanError) {
          recentScans = scanData?.length || 0;
        }
      }

      setStats({ totalQRs, activeQRs, totalScans, recentScans });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getQRTypeColor = (type: string) => {
    const colors = {
      'static': 'bg-blue-100 text-blue-800',
      'dynamic': 'bg-green-100 text-green-800',
      'multi-url': 'bg-purple-100 text-purple-800',
      'action': 'bg-orange-100 text-orange-800',
      'geo': 'bg-red-100 text-red-800',
      'vcard': 'bg-indigo-100 text-indigo-800',
      'text': 'bg-gray-100 text-gray-800',
      'event': 'bg-pink-100 text-pink-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatQRType = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your QR codes and track performance</p>
        </div>
        <Button onClick={onCreateClick} className="bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Create QR Code
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total QR Codes</CardTitle>
            <QrCode className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-mono">{stats.totalQRs}</div>
            <p className="text-xs text-gray-500 mt-1">All time created</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active QR Codes</CardTitle>
            <Eye className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-mono">{stats.activeQRs}</div>
            <p className="text-xs text-gray-500 mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Scans</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-mono">{stats.totalScans}</div>
            <p className="text-xs text-gray-500 mt-1">All time scans</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Recent Scans</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-mono">{stats.recentScans}</div>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent QR Codes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Recent QR Codes</h2>
          <Button variant="outline" onClick={onAnalyticsClick} className="rounded-xl">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
        </div>

        {qrCodes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {qrCodes.map((qr) => (
              <Card key={qr.id} className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold truncate">{qr.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`text-xs px-2 py-1 rounded-lg ${getQRTypeColor(qr.qr_type)}`}>
                          {formatQRType(qr.qr_type)}
                        </Badge>
                        <Badge variant={qr.is_active ? "default" : "secondary"} className="text-xs px-2 py-1 rounded-lg">
                          {qr.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center ml-3">
                      <QrCode className="w-6 h-6 text-gray-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Scans</p>
                      <p className="text-lg font-bold text-mono">{qr.scan_count || 0}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-xl hover:bg-gray-50">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <QrCode className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No QR codes yet</h3>
              <p className="text-gray-500 text-center mb-4">Create your first QR code to get started</p>
              <Button onClick={onCreateClick} className="bg-primary hover:bg-primary-hover text-white rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Create QR Code
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};