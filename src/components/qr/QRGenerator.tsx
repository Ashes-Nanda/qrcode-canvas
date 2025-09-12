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
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { ProgressCountdown } from '@/components/ui/progress-countdown';
import { Download, Loader2, QrCode, Save, Plus, Trash2, MapPin, UploadCloud, Palette, FileDown, Upload } from 'lucide-react';

interface MultiUrl {
  url: string;
  weight: number;
  label: string;
}

interface ActionData {
  email?: string;
  subject?: string;
  body?: string;
  phone?: string;
  message?: string;
}

interface VCardData {
  firstName?: string;
  lastName?: string;
  organization?: string;
  title?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
}

interface EventData {
  title?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
}

interface GeoData {
  latitude?: number;
  longitude?: number;
  address?: string;
}

export const QRGenerator = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [qrType, setQrType] = useState<'static' | 'dynamic' | 'multi-url' | 'action' | 'geo' | 'vcard' | 'text' | 'event'>('static');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [multiUrls, setMultiUrls] = useState<MultiUrl[]>([{ url: '', weight: 1, label: '' }]);
  const [actionType, setActionType] = useState<'email' | 'phone' | 'sms'>('email');
  const [actionData, setActionData] = useState<ActionData>({});
  const [geoData, setGeoData] = useState<GeoData>({});
  const [vCardData, setVCardData] = useState<VCardData>({});
  const [textContent, setTextContent] = useState('');
  const [eventData, setEventData] = useState<EventData>({});
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const [darkColor, setDarkColor] = useState<string>('#2e266d');
  const [lightColor, setLightColor] = useState<string>('#FFFFFF');
  const [palette, setPalette] = useState<string[]>([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [logoSize, setLogoSize] = useState(15);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const generateQR = async () => {
    // Validate based on QR type
    let qrUrl = '';
    
    switch (qrType) {
      case 'static':
      case 'dynamic':
        if (!destinationUrl.trim()) {
          toast({
            title: "Error",
            description: "Please enter a destination URL",
            variant: "destructive",
          });
          return;
        }
        
        // Validate URL format and protocol
        try {
          const url = new URL(destinationUrl.startsWith('http') ? destinationUrl : `https://${destinationUrl}`);
          if (!['http:', 'https:'].includes(url.protocol)) {
            toast({
              title: "Error",
              description: "Only HTTP and HTTPS URLs are allowed",
              variant: "destructive",
            });
            return;
          }
        } catch {
          toast({
            title: "Error",
            description: "Please enter a valid URL",
            variant: "destructive",
          });
          return;
        }
        
        // For dynamic QRs, we'll use our redirect service
        qrUrl = qrType === 'dynamic' ? `${window.location.origin}/qr/PLACEHOLDER` : destinationUrl;
        break;
        
      case 'multi-url':
        if (multiUrls.some(url => !url.url.trim())) {
          toast({
            title: "Error",
            description: "Please fill in all URLs",
            variant: "destructive",
          });
          return;
        }
        qrUrl = `${window.location.origin}/qr/PLACEHOLDER`;
        break;
        
      case 'action':
        if (actionType === 'email' && !actionData.email) {
          toast({
            title: "Error",
            description: "Please enter an email address",
            variant: "destructive",
          });
          return;
        }
        if ((actionType === 'phone' || actionType === 'sms') && !actionData.phone) {
          toast({
            title: "Error",
            description: "Please enter a phone number",
            variant: "destructive",
          });
          return;
        }
        qrUrl = `${window.location.origin}/qr/PLACEHOLDER`;
        break;
        
      case 'geo':
        if (!geoData.latitude || !geoData.longitude) {
          toast({
            title: "Error",
            description: "Please set location coordinates",
            variant: "destructive",
          });
          return;
        }
        qrUrl = `${window.location.origin}/qr/PLACEHOLDER`;
        break;
        
      case 'vcard':
        if (!vCardData.firstName && !vCardData.lastName) {
          toast({
            title: "Error",
            description: "Please enter at least a first or last name",
            variant: "destructive",
          });
          return;
        }
        // For vCard, we'll encode directly
        qrUrl = generateVCardString(vCardData);
        break;
        
      case 'text':
        if (!textContent.trim()) {
          toast({
            title: "Error",
            description: "Please enter some text content",
            variant: "destructive",
          });
          return;
        }
        // For text, we'll encode directly
        qrUrl = textContent;
        break;
        
      case 'event':
        if (!eventData.title || !eventData.startDate) {
          toast({
            title: "Error",
            description: "Please enter event title and start date",
            variant: "destructive",
          });
          return;
        }
        // For event, we'll encode directly
        qrUrl = generateEventString(eventData);
        break;
    }

    setLoading(true);
    setShowProgress(true);
    setQrCodeDataUrl('');

    // Defer actual QR rendering until progress completes
    const performGeneration = async () => {
      try {
        // Generate QR code with canvas for logo support
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, qrUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: darkColor,
            light: lightColor
          }
        });

        // If logo is present, overlay it
        if (logoDataUrl) {
          await overlayLogo(canvas);
        }

        const dataUrl = canvas.toDataURL();
        setQrCodeDataUrl(dataUrl);
        if (!hasGeneratedOnce) {
          toast({
            title: 'Success',
            description: 'Your custom, forever-QR Code is ready! 🎉',
          });
          setHasGeneratedOnce(true);
        } else {
          toast({
            title: 'Updated',
            description: 'QR code generated successfully.',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to generate QR code',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        setShowProgress(false);
      }
    };

    // Store function for use after countdown completes
    pendingGenerationRef.current = performGeneration;
  };

  // Holds the pending generation callback until progress completes
  const pendingGenerationRef = useRef<null | (() => Promise<void>)>(null);

  // Logo overlay function
  const overlayLogo = async (canvas: HTMLCanvasElement): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !logoDataUrl) {
        resolve();
        return;
      }

      // Enable high-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const logo = new Image();
      logo.onload = async () => {
        try {
          const canvasSize = canvas.width;
          const logoSizePixels = (canvasSize * logoSize) / 100;
          
          // Calculate position (center)
          const x = (canvasSize - logoSizePixels) / 2;
          const y = (canvasSize - logoSizePixels) / 2;
          
          // Create enhanced background with better anti-aliasing
          const padding = logoSizePixels * 0.15; // Slightly more padding
          const bgRadius = (logoSizePixels + padding) / 2;
          
          // Save the current state
          ctx.save();
          
          // Create a high-quality circular background
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = lightColor;
          ctx.beginPath();
          ctx.arc(canvasSize / 2, canvasSize / 2, bgRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Add subtle shadow for depth
          ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;
          
          // Create clipping mask for logo (circular)
          ctx.beginPath();
          const logoRadius = logoSizePixels / 2 - 2; // Slight inset from background
          ctx.arc(canvasSize / 2, canvasSize / 2, logoRadius, 0, 2 * Math.PI);
          ctx.clip();
          
          // Reset shadow for logo
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Draw the logo with high quality
          const logoX = x + 2; // Slight inset
          const logoY = y + 2;
          const logoSizeFinal = logoSizePixels - 4;
          
          ctx.drawImage(logo, logoX, logoY, logoSizeFinal, logoSizeFinal);
          
          // Restore the context
          ctx.restore();
          
          // Add subtle border around the logo background
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(canvasSize / 2, canvasSize / 2, bgRadius, 0, 2 * Math.PI);
          ctx.stroke();
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      logo.onerror = () => reject(new Error('Failed to load logo'));
      logo.crossOrigin = 'anonymous'; // Handle CORS issues
      logo.src = logoDataUrl;
    });
  };

  // Logo upload handler
  const handleLogoUpload = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLogoFile(file);
      setLogoDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Remove logo
  const removeLogo = () => {
    setLogoFile(null);
    setLogoDataUrl('');
  };

  // Image upload & palette extraction
  const handleImageUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setUploadedImageUrl(url);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const maxSide = 200;
        const ratio = Math.max(img.width, img.height) / maxSide;
        canvas.width = Math.max(1, Math.floor(img.width / ratio));
        canvas.height = Math.max(1, Math.floor(img.height / ratio));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const buckets: Record<string, { r: number; g: number; b: number; count: number }> = {};
        for (let i = 0; i < data.length; i += 4 * 10) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
          if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, count: 0 };
          buckets[key].r += r; buckets[key].g += g; buckets[key].b += b; buckets[key].count += 1;
        }
        const colors = Object.values(buckets)
          .filter(b => b.count > 0)
          .map(b => {
            const r = Math.round(b.r / b.count);
            const g = Math.round(b.g / b.count);
            const b2 = Math.round(b.b / b.count);
            return `#${[r, g, b2].map(v => v.toString(16).padStart(2, '0')).join('')}`;
          });
        colors.sort((a, b) => luminance(a) - luminance(b));
        setPalette(colors.slice(0, 8));
        if (colors.length) {
          setDarkColor(colors[0]);
          const lightCandidate = colors[colors.length - 1];
          setLightColor(luminance(lightCandidate) > 0.9 ? '#FFFFFF' : lightCandidate);
        }
      } catch {}
    };
    img.src = url;
  };

  const luminance = (hex: string): number => {
    const m = hex.replace('#', '');
    const r = parseInt(m.substring(0, 2), 16) / 255;
    const g = parseInt(m.substring(2, 4), 16) / 255;
    const b = parseInt(m.substring(4, 6), 16) / 255;
    const a = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  };

  const downloadSVG = async () => {
    if (!qrCodeDataUrl) return;
    try {
      let qrContent = '';
      switch (qrType) {
        case 'static':
        case 'dynamic':
          qrContent = qrType === 'dynamic' ? `${window.location.origin}/qr/PLACEHOLDER` : destinationUrl;
          break;
        case 'multi-url':
        case 'action':
        case 'geo':
          qrContent = `${window.location.origin}/qr/PLACEHOLDER`;
          break;
        case 'vcard':
          qrContent = generateVCardString(vCardData);
          break;
        case 'text':
          qrContent = textContent;
          break;
        case 'event':
          qrContent = generateEventString(eventData);
          break;
      }
      const svgString = await QRCode.toString(qrContent || ' ', { type: 'svg', margin: 2, color: { dark: darkColor, light: lightColor } });
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (title ? `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}` : 'qr_code') + '.svg';
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Downloaded', description: 'SVG downloaded successfully.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to create SVG', variant: 'destructive' });
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

      // Prepare data based on QR type
      const qrData: any = {
        user_id: user.id,
        title,
        description,
        qr_type: qrType,
      };

      switch (qrType) {
        case 'static':
        case 'dynamic':
          qrData.destination_url = destinationUrl;
          break;
          
        case 'multi-url':
          qrData.multi_urls = multiUrls.filter(url => url.url.trim());
          break;
          
        case 'action':
          qrData.action_type = actionType;
          qrData.action_data = actionData;
          break;
          
        case 'geo':
          qrData.geo_data = geoData;
          break;
          
        case 'vcard':
          qrData.destination_url = generateVCardString(vCardData);
          break;
          
        case 'text':
          qrData.destination_url = textContent;
          break;
          
        case 'event':
          qrData.destination_url = generateEventString(eventData);
          break;
      }

      // Add design options to qrData
      qrData.design_options = {
        foregroundColor: darkColor,
        backgroundColor: lightColor,
        logoSize: logoSize,
        hasLogo: !!logoDataUrl,
        logoDataUrl: logoDataUrl
      };

      const { data: savedQR, error } = await supabase
        .from('qr_codes')
        .insert(qrData)
        .select()
        .single();

      if (error) throw error;

      // Update the QR code with the actual redirect URL
      if (qrType !== 'static' && qrType !== 'vcard' && qrType !== 'text' && qrType !== 'event') {
        const actualUrl = `${window.location.origin}/qr/${savedQR.id}`;
        
        // Generate with logo support
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, actualUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: darkColor,
            light: lightColor
          }
        });
        
        // If logo is present, overlay it
        if (logoDataUrl) {
          await overlayLogo(canvas);
        }
        
        const updatedDataUrl = canvas.toDataURL();
        setQrCodeDataUrl(updatedDataUrl);
      }

      toast({
        title: "Saved!",
        description: "QR code has been saved to your dashboard.",
      });

      // Reset form
      resetForm();
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

  const generateVCardString = (data: VCardData): string => {
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      data.firstName || data.lastName ? `FN:${(data.firstName || '')} ${(data.lastName || '')}`.trim() : '',
      data.firstName ? `N:${data.lastName || ''};${data.firstName};;;` : '',
      data.organization ? `ORG:${data.organization}` : '',
      data.title ? `TITLE:${data.title}` : '',
      data.phone ? `TEL:${data.phone}` : '',
      data.email ? `EMAIL:${data.email}` : '',
      data.website ? `URL:${data.website}` : '',
      data.address ? `ADR:;;${data.address};;;;` : '',
      'END:VCARD'
    ].filter(line => line && !line.endsWith(':')).join('\n');
    
    return vCard;
  };

  const generateEventString = (data: EventData): string => {
    const formatDate = (dateStr: string, allDay: boolean = false) => {
      const date = new Date(dateStr);
      if (allDay) {
        return date.toISOString().split('T')[0].replace(/-/g, '');
      }
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const event = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//QRCode Canvas Pro//Event//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${data.title}`,
      data.description ? `DESCRIPTION:${data.description}` : '',
      data.location ? `LOCATION:${data.location}` : '',
      `DTSTART:${formatDate(data.startDate!, data.allDay)}`,
      data.endDate ? `DTEND:${formatDate(data.endDate, data.allDay)}` : '',
      `DTSTAMP:${formatDate(new Date().toISOString())}`,
      `UID:${Date.now()}@qrcode-canvas-pro.com`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line && !line.endsWith(':')).join('\n');
    
    return event;
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDestinationUrl('');
    setMultiUrls([{ url: '', weight: 1, label: '' }]);
    setActionData({});
    setGeoData({});
    setVCardData({});
    setTextContent('');
    setEventData({});
    setQrCodeDataUrl('');
    setLogoFile(null);
    setLogoDataUrl('');
    setLogoSize(15);
    setPalette([]);
  };

  const addMultiUrl = () => {
    setMultiUrls([...multiUrls, { url: '', weight: 1, label: '' }]);
  };

  const removeMultiUrl = (index: number) => {
    if (multiUrls.length > 1) {
      setMultiUrls(multiUrls.filter((_, i) => i !== index));
    }
  };

  const updateMultiUrl = (index: number, field: keyof MultiUrl, value: string | number) => {
    const updated = [...multiUrls];
    updated[index] = { ...updated[index], [field]: value };
    setMultiUrls(updated);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoData({
            ...geoData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          toast({
            title: "Location set!",
            description: "Current location has been captured.",
          });
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Could not get your location. Please enter coordinates manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Not supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Create QR Code</h1>
        <p className="text-gray-600">Generate professional QR codes for your business needs</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-2 text-xl">
              <QrCode className="h-6 w-6 text-primary" />
              QR Code Generator
            </CardTitle>
            <CardDescription className="text-body">
              Create static or dynamic QR codes for your URLs
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm font-medium">Title</Label>
            <Input
              id="title"
              placeholder="Enter QR code title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
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
            <Select value={qrType} onValueChange={(value: 'static' | 'dynamic' | 'multi-url' | 'action' | 'geo' | 'vcard' | 'text' | 'event') => setQrType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="static">Static QR Code</SelectItem>
                <SelectItem value="dynamic">Dynamic QR Code</SelectItem>
                <SelectItem value="multi-url">Multi-URL QR Code</SelectItem>
                <SelectItem value="action">Action QR Code</SelectItem>
                <SelectItem value="geo">Geo-Tagged QR Code</SelectItem>
                <SelectItem value="vcard">vCard Contact</SelectItem>
                <SelectItem value="text">Plain Text</SelectItem>
                <SelectItem value="event">Event Invite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Style & Branding */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2"><Palette className="h-4 w-4" /> Style & Branding</Label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer hover:bg-accent/10">
                <UploadCloud className="h-4 w-4" />
                <span className="text-sm">Upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload(f);
                  }}
                />
              </label>
              <div className="flex items-center gap-2">
                <input type="color" value={darkColor} onChange={(e) => setDarkColor(e.target.value)} aria-label="QR dark color" className="h-9 w-9 rounded-md border p-0" />
                <span className="text-xs">Dark</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={lightColor} onChange={(e) => setLightColor(e.target.value)} aria-label="QR light color" className="h-9 w-9 rounded-md border p-0" />
                <span className="text-xs">Light</span>
              </div>
            </div>
            {palette.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {palette.map((c, i) => (
                  <button key={i} type="button" aria-label={`Pick color ${c}`} className="h-7 w-7 rounded-md border" style={{ backgroundColor: c }} onClick={() => setDarkColor(c)} />
                ))}
              </div>
            )}
          </div>

          {/* Logo Upload & Embedding */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Upload className="h-4 w-4" /> 
              Logo & Branding
            </Label>
            
            {!logoDataUrl ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center bg-gray-50">
                <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">
                  Add your logo to QR code
                </p>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer hover:bg-accent/10 bg-white">
                  <span className="text-sm">Choose Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLogoUpload(f);
                    }}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG up to 5MB
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-white">
                  <img
                    src={logoDataUrl}
                    alt="Logo preview"
                    className="w-10 h-10 object-cover rounded-lg border border-gray-100"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Logo uploaded</p>
                    <p className="text-xs text-gray-500">
                      {logoFile?.name}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeLogo}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>

                {/* Logo Size Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Logo Size</Label>
                    <span className="text-sm text-gray-500">
                      {logoSize}%
                    </span>
                  </div>
                  <Slider
                    value={[logoSize]}
                    onValueChange={(value) => setLogoSize(value[0])}
                    max={30}
                    min={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>5%</span>
                    <span>30%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Static/Dynamic URL Input as larger textarea */}
          {(qrType === 'static' || qrType === 'dynamic') && (
            <div className="space-y-2">
              <Label htmlFor="url">Destination URL</Label>
              <Textarea
                id="url"
                placeholder="https://example.com"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                rows={4}
                className="smooth-transition text-base rounded-xl"
              />
            </div>
          )}

          {/* Multi-URL Configuration */}
          {qrType === 'multi-url' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Multiple URLs</Label>
                <Button type="button" onClick={addMultiUrl} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add URL
                </Button>
              </div>
              
              {multiUrls.map((multiUrl, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">URL #{index + 1}</Label>
                    {multiUrls.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeMultiUrl(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <Input
                    placeholder="https://example.com"
                    value={multiUrl.url}
                    onChange={(e) => updateMultiUrl(index, 'url', e.target.value)}
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input
                        placeholder="Label"
                        value={multiUrl.label}
                        onChange={(e) => updateMultiUrl(index, 'label', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Weight</Label>
                      <Input
                        type="number"
                        min="1"
                        value={multiUrl.weight}
                        onChange={(e) => updateMultiUrl(index, 'weight', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Configuration */}
          {qrType === 'action' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Action Type</Label>
                <Select value={actionType} onValueChange={(value: 'email' | 'phone' | 'sms') => setActionType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="sms">SMS Message</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {actionType === 'email' && (
                <div className="space-y-2">
                  <Input
                    placeholder="Email address"
                    value={actionData.email || ''}
                    onChange={(e) => setActionData({ ...actionData, email: e.target.value })}
                  />
                  <Input
                    placeholder="Subject (optional)"
                    value={actionData.subject || ''}
                    onChange={(e) => setActionData({ ...actionData, subject: e.target.value })}
                  />
                  <Textarea
                    placeholder="Email body (optional)"
                    value={actionData.body || ''}
                    onChange={(e) => setActionData({ ...actionData, body: e.target.value })}
                    rows={3}
                  />
                </div>
              )}

              {(actionType === 'phone' || actionType === 'sms') && (
                <div className="space-y-2">
                  <Input
                    placeholder="Phone number"
                    value={actionData.phone || ''}
                    onChange={(e) => setActionData({ ...actionData, phone: e.target.value })}
                  />
                  {actionType === 'sms' && (
                    <Textarea
                      placeholder="SMS message (optional)"
                      value={actionData.message || ''}
                      onChange={(e) => setActionData({ ...actionData, message: e.target.value })}
                      rows={3}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Geo Configuration */}
          {qrType === 'geo' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Location</Label>
                <Button type="button" onClick={getCurrentLocation} size="sm" variant="outline">
                  <MapPin className="h-4 w-4 mr-1" />
                  Use Current Location
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="40.7128"
                    value={geoData.latitude || ''}
                    onChange={(e) => setGeoData({ ...geoData, latitude: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="-74.0060"
                    value={geoData.longitude || ''}
                    onChange={(e) => setGeoData({ ...geoData, longitude: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              
              <Input
                placeholder="Address (optional)"
                value={geoData.address || ''}
                onChange={(e) => setGeoData({ ...geoData, address: e.target.value })}
              />
            </div>
          )}

          {/* vCard Configuration */}
          {qrType === 'vcard' && (
            <div className="space-y-4">
              <Label>Contact Information</Label>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">First Name *</Label>
                  <Input
                    placeholder="John"
                    value={vCardData.firstName || ''}
                    onChange={(e) => setVCardData({ ...vCardData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Last Name *</Label>
                  <Input
                    placeholder="Doe"
                    value={vCardData.lastName || ''}
                    onChange={(e) => setVCardData({ ...vCardData, lastName: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Organization</Label>
                  <Input
                    placeholder="Company Name"
                    value={vCardData.organization || ''}
                    onChange={(e) => setVCardData({ ...vCardData, organization: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Job Title</Label>
                  <Input
                    placeholder="CEO"
                    value={vCardData.title || ''}
                    onChange={(e) => setVCardData({ ...vCardData, title: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input
                    placeholder="+1234567890"
                    value={vCardData.phone || ''}
                    onChange={(e) => setVCardData({ ...vCardData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    placeholder="john@example.com"
                    value={vCardData.email || ''}
                    onChange={(e) => setVCardData({ ...vCardData, email: e.target.value })}
                  />
                </div>
              </div>
              
              <Input
                placeholder="Website (optional)"
                value={vCardData.website || ''}
                onChange={(e) => setVCardData({ ...vCardData, website: e.target.value })}
              />
              
              <Input
                placeholder="Address (optional)"
                value={vCardData.address || ''}
                onChange={(e) => setVCardData({ ...vCardData, address: e.target.value })}
              />
            </div>
          )}

          {/* Text Configuration */}
          {qrType === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="text-content">Text Content</Label>
              <Textarea
                id="text-content"
                placeholder="Enter any text content you want to encode in the QR code..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={4}
                className="smooth-transition"
              />
              <p className="text-xs text-muted-foreground">
                This text will be displayed when the QR code is scanned
              </p>
            </div>
          )}

          {/* Event Configuration */}
          {qrType === 'event' && (
            <div className="space-y-4">
              <Label>Event Details</Label>
              
              <div className="space-y-2">
                <Label className="text-xs">Event Title *</Label>
                <Input
                  placeholder="Team Meeting"
                  value={eventData.title || ''}
                  onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Description</Label>
                <Textarea
                  placeholder="Weekly team sync meeting"
                  value={eventData.description || ''}
                  onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Location</Label>
                <Input
                  placeholder="Conference Room A"
                  value={eventData.location || ''}
                  onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Start Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={eventData.startDate || ''}
                    onChange={(e) => setEventData({ ...eventData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">End Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={eventData.endDate || ''}
                    onChange={(e) => setEventData({ ...eventData, endDate: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="all-day"
                  checked={eventData.allDay || false}
                  onChange={(e) => setEventData({ ...eventData, allDay: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="all-day" className="text-sm">All day event</Label>
              </div>
            </div>
          )}

          <Button 
            onClick={generateQR} 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
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

          <ProgressCountdown
            isActive={showProgress}
            onComplete={async () => {
              if (pendingGenerationRef.current) {
                await pendingGenerationRef.current();
                pendingGenerationRef.current = null;
              }
            }}
            duration={3000}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl">Preview & Download</CardTitle>
          <CardDescription className="text-body">
            Your generated QR code will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {qrCodeDataUrl ? (
            <div className="space-y-4">
              <div className="flex justify-center p-6 bg-gray-50 rounded-2xl">
                <img 
                  src={qrCodeDataUrl} 
                  alt="Generated QR Code" 
                  className="border border-gray-200 rounded-2xl shadow-sm"
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={downloadQR} 
                  variant="outline"
                  className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                
                <Button 
                  onClick={downloadSVG}
                  variant="outline"
                  className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Download SVG
                </Button>

                <Button 
                  onClick={saveQR} 
                  disabled={saving}
                  className="flex-1 bg-secondary hover:bg-secondary-hover text-white rounded-xl shadow-md"
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

              {/* Post-generation action buttons */}
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={() => {
                    resetForm();
                  }}
                  variant="outline"
                  className="w-full rounded-xl h-12"
                >
                  Create a new QR code
                </Button>
                <Button 
                  onClick={() => {
                    window.location.hash = '#/dashboard/analytics';
                  }}
                  className="w-full bg-secondary hover:bg-secondary-hover text-white rounded-xl h-12 text-base font-medium"
                >
                  Track scanning data
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
    </div>
  );
};