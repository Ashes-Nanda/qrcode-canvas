import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Eye, Edit, Trash2, ExternalLink, BarChart3, QrCode, Copy, Grid2X2, Rows, Search, EyeIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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

  const previewDataUrl = async (id: string) => {
    const url = `${window.location.origin}/qr/${id}`;
    return await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: { dark: '#2e266d', light: '#FFFFFF' },
    });
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
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">0 Total Scans</h3>
            <p>Create your first QR to tell people about your business!</p>
          </div>
        </CardContent>
      </Card>
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((qr) => (
          <Card key={qr.id} className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {qr.title}
                    <Badge 
                      variant={qr.is_active ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {qr.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {qr.qr_type.replace('-', ' ')}
                    </Badge>
                  </CardTitle>
                  {qr.description && (
                    <CardDescription>{qr.description}</CardDescription>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => copyShareLink(qr.id)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy share link
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => toggleActive(qr.id, qr.is_active)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {qr.is_active ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(qr)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteQRCode(qr.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Hover quick preview */}
                <div className="group relative">
                  <div className="absolute right-2 -top-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={async () => {
                        const dataUrl = await previewDataUrl(qr.id);
                        const w = window.open('about:blank', '_blank');
                        if (w) {
                          w.document.write(`<img src="${dataUrl}" alt="QR Preview"/>`);
                        }
                      }}
                    >
                      <EyeIcon className="h-4 w-4 mr-1" /> Preview
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => copyShareLink(qr.id)}>
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                  </div>
                </div>
                {/* Show different content based on QR type */}
                {qr.qr_type === 'static' || qr.qr_type === 'dynamic' ? (
                  qr.destination_url && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ExternalLink className="h-4 w-4" />
                      <span className="truncate">{qr.destination_url}</span>
                    </div>
                  )
                ) : qr.qr_type === 'multi-url' ? (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{qr.multi_urls?.length || 0}</span> URLs configured
                  </div>
                ) : qr.qr_type === 'action' ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="capitalize">{qr.action_type}</span> action
                    {qr.action_data?.email && <span>→ {qr.action_data.email}</span>}
                    {qr.action_data?.phone && <span>→ {qr.action_data.phone}</span>}
                  </div>
                ) : qr.qr_type === 'geo' ? (
                  <div className="text-sm text-muted-foreground">
                    {qr.geo_data?.address || `${qr.geo_data?.latitude}, ${qr.geo_data?.longitude}`}
                  </div>
                ) : qr.qr_type === 'vcard' ? (
                  <div className="text-sm text-muted-foreground">
                    Contact card for {qr.destination_url?.match(/FN:([^\n\r]+)/)?.[1] || 'Unknown'}
                  </div>
                ) : qr.qr_type === 'text' ? (
                  <div className="text-sm text-muted-foreground">
                    <span className="truncate">{qr.destination_url?.substring(0, 50)}{qr.destination_url && qr.destination_url.length > 50 ? '...' : ''}</span>
                  </div>
                ) : qr.qr_type === 'event' ? (
                  <div className="text-sm text-muted-foreground">
                    Event: {qr.destination_url?.match(/SUMMARY:([^\n\r]+)/)?.[1] || 'Unknown Event'}
                  </div>
                ) : null}
                
                {/* QR Code URL for sharing */}
                {qr.qr_type !== 'static' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <QrCode className="h-4 w-4" />
                    <span className="truncate font-mono text-xs">
                      {window.location.origin}/qr/{qr.id}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      Scans: <span className="font-medium text-foreground">{qr.scan_count}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Created: {format(new Date(qr.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  
                  <QRShare 
                    qrId={qr.id} 
                    title={qr.title} 
                    qrType={qr.qr_type} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      ) : (
        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-primary/5 text-foreground">
              <tr>
                <th className="text-left p-3">QR Name</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Created</th>
                <th className="text-left p-3">Last Scan</th>
                <th className="text-left p-3">Active</th>
                <th className="text-left p-3">Scans</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((qr) => (
                <tr key={qr.id} className="border-t">
                  <td className="p-3 font-medium">{qr.title}</td>
                  <td className="p-3 capitalize">{qr.qr_type.replace('-', ' ')}</td>
                  <td className="p-3">{format(new Date(qr.created_at), 'MMM d, yyyy')}</td>
                  <td className="p-3">—</td>
                  <td className="p-3">{qr.is_active ? 'Active' : 'Inactive'}</td>
                  <td className="p-3">{qr.scan_count}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleEdit(qr)}>Edit</Button>
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => copyShareLink(qr.id)}>Copy</Button>
                      <Button size="sm" className="rounded-xl" onClick={() => toggleActive(qr.id, qr.is_active)}>{qr.is_active ? 'Deactivate' : 'Activate'}</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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