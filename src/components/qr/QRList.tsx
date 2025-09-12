import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Eye, Edit, Trash2, ExternalLink, BarChart3, QrCode, Copy, Grid2X2, Rows, Search, EyeIcon, Download, Share2, Calendar, Activity } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EnhancedEmptyState } from '@/components/ui/enhanced-empty-state';
import { QRShare } from './QRShare';
import { QREditModal } from './QREditModal';
import { format } from 'date-fns';
import QRCode from 'qrcode';

interface QRCode {
  id: string;
  title: string;
  description?: string;
  qr_type: string;
  destination_url?: string;
  multi_urls?: any;
  action_type?: string;
  action_data?: any;
  geo_data?: any;
  is_active: boolean;
  scan_count: number;
  created_at: string;
  updated_at: string;
}

// Component for displaying QR code images
const QRCodeImage = ({ qrId, className }: { qrId: string; className?: string }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateQRImage = async () => {
      try {
        const url = `${window.location.origin}/qr/${qrId}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: { dark: '#2e266d', light: '#FFFFFF' },
          errorCorrectionLevel: 'M'
        });
        setQrDataUrl(dataUrl);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      } finally {
        setLoading(false);
      }
    };
    generateQRImage();
  }, [qrId]);

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <QrCode className="w-8 h-8 text-gray-400 animate-pulse" />
      </div>
    );
  }

  return (
    <img 
      src={qrDataUrl} 
      alt="QR Code" 
      className={`rounded-lg ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

export const QRList = () => {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'scans_desc' | 'scans_asc'>('date_desc');
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const fetchQRCodes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQrCodes(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch QR codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteQRCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('qr_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setQrCodes(qrCodes.filter(qr => qr.id !== id));
      toast({
        title: "Deleted",
        description: "QR code has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      setQrCodes(qrCodes.map(qr => 
        qr.id === id ? { ...qr, is_active: !currentActive } : qr
      ));

      toast({
        title: currentActive ? "Deactivated" : "Activated",
        description: `QR code has been ${currentActive ? 'deactivated' : 'activated'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (qr: QRCode) => {
    setSelectedQR(qr);
    setEditModalOpen(true);
  };

  const handleEditUpdate = () => {
    fetchQRCodes(); // Refresh the list
    setEditModalOpen(false);
    setSelectedQR(null);
  };

  const filtered = qrCodes
    .filter((qr) => typeFilter === 'all' ? true : qr.qr_type === typeFilter)
    .filter((qr) =>
      search.trim() ?
        (qr.title?.toLowerCase().includes(search.toLowerCase()) || qr.id.includes(search)) : true
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'scans_desc':
          return (b.scan_count || 0) - (a.scan_count || 0);
        case 'scans_asc':
          return (a.scan_count || 0) - (b.scan_count || 0);
        case 'date_desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const copyShareLink = async (id: string) => {
    const link = `${window.location.origin}/qr/${id}`;
    await navigator.clipboard.writeText(link);
    toast({ title: 'Copied', description: 'Share link copied to clipboard.' });
  };

  const downloadQRCode = async (id: string, title: string) => {
    try {
      const url = `${window.location.origin}/qr/${id}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: { dark: '#2e266d', light: '#FFFFFF' },
        errorCorrectionLevel: 'H'
      });
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ 
        title: 'Downloaded', 
        description: `QR code for "${title}" has been downloaded.` 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to download QR code.',
        variant: 'destructive' 
      });
    }
  };

  const getQRContent = (qr: QRCode) => {
    switch (qr.qr_type) {
      case 'static':
      case 'dynamic':
        return qr.destination_url || '';
      case 'multi-url':
        return `${qr.multi_urls?.length || 0} URLs configured`;
      case 'action':
        const actionText = qr.action_type ? `${qr.action_type} action` : 'Action';
        if (qr.action_data?.email) return `${actionText} → ${qr.action_data.email}`;
        if (qr.action_data?.phone) return `${actionText} → ${qr.action_data.phone}`;
        return actionText;
      case 'geo':
        return qr.geo_data?.address || `${qr.geo_data?.latitude}, ${qr.geo_data?.longitude}`;
      case 'vcard':
        return qr.destination_url?.match(/FN:([^\n\r]+)/)?.[1] || 'Contact card';
      case 'text':
        return qr.destination_url?.substring(0, 100) + (qr.destination_url && qr.destination_url.length > 100 ? '...' : '') || '';
      case 'event':
        return qr.destination_url?.match(/SUMMARY:([^\n\r]+)/)?.[1] || 'Event';
      default:
        return qr.destination_url || '';
    }
  };

  const getQRTypeIcon = (type: string) => {
    switch (type) {
      case 'static':
      case 'dynamic':
        return <ExternalLink className="w-3 h-3" />;
      case 'multi-url':
        return <Copy className="w-3 h-3" />;
      case 'action':
        return <Activity className="w-3 h-3" />;
      case 'geo':
        return <QrCode className="w-3 h-3" />;
      case 'vcard':
        return <Eye className="w-3 h-3" />;
      case 'text':
        return <Edit className="w-3 h-3" />;
      case 'event':
        return <Calendar className="w-3 h-3" />;
      default:
        return <QrCode className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Manage QR Codes</h1>
          <p className="text-gray-600">View and manage all your QR codes</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse rounded-2xl">
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

  if (qrCodes.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Manage QR Codes</h1>
          <p className="text-gray-600">View and manage all your QR codes</p>
        </div>
        <EnhancedEmptyState 
          variant="qr-list"
          onAction={() => {
            // Navigate to QR generator - this would be handled by the parent component
            window.location.hash = '#/dashboard/generator';
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Manage QR Codes</h1>
          <p className="text-gray-600">View and manage all your QR codes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm px-3 py-1 rounded-xl">
            {filtered.length} shown
          </Badge>
          <Button variant={viewMode === 'grid' ? 'secondary' : 'outline'} size="sm" className="rounded-xl" onClick={() => setViewMode('grid')}>
            <Grid2X2 className="h-4 w-4 mr-1" /> Grid
          </Button>
          <Button variant={viewMode === 'table' ? 'secondary' : 'outline'} size="sm" className="rounded-xl" onClick={() => setViewMode('table')}>
            <Rows className="h-4 w-4 mr-1" /> Table
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="pl-9 pr-3 py-2 text-sm rounded-xl border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Search by name or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 text-sm rounded-xl border border-input bg-background"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All types</option>
          <option value="static">Static</option>
          <option value="dynamic">Dynamic</option>
          <option value="multi-url">Multi-URL</option>
          <option value="action">Action</option>
          <option value="geo">Geo</option>
          <option value="vcard">vCard</option>
          <option value="text">Text</option>
          <option value="event">Event</option>
        </select>
        <select
          className="px-3 py-2 text-sm rounded-xl border border-input bg-background"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="date_desc">Newest</option>
          <option value="date_asc">Oldest</option>
          <option value="scans_desc">Most scans</option>
          <option value="scans_asc">Least scans</option>
        </select>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Gallery View - Visual QR Code Cards */}
          {filtered.map((qr) => (
            <Card key={qr.id} className="rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group border-0 bg-white">
              {/* QR Code Preview - Hero Section */}
              <div className="relative bg-gradient-to-br from-primary/5 to-primary/10 p-6">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => handleEdit(qr)}>
                        <Edit className="mr-2 h-4 w-4" />Edit QR
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadQRCode(qr.id, qr.title)}>
                        <Download className="mr-2 h-4 w-4" />Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyShareLink(qr.id)}>
                        <Copy className="mr-2 h-4 w-4" />Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleActive(qr.id, qr.is_active)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {qr.is_active ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteQRCode(qr.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Actual QR Code Image */}
                <div className="flex justify-center">
                  <div className="relative group/qr">
                    <QRCodeImage 
                      qrId={qr.id} 
                      className="w-24 h-24 bg-white shadow-sm border-2 border-white cursor-pointer transition-transform duration-200 hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/qr:bg-black/10 transition-colors duration-200 rounded-lg flex items-center justify-center">
                      <EyeIcon className="w-4 h-4 text-white opacity-0 group-hover/qr:opacity-100 transition-opacity duration-200" />
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-5 space-y-4">
                {/* QR Title & Status */}
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg text-foreground truncate" title={qr.title}>
                    {qr.title}
                  </h3>
                  
                  {/* Tags Row */}
                  <div className="flex flex-wrap justify-center gap-1.5">
                    <Badge 
                      variant={qr.is_active ? 'default' : 'secondary'}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        qr.is_active 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {qr.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-2.5 py-1 rounded-full border-primary/30 text-primary bg-primary/5 hover:bg-primary/10">
                      {getQRTypeIcon(qr.qr_type)}
                      <span className="ml-1 capitalize">{qr.qr_type.replace('-', ' ')}</span>
                    </Badge>
                  </div>
                </div>

                {/* Content Preview */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground text-center px-2">
                    <span className="line-clamp-2" title={getQRContent(qr)}>
                      {getQRContent(qr)}
                    </span>
                  </div>
                  
                  {/* QR Link Display */}
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <QrCode className="w-3 h-3" />
                      <span className="font-mono truncate">
                        {window.location.origin.replace('https://', '').replace('http://', '')}/qr/{qr.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 rounded-xl h-9 text-xs"
                    onClick={() => copyShareLink(qr.id)}
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy Link
                  </Button>
                  <QRShare 
                    qrId={qr.id} 
                    title={qr.title} 
                    qrType={qr.qr_type} 
                  />
                </div>

                {/* Stats Footer */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    <span>{qr.scan_count} scans</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(qr.created_at), 'MMM d')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Enhanced Table View */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-gray-100">
                <tr className="text-sm font-semibold text-foreground">
                  <th className="text-left p-4 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-primary" />
                      QR Code
                    </div>
                  </th>
                  <th className="text-left p-4 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      {getQRTypeIcon('static')}
                      Type
                    </div>
                  </th>
                  <th className="text-left p-4 min-w-[300px]">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-primary" />
                      Content
                    </div>
                  </th>
                  <th className="text-left p-4 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Created
                    </div>
                  </th>
                  <th className="text-left p-4 min-w-[100px]">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Scans
                    </div>
                  </th>
                  <th className="text-left p-4 min-w-[100px]">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      Status
                    </div>
                  </th>
                  <th className="text-right p-4 min-w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((qr, index) => (
                  <tr key={qr.id} className={`hover:bg-gray-50/50 transition-colors duration-150 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}>
                    {/* QR Code & Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex-shrink-0 overflow-hidden">
                          <QRCodeImage qrId={qr.id} className="w-full h-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm truncate" title={qr.title}>
                            {qr.title}
                          </h3>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            /qr/{qr.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Type */}
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs px-2 py-1 rounded-full border-primary/30 text-primary bg-primary/5">
                        {getQRTypeIcon(qr.qr_type)}
                        <span className="ml-1 capitalize">{qr.qr_type.replace('-', ' ')}</span>
                      </Badge>
                    </td>
                    
                    {/* Content */}
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        <span className="line-clamp-2" title={getQRContent(qr)}>
                          {getQRContent(qr)}
                        </span>
                      </div>
                    </td>
                    
                    {/* Created Date */}
                    <td className="p-4">
                      <div className="text-sm text-foreground">
                        {format(new Date(qr.created_at), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(qr.created_at), 'h:mm a')}
                      </div>
                    </td>
                    
                    {/* Scans */}
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{qr.scan_count}</span>
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="p-4">
                      <Badge 
                        variant={qr.is_active ? 'default' : 'secondary'}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          qr.is_active 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {qr.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    
                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                          onClick={() => handleEdit(qr)}
                          title="Edit QR"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                          onClick={() => downloadQRCode(qr.id, qr.title)}
                          title="Download QR"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                          onClick={() => copyShareLink(qr.id)}
                          title="Copy Link"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => toggleActive(qr.id, qr.is_active)}>
                              <Eye className="mr-2 h-4 w-4" />
                              {qr.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteQRCode(qr.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          <div className="bg-gray-50/50 px-4 py-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Showing {filtered.length} QR codes</span>
              <div className="flex items-center gap-4">
                <span>Total scans: {filtered.reduce((sum, qr) => sum + qr.scan_count, 0)}</span>
                <span>Active: {filtered.filter(qr => qr.is_active).length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <QREditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedQR(null);
        }}
        qrCode={selectedQR}
        onUpdate={handleEditUpdate}
      />
    </div>
  );
};