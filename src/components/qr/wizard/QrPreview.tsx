import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileDown, FileText, Save, Loader2, Share2, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCodeLib from 'qrcode';
import { supabase } from '@/integrations/supabase/client';
import { WizardState } from './WizardLayout';

interface QrPreviewProps {
  qrType: string;
  formData: Record<string, any>;
  style: WizardState['style'];
  previewMode?: boolean;
}

export const QrPreview: React.FC<QrPreviewProps> = ({
  qrType,
  formData,
  style,
  previewMode = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedQrId, setSavedQrId] = useState<string | null>(null);
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR content based on type and form data
  const generateQrContent = (): string => {
    switch (qrType) {
      case 'url':
        return formData.url || '';
      
      case 'text':
        return formData.text || '';
      
      case 'contact':
        return generateVCard(formData);
      
      case 'sms':
        return `SMS:${formData.phone}:${formData.message}`;
      
      case 'email':
        return `mailto:${formData.email}?subject=${encodeURIComponent(formData.subject || '')}&body=${encodeURIComponent(formData.body || '')}`;
      
      case 'phone':
        return `tel:${formData.phone}`;
      
      case 'location':
        const location = `${formData.latitude},${formData.longitude}`;
        return formData.placeName 
          ? `geo:${location}?q=${location}(${encodeURIComponent(formData.placeName)})`
          : `geo:${location}`;
      
      case 'app':
        // For app QR codes, prioritize iOS URL if available, then Android
        return formData.iosUrl || formData.androidUrl || '';
      
      case 'socials':
        return generateSocialUrl(formData);
      
      case 'event':
        return generateEventVCal(formData);
      
      default:
        return '';
    }
  };

  const generateVCard = (data: any): string => {
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      data.firstName || data.lastName ? `FN:${(data.firstName || '')} ${(data.lastName || '')}`.trim() : '',
      data.firstName ? `N:${data.lastName || ''};${data.firstName};;;` : '',
      data.company ? `ORG:${data.company}` : '',
      data.jobTitle ? `TITLE:${data.jobTitle}` : '',
      data.phone ? `TEL:${data.phone}` : '',
      data.email ? `EMAIL:${data.email}` : '',
      data.website ? `URL:${data.website}` : '',
      data.address ? `ADR:;;${data.address};;;;` : '',
      'END:VCARD'
    ].filter(line => line && !line.endsWith(':')).join('\\n');
    
    return vCard;
  };

  const generateSocialUrl = (data: any): string => {
    const { platform, username, profileUrl } = data;
    
    if (profileUrl && profileUrl.trim()) {
      return profileUrl.startsWith('http') ? profileUrl : `https://${profileUrl}`;
    }
    
    const cleanUsername = username?.replace('@', '') || '';
    
    switch (platform) {
      case 'instagram': return `https://instagram.com/${cleanUsername}`;
      case 'facebook': return `https://facebook.com/${cleanUsername}`;
      case 'linkedin': return `https://linkedin.com/in/${cleanUsername}`;
      case 'twitter': return `https://twitter.com/${cleanUsername}`;
      case 'tiktok': return `https://tiktok.com/@${cleanUsername}`;
      case 'youtube': return `https://youtube.com/@${cleanUsername}`;
      case 'snapchat': return `https://snapchat.com/add/${cleanUsername}`;
      default: return `https://${platform}.com/${cleanUsername}`;
    }
  };

  const generateEventVCal = (data: any): string => {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const event = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//QR Canvas Pro//Event//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${data.title}`,
      data.description ? `DESCRIPTION:${data.description}` : '',
      data.location ? `LOCATION:${data.location}` : '',
      `DTSTART:${formatDate(data.startDate)}`,
      data.endDate ? `DTEND:${formatDate(data.endDate)}` : '',
      `DTSTAMP:${formatDate(new Date().toISOString())}`,
      `UID:${Date.now()}@qrcanvaspro.com`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line && !line.endsWith(':')).join('\\n');
    
    return event;
  };

  const generateQrCode = async () => {
    if (!qrType || !formData) return;

    setIsGenerating(true);
    try {
      const content = generateQrContent();
      if (!content) {
        setQrDataUrl('');
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      await QRCodeLib.toCanvas(canvas, content, {
        width: previewMode ? 200 : 300,
        margin: 2,
        color: {
          dark: style.fgColor,
          light: style.bgColor,
        },
        errorCorrectionLevel: 'M',
      });

      // If logo is present, overlay it
      if (style.logoDataUrl && !previewMode) {
        await overlayLogo(canvas);
      }

      const dataUrl = canvas.toDataURL('image/png');
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const overlayLogo = async (canvas: HTMLCanvasElement): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !style.logoDataUrl) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        const logoSize = (canvas.width * style.logoSize) / 100;
        const x = (canvas.width - logoSize) / 2;
        const y = (canvas.height - logoSize) / 2;

        // Create a white background circle for the logo
        const padding = logoSize * 0.1;
        const circleRadius = logoSize / 2 + padding;
        ctx.fillStyle = style.bgColor;
        ctx.beginPath();
        ctx.arc(x + logoSize / 2, y + logoSize / 2, circleRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw the logo
        ctx.drawImage(img, x, y, logoSize, logoSize);
        resolve();
      };
      img.onerror = reject;
      img.src = style.logoDataUrl!;
    });
  };

  useEffect(() => {
    generateQrCode();
  }, [qrType, formData, style]);

  const downloadQr = (format: 'png' | 'svg' | 'pdf') => {
    if (!qrDataUrl) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let downloadUrl = qrDataUrl;
    let filename = `qr-code.${format}`;

    if (format === 'png') {
      downloadUrl = canvas.toDataURL('image/png', 1.0);
      filename = 'qr-code.png';
    } else if (format === 'svg') {
      // For SVG, we'd need to regenerate using SVG output
      // For now, we'll use PNG
      downloadUrl = canvas.toDataURL('image/png', 1.0);
      filename = 'qr-code.png';
    } else if (format === 'pdf') {
      // For PDF, we'd need a PDF library
      // For now, we'll use PNG
      downloadUrl = canvas.toDataURL('image/png', 1.0);
      filename = 'qr-code.png';
    }

    const link = document.createElement('a');
    link.download = filename;
    link.href = downloadUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveQr = async () => {
    if (!qrDataUrl) {
      console.error('No QR data URL available for saving');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to save QR codes');
      }

      const qrContent = generateQrContent();
      console.log('Saving QR with content:', qrContent.substring(0, 100) + '...');
      
      // Generate a title based on QR type if not provided
      const title = formData.title || 
        (qrType === 'url' ? `URL - ${new URL(formData.url).hostname}` :
         qrType === 'text' ? `Text - ${formData.text.substring(0, 30)}...` :
         qrType === 'contact' ? `Contact - ${formData.firstName} ${formData.lastName}` :
         qrType === 'email' ? `Email - ${formData.email}` :
         qrType === 'phone' ? `Phone - ${formData.phone}` :
         qrType === 'location' ? `Location - ${formData.placeName || 'GPS Coordinates'}` :
         `${qrType.charAt(0).toUpperCase() + qrType.slice(1)} QR Code`);

      console.log('Attempting to save QR with data:', {
        user_id: user.id,
        title: title.substring(0, 100),
        qr_type: qrType,
        has_form_data: !!formData,
        has_qr_image: !!qrDataUrl
      });
      
      const { data, error } = await supabase
        .from('qr_codes')
        .insert({
          user_id: user.id,
          title: title.substring(0, 100), // Ensure title fits in database
          description: formData.description || null,
          qr_type: qrType,
          destination_url: qrType === 'url' ? formData.url : qrContent,
          form_data: formData,
          design_options: {
            fgColor: style.fgColor,
            bgColor: style.bgColor,
            logoSize: style.logoSize,
            hasLogo: !!style.logoDataUrl
          },
          qr_image_url: qrDataUrl,
          content_preview: qrContent.substring(0, 500),
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Database error saving QR:', error);
        throw error;
      }

      console.log('✓ QR code saved successfully:', data.id);
      setSavedQrId(data.id);
      toast({
        title: "Success!",
        description: "QR code saved to your dashboard successfully.",
      });
      
    } catch (error: any) {
      console.error('Error saving QR code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const shareQr = async () => {
    if (!qrDataUrl) return;

    if (navigator.share) {
      try {
        // Convert data URL to blob
        const response = await fetch(qrDataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'qr-code.png', { type: 'image/png' });

        await navigator.share({
          title: 'My QR Code',
          text: 'Check out my QR code!',
          files: [file],
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(qrDataUrl);
        // You could show a toast here
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  if (previewMode) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center p-4 bg-gray-50 rounded-xl">
          {isGenerating ? (
            <div className="flex items-center justify-center w-48 h-48">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code Preview" className="max-w-full h-auto rounded-lg border" />
          ) : (
            <div className="flex items-center justify-center w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center text-gray-500">
                <QrCode className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">QR preview</p>
              </div>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Your QR Code is Ready!
        </h3>
        <p className="text-gray-600 text-sm">
          Preview your QR code and download it in your preferred format
        </p>
      </div>

      {/* QR Code Display */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Generated QR Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex justify-center p-6 bg-gray-50 rounded-xl">
              {isGenerating ? (
                <div className="flex items-center justify-center w-72 h-72">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Generating QR code...</p>
                  </div>
                </div>
              ) : qrDataUrl ? (
                <img src={qrDataUrl} alt="Generated QR Code" className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm" />
              ) : (
                <div className="flex items-center justify-center w-72 h-72 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center text-gray-500">
                    <QrCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Unable to generate QR code</p>
                    <p className="text-sm">Please check your input data</p>
                  </div>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* QR Code Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <Badge variant="outline" className="ml-2">
                  {qrType.toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="font-medium text-gray-700">Colors:</span>
                <div className="inline-flex items-center gap-1 ml-2">
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: style.fgColor }} />
                  <span className="text-xs">/</span>
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: style.bgColor }} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Options */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                onClick={() => downloadQr('png')}
                disabled={!qrDataUrl}
                variant="outline"
                className="flex items-center gap-2 justify-center"
              >
                <Download className="h-4 w-4" />
                PNG Image
              </Button>
              <Button
                onClick={() => downloadQr('svg')}
                disabled={!qrDataUrl}
                variant="outline"
                className="flex items-center gap-2 justify-center"
              >
                <FileDown className="h-4 w-4" />
                SVG Vector
              </Button>
              <Button
                onClick={() => downloadQr('pdf')}
                disabled={!qrDataUrl}
                variant="outline"
                className="flex items-center gap-2 justify-center"
              >
                <FileText className="h-4 w-4" />
                PDF Document
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={saveQr}
                disabled={!qrDataUrl || isSaving || !!savedQrId}
                className="flex items-center gap-2 justify-center"
                variant={savedQrId ? "secondary" : "default"}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : savedQrId ? (
                  <>
                    <QrCode className="h-4 w-4" />
                    Saved to Dashboard
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save to Dashboard
                  </>
                )}
              </Button>
              <Button
                onClick={shareQr}
                disabled={!qrDataUrl}
                variant="outline"
                className="flex items-center gap-2 justify-center"
              >
                <Share2 className="h-4 w-4" />
                Share QR Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Preview */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Content Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Encoded Content:</span>
              <div className="mt-2 p-3 bg-white rounded border font-mono text-xs break-all">
                {generateQrContent() || 'No content generated'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Actions */}
      <div className="text-center space-y-4 pt-4 border-t">
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">What's next?</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Create Another
            </Button>
            <Button variant="outline" onClick={() => window.location.hash = '#/dashboard'}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
