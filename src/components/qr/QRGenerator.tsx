import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, QrCode, Save } from 'lucide-react';

export const QRGenerator = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [qrType, setQrType] = useState<'static' | 'dynamic'>('static');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const generateQR = async () => {
    if (!destinationUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a destination URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const dataUrl = await QRCode.toDataURL(destinationUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#1976D2', // Material Blue primary color
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrCodeDataUrl) return;
    
    // Convert data URL to blob and download
    fetch(qrCodeDataUrl)
      .then(res => res.blob())
      .then(blob => {
        const filename = title ? `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr.png` : 'qr_code.png';
        saveAs(blob, filename);
        toast({
          title: "Downloaded!",
          description: "QR code has been downloaded successfully.",
        });
      });
  };

  const saveQR = async () => {
    if (!qrCodeDataUrl || !title.trim()) {
      toast({
        title: "Error",
        description: "Please generate a QR code and enter a title before saving",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('qr_codes')
        .insert({
          user_id: user.id,
          title,
          description,
          qr_type: qrType,
          destination_url: destinationUrl,
        });

      if (error) throw error;

      toast({
        title: "Saved!",
        description: "QR code has been saved to your dashboard.",
      });

      // Reset form
      setTitle('');
      setDescription('');
      setDestinationUrl('');
      setQrCodeDataUrl('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="elevation-2 smooth-transition hover:elevation-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            QR Code Generator
          </CardTitle>
          <CardDescription>
            Create static or dynamic QR codes for your URLs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter QR code title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="smooth-transition"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="smooth-transition"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qr-type">QR Code Type</Label>
            <Select value={qrType} onValueChange={(value: 'static' | 'dynamic') => setQrType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="static">Static QR Code</SelectItem>
                <SelectItem value="dynamic">Dynamic QR Code</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Destination URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              className="smooth-transition"
            />
          </div>

          <Button 
            onClick={generateQR} 
            disabled={loading}
            className="w-full"
            variant="hero"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate QR Code'
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="elevation-2 smooth-transition hover:elevation-3">
        <CardHeader>
          <CardTitle>Preview & Download</CardTitle>
          <CardDescription>
            Your generated QR code will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {qrCodeDataUrl ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img 
                  src={qrCodeDataUrl} 
                  alt="Generated QR Code" 
                  className="border rounded-lg elevation-1"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={downloadQR} 
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                
                <Button 
                  onClick={saveQR} 
                  disabled={saving}
                  variant="secondary"
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg">
              <div className="text-center text-muted-foreground">
                <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>QR code will appear here</p>
                <p className="text-sm">Enter a URL and click generate</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};