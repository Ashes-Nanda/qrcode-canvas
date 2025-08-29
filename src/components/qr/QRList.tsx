import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Eye, Edit, Trash2, ExternalLink, BarChart3, QrCode } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { QRShare } from './QRShare';
import { format } from 'date-fns';

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
            <h3 className="text-lg font-medium mb-2">No QR codes yet</h3>
            <p>Create your first QR code to get started!</p>
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
        <Badge variant="secondary" className="text-sm px-3 py-1 rounded-xl">
          {qrCodes.length} total
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {qrCodes.map((qr) => (
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
                    <DropdownMenuItem
                      onClick={() => toggleActive(qr.id, qr.is_active)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {qr.is_active ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
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
    </div>
  );
};