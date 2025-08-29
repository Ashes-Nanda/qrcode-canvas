import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Eye, Edit, Trash2, ExternalLink, BarChart3 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface QRCode {
  id: string;
  title: string;
  description?: string;
  qr_type: string;
  destination_url?: string;
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
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (qrCodes.length === 0) {
    return (
      <Card className="elevation-2">
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No QR codes yet</h3>
            <p>Create your first QR code to get started!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your QR Codes</h2>
        <Badge variant="secondary" className="text-sm">
          {qrCodes.length} total
        </Badge>
      </div>

      <div className="grid gap-4">
        {qrCodes.map((qr) => (
          <Card key={qr.id} className="elevation-2 smooth-transition hover:elevation-3">
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
                {qr.destination_url && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ExternalLink className="h-4 w-4" />
                    <span className="truncate">{qr.destination_url}</span>
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};