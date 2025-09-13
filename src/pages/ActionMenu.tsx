import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Globe, MessageSquare, MapPin, User, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRAction {
  id: string;
  actionType: 'call' | 'website' | 'whatsapp' | 'directions' | 'vcard';
  actionData: any;
  displayOrder: number;
}

interface QRCodeData {
  id: string;
  title: string;
  description?: string;
  actions: QRAction[];
}

const actionIcons = {
  call: Phone,
  website: Globe,
  whatsapp: MessageSquare,
  directions: MapPin,
  vcard: User,
};

const actionLabels = {
  call: 'Call',
  website: 'Visit Website',
  whatsapp: 'WhatsApp',
  directions: 'Get Directions',
  vcard: 'Save Contact',
};

const ActionMenu = () => {
  const { qrId } = useParams<{ qrId: string }>();
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (qrId) {
      fetchQRData(qrId);
    }
  }, [qrId]);

  const fetchQRData = async (id: string) => {
    try {
      // Fetch QR code data
      const { data: qrCode, error: qrError } = await supabase
        .from('qr_codes')
        .select('id, title, description')
        .eq('id', id)
        .eq('qr_type', 'multi-action')
        .single();

      if (qrError) throw qrError;

      // Fetch actions
      const { data: actions, error: actionsError } = await supabase
        .from('qr_actions')
        .select('*')
        .eq('qr_code_id', id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (actionsError) throw actionsError;

      setQrData({
        ...qrCode,
        actions: actions || [],
      });

      // Track scan
      await supabase.rpc('increment_scan_count', { qr_id: id });
    } catch (error) {
      console.error('Error fetching QR data:', error);
      toast({
        title: 'Error',
        description: 'Could not load action menu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: QRAction) => {
    const { actionType, actionData } = action;

    switch (actionType) {
      case 'call':
        window.location.href = `tel:${actionData.phone}`;
        break;

      case 'website':
        window.open(actionData.url, '_blank', 'noopener,noreferrer');
        break;

      case 'whatsapp':
        const whatsappUrl = `https://wa.me/${actionData.phone.replace(/[^\d+]/g, '')}${
          actionData.message ? `?text=${encodeURIComponent(actionData.message)}` : ''
        }`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        break;

      case 'directions':
        let mapsUrl = '';
        if (actionData.latitude && actionData.longitude) {
          mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${actionData.latitude},${actionData.longitude}`;
        } else if (actionData.address) {
          mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(actionData.address)}`;
        }
        if (mapsUrl) {
          window.open(mapsUrl, '_blank', 'noopener,noreferrer');
        }
        break;

      case 'vcard':
        const vCard = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          actionData.firstName || actionData.lastName ? `FN:${(actionData.firstName || '')} ${(actionData.lastName || '')}`.trim() : '',
          actionData.firstName ? `N:${actionData.lastName || ''};${actionData.firstName};;;` : '',
          actionData.company ? `ORG:${actionData.company}` : '',
          actionData.phone ? `TEL:${actionData.phone}` : '',
          actionData.email ? `EMAIL:${actionData.email}` : '',
          'END:VCARD'
        ].filter(line => line && !line.endsWith(':')).join('\n');

        const blob = new Blob([vCard], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${actionData.firstName || 'contact'}.vcf`;
        link.click();
        URL.revokeObjectURL(url);
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!qrData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">QR Code Not Found</h1>
          <p className="text-gray-600">This QR code may have been deleted or is not a multi-action code.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{qrData.title}</h1>
          {qrData.description && (
            <p className="text-gray-600 text-sm">{qrData.description}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="max-w-md mx-auto p-4">
        <div className="space-y-3">
          {qrData.actions.map((action) => {
            const IconComponent = actionIcons[action.actionType];
            return (
              <Card key={action.id} className="overflow-hidden shadow-lg border-0 bg-white">
                <CardContent className="p-0">
                  <Button
                    onClick={() => handleAction(action)}
                    className="w-full h-16 bg-white hover:bg-gray-50 text-left flex items-center justify-start px-6 rounded-xl transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-0"
                    variant="ghost"
                  >
                    <div className="flex items-center space-x-4 w-full">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 text-base">
                          {actionLabels[action.actionType]}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {action.actionType === 'call' && action.actionData.phone}
                          {action.actionType === 'website' && action.actionData.url}
                          {action.actionType === 'whatsapp' && action.actionData.phone}
                          {action.actionType === 'directions' && (action.actionData.address || 'Open in Maps')}
                          {action.actionType === 'vcard' && 
                            `${action.actionData.firstName || ''} ${action.actionData.lastName || ''}`.trim()
                          }
                        </div>
                      </div>
                      <div className="text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Powered by QRCode Canvas Pro
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActionMenu;
