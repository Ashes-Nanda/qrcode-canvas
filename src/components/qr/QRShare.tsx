import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, Mail, MessageSquare, Link } from 'lucide-react';

interface QRShareProps {
  qrId: string;
  title: string;
  qrType: string;
}

export const QRShare = ({ qrId, title, qrType }: QRShareProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = `${window.location.origin}/qr/${qrId}`;
  const shareText = `Check out this ${qrType} QR code: ${title}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`QR Code: ${title}`);
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaSMS = () => {
    const message = encodeURIComponent(`${shareText} ${shareUrl}`);
    window.open(`sms:?body=${message}`);
  };

  const shareViaWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code: ${title}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md rounded-2xl bg-white border-gray-200 shadow-xl">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-xl font-bold text-foreground">Share QR Code</DialogTitle>
          <DialogDescription className="text-gray-600">
            Share your QR code with others using the link below
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">QR Code Link</Label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="font-mono text-sm rounded-xl border-gray-200 h-10 px-3"
              />
              <Button
                onClick={() => copyToClipboard(shareUrl)}
                size="sm"
                variant="outline"
                className="rounded-xl border-gray-200 h-10 px-3"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={shareViaEmail}
              variant="outline"
              className="flex items-center gap-2 rounded-xl border-gray-200 h-10"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
            
            <Button
              onClick={shareViaSMS}
              variant="outline"
              className="flex items-center gap-2 rounded-xl border-gray-200 h-10"
            >
              <MessageSquare className="h-4 w-4" />
              SMS
            </Button>
          </div>

          {navigator.share && (
            <Button
              onClick={shareViaWebShare}
              className="w-full bg-primary hover:bg-primary-hover text-white rounded-xl h-10 font-medium"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share via...
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};