import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
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
import { Download, Loader2, QrCode, Save, Plus, Trash2, MapPin, UploadCloud, Palette, FileDown, Upload, FileText } from 'lucide-react';
import { RuleBuilder } from './RuleBuilder';
import { ActionBuilder } from './ActionBuilder';

interface MultiUrl {
  url: string;
  weight: number;
  label: string;
}

interface ContactData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  website?: string;
  address?: string;
}

interface SocialsData {
  platform?: string;
  username?: string;
  profileUrl?: string;
}

interface AppData {
  iosUrl?: string;
  androidUrl?: string;
}

interface LocationData {
  latitude?: number;
  longitude?: number;
  placeName?: string;
}

interface SMSData {
  phone?: string;
  message?: string;
}

interface EmailData {
  email?: string;
  subject?: string;
  body?: string;
}

interface PhoneData {
  phone?: string;
}

interface QRRule {
  id?: string;
  conditionType: 'time' | 'day' | 'device';
  conditionValue: any;
  redirectUrl: string;
  priority: number;
}

interface QRAction {
  id?: string;
  actionType: 'call' | 'website' | 'whatsapp' | 'directions' | 'vcard';
  actionData: any;
  displayOrder: number;
}

interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
}

export const QRGenerator = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [qrType] = useState<'url'>('url'); // MVP: Default to URL only
  const [url, setUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [multiUrls, setMultiUrls] = useState<MultiUrl[]>([{ url: '', weight: 1, label: '' }]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [contactData, setContactData] = useState<ContactData>({});
  const [socialsData, setSocialsData] = useState<SocialsData>({});
  const [textContent, setTextContent] = useState('');
  const [appData, setAppData] = useState<AppData>({});
  const [locationData, setLocationData] = useState<LocationData>({});
  const [smsData, setSmsData] = useState<SMSData>({});
  const [emailData, setEmailData] = useState<EmailData>({});
  const [phoneData, setPhoneData] = useState<PhoneData>({});
  const [qrRules, setQrRules] = useState<QRRule[]>([]);
  const [qrActions, setQrActions] = useState<QRAction[]>([]);
  const [brandColors, setBrandColors] = useState<BrandColors>({});
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showCustomizeDesign, setShowCustomizeDesign] = useState(false);
  const [autoPreview, setAutoPreview] = useState('');
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
    // Validate title first
    if (!title.trim()) {
      toast({
        title: "⚠️ Title Required",
        description: "Please enter a title for your QR code before generating.",
        variant: "destructive",
      });
      return;
    }
    
    // Check title length
    if (title.length > 100) {
      toast({
        title: "⚠️ Title Too Long",
        description: "Title must be 100 characters or less. Current length: " + title.length,
        variant: "destructive",
      });
      return;
    }
    
    // Check description length
    if (description && description.length > 500) {
      toast({
        title: "⚠️ Description Too Long",
        description: "Description must be 500 characters or less. Current length: " + description.length,
        variant: "destructive",
      });
      return;
    }
    
    // Validate based on QR type
    let qrUrl = '';
    
    switch (qrType) {
      case 'url':
        if (!url.trim()) {
          toast({
            title: "⚠️ URL Required",
            description: "Please enter a URL for your QR code.",
            variant: "destructive",
          });
          return;
        }
        
        // Enhanced URL validation
        let validUrl;
        try {
          // Try to parse as-is first
          validUrl = new URL(url);
        } catch {
          try {
            // Try with https:// prefix
            validUrl = new URL('https://' + url);
          } catch {
            toast({
              title: "⚠️ Invalid URL Format",
              description: "Please enter a valid URL. Examples: https://example.com, www.example.com, or example.com",
              variant: "destructive",
            });
            return;
          }
        }
        
        qrUrl = validUrl.toString();
        break;
        
      case 'pdf':
        if (!pdfFile) {
          toast({
            title: "⚠️ PDF File Required",
            description: "Please upload a PDF file.",
            variant: "destructive",
          });
          return;
        }
        
        if (pdfFile.size > 10 * 1024 * 1024) { // 10MB limit
          toast({
            title: "⚠️ File Too Large",
            description: "PDF file must be smaller than 10MB.",
            variant: "destructive",
          });
          return;
        }
        
        // This will be a placeholder for now - file upload logic will be handled separately
        qrUrl = `${window.location.origin}/qr/PLACEHOLDER`;
        break;
        
      case 'multi-url':
        const validUrls = multiUrls.filter(item => item.url.trim());
        if (validUrls.length === 0) {
          toast({
            title: "⚠️ No URLs Configured",
            description: "Please add at least one URL.",
            variant: "destructive",
          });
          return;
        }
        
        // Validate each URL
        for (let i = 0; i < validUrls.length; i++) {
          const urlEntry = validUrls[i];
          try {
            new URL(urlEntry.url.startsWith('http') ? urlEntry.url : 'https://' + urlEntry.url);
          } catch {
            toast({
              title: "⚠️ Invalid URL Format",
              description: `URL #${i + 1} is not valid.`,
              variant: "destructive",
            });
            return;
          }
        }
        
        qrUrl = `${window.location.origin}/qr/PLACEHOLDER`;
        break;
        
      case 'file':
        if (!uploadFile) {
          toast({
            title: "⚠️ File Required",
            description: "Please upload a file.",
            variant: "destructive",
          });
          return;
        }
        
        if (uploadFile.size > 25 * 1024 * 1024) { // 25MB limit
          toast({
            title: "⚠️ File Too Large",
            description: "File must be smaller than 25MB.",
            variant: "destructive",
          });
          return;
        }
        
        qrUrl = `${window.location.origin}/qr/PLACEHOLDER`;
        break;
        
      case 'contact':
        if (!contactData.firstName?.trim() || !contactData.lastName?.trim()) {
          toast({
            title: "⚠️ Name Required",
            description: "Please enter both first and last name.",
            variant: "destructive",
          });
          return;
        }
        
        if (!contactData.phone?.trim() || !contactData.email?.trim()) {
          toast({
            title: "⚠️ Contact Info Required",
            description: "Please enter both phone number and email.",
            variant: "destructive",
          });
          return;
        }
        
        // Generate vCard string
        qrUrl = generateVCardString(contactData);
        break;
        
      case 'socials':
        if (!socialsData.platform || !socialsData.username?.trim()) {
          toast({
            title: "⚠️ Social Info Required",
            description: "Please select a platform and enter username.",
            variant: "destructive",
          });
          return;
        }
        
        // Generate social media URL
        qrUrl = generateSocialUrl(socialsData);
        break;
        
      case 'text':
        if (!textContent.trim()) {
          toast({
            title: "⚠️ Text Required",
            description: "Please enter text content.",
            variant: "destructive",
          });
          return;
        }
        
        qrUrl = textContent;
        break;
        
      case 'app':
        if (!appData.iosUrl?.trim() && !appData.androidUrl?.trim()) {
          toast({
            title: "⚠️ App URL Required",
            description: "Please enter at least one app store URL.",
            variant: "destructive",
          });
          return;
        }
        
        // Generate smart app URL that detects device
        qrUrl = `${window.location.origin}/qr/PLACEHOLDER`;
        break;
        
      case 'location':
        if (!locationData.latitude || !locationData.longitude) {
          toast({
            title: "⚠️ Location Required",
            description: "Please enter latitude and longitude.",
            variant: "destructive",
          });
          return;
        }
        
        // Validate coordinate ranges
        if (locationData.latitude < -90 || locationData.latitude > 90) {
          toast({
            title: "⚠️ Invalid Latitude",
            description: "Latitude must be between -90 and 90 degrees.",
            variant: "destructive",
          });
          return;
        }
        
        if (locationData.longitude < -180 || locationData.longitude > 180) {
          toast({
            title: "⚠️ Invalid Longitude",
            description: "Longitude must be between -180 and 180 degrees.",
            variant: "destructive",
          });
          return;
        }
        
        // Generate geo URL
        qrUrl = `geo:${locationData.latitude},${locationData.longitude}${locationData.placeName ? `?q=${encodeURIComponent(locationData.placeName)}` : ''}`;
        break;
        
      case 'sms':
        if (!smsData.phone?.trim() || !smsData.message?.trim()) {
          toast({
            title: "⚠️ SMS Info Required",
            description: "Please enter both phone number and message.",
            variant: "destructive",
          });
          return;
        }
        
        qrUrl = `sms:${smsData.phone}?body=${encodeURIComponent(smsData.message)}`;
        break;
        
      case 'email':
        if (!emailData.email?.trim() || !emailData.subject?.trim() || !emailData.body?.trim()) {
          toast({
            title: "⚠️ Email Info Required",
            description: "Please fill in all email fields.",
            variant: "destructive",
          });
          return;
        }
        
        qrUrl = `mailto:${emailData.email}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
        break;
        
      case 'phone':
        if (!phoneData.phone?.trim()) {
          toast({
            title: "⚠️ Phone Number Required",
            description: "Please enter a phone number.",
            variant: "destructive",
          });
          return;
        }
        
        qrUrl = `tel:${phoneData.phone}`;
        break;
      
      case 'context-aware':
        if (!url.trim()) {
          toast({
            title: "⚠️ Fallback URL Required",
            description: "Please enter a fallback URL for your context-aware QR code.",
            variant: "destructive",
          });
          return;
        }
        
        if (qrRules.length === 0) {
          toast({
            title: "⚠️ No Rules Configured",
            description: "Please add at least one conditional rule.",
            variant: "destructive",
          });
          return;
        }
        
        // Validate each rule
        for (let i = 0; i < qrRules.length; i++) {
          const rule = qrRules[i];
          if (!rule.redirectUrl.trim()) {
            toast({
              title: "⚠️ Rule URL Required",
              description: `Rule #${i + 1} needs a redirect URL.`,
              variant: "destructive",
            });
            return;
          }
        }
        
        // This will redirect to our edge function which handles the logic
        qrUrl = `${window.location.origin}/functions/v1/qr-redirect?id=PLACEHOLDER`;
        break;
      
      case 'multi-action':
        if (qrActions.length === 0) {
          toast({
            title: "⚠️ No Actions Configured",
            description: "Please add at least one action for your multi-action QR code.",
            variant: "destructive",
          });
          return;
        }
        
        // Validate each action
        for (let i = 0; i < qrActions.length; i++) {
          const action = qrActions[i];
          const actionNum = i + 1;
          
          switch (action.actionType) {
            case 'call':
              if (!action.actionData.phone?.trim()) {
                toast({
                  title: "⚠️ Action Incomplete",
                  description: `Action #${actionNum} (Call) needs a phone number.`,
                  variant: "destructive",
                });
                return;
              }
              break;
            case 'website':
              if (!action.actionData.url?.trim()) {
                toast({
                  title: "⚠️ Action Incomplete",
                  description: `Action #${actionNum} (Website) needs a URL.`,
                  variant: "destructive",
                });
                return;
              }
              break;
            case 'whatsapp':
              if (!action.actionData.phone?.trim()) {
                toast({
                  title: "⚠️ Action Incomplete",
                  description: `Action #${actionNum} (WhatsApp) needs a phone number.`,
                  variant: "destructive",
                });
                return;
              }
              break;
            case 'directions':
              if (!action.actionData.address?.trim() && (!action.actionData.latitude || !action.actionData.longitude)) {
                toast({
                  title: "⚠️ Action Incomplete",
                  description: `Action #${actionNum} (Directions) needs either an address or coordinates.`,
                  variant: "destructive",
                });
                return;
              }
              break;
            case 'vcard':
              if (!action.actionData.firstName?.trim() || !action.actionData.lastName?.trim()) {
                toast({
                  title: "⚠️ Action Incomplete",
                  description: `Action #${actionNum} (Contact) needs first and last name.`,
                  variant: "destructive",
                });
                return;
              }
              break;
          }
        }
        
        // This will redirect to our action menu page
        qrUrl = `${window.location.origin}/menu/PLACEHOLDER`;
        break;
    }

    setLoading(true);
    setQrCodeDataUrl('');

    // Generate QR code immediately
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
        description: 'Failed to generate QR code: ' + (error instanceof Error ? error.message : 'Unknown error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


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

  // Logo upload with color extraction
  const handleLogoUploadWithColors = (file: File) => {
    handleLogoUpload(file); // Existing logo upload logic
    
    // Extract colors from the uploaded logo
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          // Simple color extraction (get most prominent colors)
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
          if (imageData) {
            const colors = extractColorsFromImageData(imageData);
            setExtractedColors(colors);
            
            // Auto-set brand colors if not already set
            if (!brandColors.primary && colors.length > 0) {
              setBrandColors({
                primary: colors[0],
                secondary: colors[1] || colors[0],
                accent: colors[2] || colors[0],
                background: '#FFFFFF'
              });
              setDarkColor(colors[0]);
            }
          }
        } catch (error) {
          console.error('Error extracting colors:', error);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Simple color extraction function
  const extractColorsFromImageData = (imageData: ImageData): string[] => {
    const data = imageData.data;
    const colorMap = new Map<string, number>();
    
    // Sample every 10th pixel to improve performance
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Skip transparent pixels
      if (a < 128) continue;
      
      // Convert to hex
      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      
      // Count occurrences
      colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
    }
    
    // Sort by frequency and return top colors
    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => color);
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
      toast({ 
        title: '✓ Downloaded Successfully', 
        description: 'SVG file has been downloaded to your device.',
        duration: 3000
      });
    } catch {
      toast({ 
        title: '✗ Download Failed', 
        description: 'Could not generate SVG file. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  const downloadPDF = async () => {
    if (!qrCodeDataUrl) return;
    
    try {
      // Create a new jsPDF instance
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set up the page
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      const qrTitle = title || 'QR Code';
      const titleWidth = pdf.getStringUnitWidth(qrTitle) * 20 / pdf.internal.scaleFactor;
      pdf.text(qrTitle, (pageWidth - titleWidth) / 2, 30);
      
      // Add QR code image
      const qrSize = 80; // Size in mm
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = 50;
      
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      
      // Add QR type and content info
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      let yPosition = qrY + qrSize + 20;
      
      // Add QR type
      pdf.text(`Type: ${qrType.charAt(0).toUpperCase() + qrType.slice(1).replace('-', ' ')}`, 20, yPosition);
      yPosition += 10;
      
      // Add content based on type
      let contentText = '';
      switch (qrType) {
        case 'static':
        case 'dynamic':
          contentText = destinationUrl;
          break;
        case 'multi-url':
          contentText = `${multiUrls.length} URLs configured`;
          break;
        case 'action':
          contentText = `${actionType} action`;
          if (actionData.email) contentText += ` → ${actionData.email}`;
          if (actionData.phone) contentText += ` → ${actionData.phone}`;
          break;
        case 'geo':
          contentText = geoData.address || `${geoData.latitude}, ${geoData.longitude}`;
          break;
        case 'vcard':
          const name = `${vCardData.firstName || ''} ${vCardData.lastName || ''}`.trim();
          contentText = name || 'Contact card';
          break;
        case 'text':
          contentText = textContent.substring(0, 100) + (textContent.length > 100 ? '...' : '');
          break;
        case 'event':
          contentText = eventData.title || 'Event';
          break;
      }
      
      // Split long content into multiple lines
      if (contentText) {
        pdf.text('Content:', 20, yPosition);
        yPosition += 8;
        
        const maxWidth = pageWidth - 40;
        const lines = pdf.splitTextToSize(contentText, maxWidth);
        pdf.text(lines, 20, yPosition);
        yPosition += lines.length * 6;
      }
      
      // Add description if exists
      if (description) {
        yPosition += 10;
        pdf.text('Description:', 20, yPosition);
        yPosition += 8;
        
        const maxWidth = pageWidth - 40;
        const descLines = pdf.splitTextToSize(description, maxWidth);
        pdf.text(descLines, 20, yPosition);
      }
      
      // Add generation info at the bottom
      pdf.setFontSize(10);
      pdf.setTextColor(128);
      const dateStr = new Date().toLocaleString();
      pdf.text(`Generated on ${dateStr} by CanvasQR`, 20, pageHeight - 20);
      
      // Save the PDF
      const filename = title ? `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr.pdf` : 'qr_code.pdf';
      pdf.save(filename);
      
      toast({ 
        title: '✓ PDF Downloaded Successfully', 
        description: 'PDF file has been downloaded with your QR code and details.',
        duration: 3000
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({ 
        title: '✗ PDF Download Failed', 
        description: 'Could not generate PDF file. Please try again.', 
        variant: 'destructive' 
      });
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
          title: "✓ PNG Downloaded Successfully",
          description: "QR code image has been saved to your device.",
          duration: 3000
        });
      })
      .catch(error => {
        console.error('Download failed:', error);
        toast({
          title: "✗ Download Failed",
          description: "Could not download QR code. Please try again.",
          variant: "destructive"
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

  const generateVCardString = (data: ContactData): string => {
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
    ].filter(line => line && !line.endsWith(':')).join('\n');
    
    return vCard;
  };

  const generateSocialUrl = (data: SocialsData): string => {
    const { platform, username, profileUrl } = data;
    
    if (profileUrl && profileUrl.trim()) {
      return profileUrl.startsWith('http') ? profileUrl : `https://${profileUrl}`;
    }
    
    const cleanUsername = username?.replace('@', '') || '';
    
    switch (platform) {
      case 'instagram':
        return `https://instagram.com/${cleanUsername}`;
      case 'facebook':
        return `https://facebook.com/${cleanUsername}`;
      case 'linkedin':
        return `https://linkedin.com/in/${cleanUsername}`;
      case 'twitter':
        return `https://twitter.com/${cleanUsername}`;
      case 'tiktok':
        return `https://tiktok.com/@${cleanUsername}`;
      case 'youtube':
        return `https://youtube.com/@${cleanUsername}`;
      case 'snapchat':
        return `https://snapchat.com/add/${cleanUsername}`;
      default:
        return `https://${platform}.com/${cleanUsername}`;
    }
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
      'PRODID:-//CanvasQR//Event//EN',
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
    setUrl('');
    setPdfFile(null);
    setMultiUrls([{ url: '', weight: 1, label: '' }]);
    setUploadFile(null);
    setContactData({});
    setSocialsData({});
    setTextContent('');
    setAppData({});
    setLocationData({});
    setEmailData({});
    setSmsData({});
    setPhoneData({});
    setQrRules([]);
    setQrActions([]);
    setBrandColors({});
    setExtractedColors([]);
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

      <div className="grid gap-8 lg:grid-cols-2 mobile-grid">
        <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-2 text-xl">
              <QrCode className="h-6 w-6 text-primary" />
              QR Code Generator
            </CardTitle>
            <CardDescription className="text-body">
              Enter a URL to generate your QR code instantly
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-6">
          {/* MVP: Main URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-medium">Enter URL</Label>
            <Input
              id="url"
              placeholder="Enter a URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="rounded-xl text-base h-12"
              autoFocus
            />
          </div>

          {/* Advanced Options (Collapsible) */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full justify-between p-3 h-auto text-left border border-dashed border-gray-300 hover:border-gray-400 transition-colors"
            >
              <span className="text-sm text-gray-600">Advanced Options</span>
              <span className={`transform transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`}>
                ↓
              </span>
            </Button>
            
            {showAdvancedOptions && (
              <div className="space-y-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="title" className="text-sm font-medium">Title (optional)</Label>
                    <span className={`text-xs ${title.length > 100 ? 'text-red-500' : 'text-gray-500'}`}>
                      {title.length}/100
                    </span>
                  </div>
                  <Input
                    id="title"
                    placeholder="Name your QR code"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="rounded-lg"
                    maxLength={120}
                  />
                  {title.length > 100 && (
                    <p className="text-xs text-red-500">
                      Title is too long. Please reduce by {title.length - 100} characters.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="description">Description (optional)</Label>
                    <span className={`text-xs ${description.length > 500 ? 'text-red-500' : 'text-gray-500'}`}>
                      {description.length}/500
                    </span>
                  </div>
                    <Textarea
                      id="description"
                      placeholder="Add a description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="rounded-lg"
                      rows={3}
                      maxLength={520}
                    />
                  {description.length > 500 && (
                    <p className="text-xs text-red-500">
                      Description is too long. Please reduce by {description.length - 500} characters.
                    </p>
                  )}
                </div>

                {/* Future: QR Type Selector */}
                <div className="text-center py-2">
                  <Button variant="outline" size="sm" disabled className="opacity-50">
                    + Add Other QR Types
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">More QR types coming soon</p>
                </div>
              </div>
            )}
          </div>

          {/* Customize Design (Collapsible, shown after generation) */}
          {(qrCodeDataUrl || autoPreview) && (
            <div className="space-y-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCustomizeDesign(!showCustomizeDesign)}
                className="w-full justify-between p-3 h-auto text-left border border-dashed border-gray-300 hover:border-gray-400 transition-colors"
              >
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Palette className="h-4 w-4" /> Customize Design
                </span>
                <span className={`transform transition-transform ${showCustomizeDesign ? 'rotate-180' : ''}`}>
                  ↓
                </span>
              </Button>
              
              {showCustomizeDesign && (
                <div className="space-y-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
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
            {/* Extracted Colors from Logo */}
            {extractedColors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">Colors from your logo</Label>
                <div className="flex flex-wrap gap-2">
                  {extractedColors.map((color, i) => (
                    <button 
                      key={i} 
                      type="button" 
                      aria-label={`Use extracted color ${color}`}
                      className="h-8 w-8 rounded-lg border-2 border-gray-200 hover:border-primary transition-colors"
                      style={{ backgroundColor: color }}
                      onClick={() => setDarkColor(color)}
                      title={`Click to use: ${color}`}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Brand Color Palette */}
            {brandColors.primary && (
              <div className="space-y-2">
                <Label className="text-xs">Brand Colors</Label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div 
                      className="h-8 w-full rounded-lg border cursor-pointer"
                      style={{ backgroundColor: brandColors.primary }}
                      onClick={() => setDarkColor(brandColors.primary!)}
                    />
                    <span className="text-xs text-gray-500">Primary</span>
                  </div>
                  {brandColors.secondary && (
                    <div className="text-center">
                      <div 
                        className="h-8 w-full rounded-lg border cursor-pointer"
                        style={{ backgroundColor: brandColors.secondary }}
                        onClick={() => setDarkColor(brandColors.secondary!)}
                      />
                      <span className="text-xs text-gray-500">Secondary</span>
                    </div>
                  )}
                  {brandColors.accent && (
                    <div className="text-center">
                      <div 
                        className="h-8 w-full rounded-lg border cursor-pointer"
                        style={{ backgroundColor: brandColors.accent }}
                        onClick={() => setDarkColor(brandColors.accent!)}
                      />
                      <span className="text-xs text-gray-500">Accent</span>
                    </div>
                  )}
                  <div className="text-center">
                    <div 
                      className="h-8 w-full rounded-lg border cursor-pointer"
                      style={{ backgroundColor: brandColors.background || '#FFFFFF' }}
                      onClick={() => setLightColor(brandColors.background || '#FFFFFF')}
                    />
                    <span className="text-xs text-gray-500">Background</span>
                  </div>
                </div>
              </div>
            )}
            
            {palette.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {palette.map((c, i) => (
                  <button key={i} type="button" aria-label={`Pick color ${c}`} className="h-7 w-7 rounded-md border" style={{ backgroundColor: c }} onClick={() => setDarkColor(c)} />
                ))}
              </div>
            )}

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
                              if (f) handleLogoUploadWithColors(f);
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
                </div>
              )}
            </div>
          )}

          {/* URL */}
          {qrType === 'url' && (
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                placeholder="https://example.com or www.example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="rounded-xl"
                required
              />
              <p className="text-xs text-gray-500">
                Enter a valid HTTP/HTTPS URL
              </p>
            </div>
          )}

          {/* PDF Upload */}
          {qrType === 'pdf' && (
            <div className="space-y-2">
              <Label htmlFor="pdf-upload">Upload PDF File *</Label>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
              <p className="text-xs text-gray-500">
                Maximum file size: 10MB
              </p>
            </div>
          )}

          {/* Multi-URL */}
          {qrType === 'multi-url' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>URLs *</Label>
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
                    required
                  />
                </div>
              ))}
            </div>
          )}

          {/* File Upload */}
          {qrType === 'file' && (
            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload File *</Label>
              <input
                id="file-upload"
                type="file"
                accept=".doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg,.gif,.pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
              <p className="text-xs text-gray-500">
                Supported: DOC, XLS, ZIP, Images, PDF (Max: 25MB)
              </p>
            </div>
          )}

          {/* Contact (vCard) */}
          {qrType === 'contact' && (
            <div className="space-y-4">
              <Label>Contact Information</Label>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">First Name *</Label>
                  <Input
                    placeholder="John"
                    value={contactData.firstName || ''}
                    onChange={(e) => setContactData({ ...contactData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Last Name *</Label>
                  <Input
                    placeholder="Doe"
                    value={contactData.lastName || ''}
                    onChange={(e) => setContactData({ ...contactData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <Input
                placeholder="Phone Number *"
                value={contactData.phone || ''}
                onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                required
              />
              
              <Input
                placeholder="Email *"
                value={contactData.email || ''}
                onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                required
              />
              
              <Input
                placeholder="Company (optional)"
                value={contactData.company || ''}
                onChange={(e) => setContactData({ ...contactData, company: e.target.value })}
              />
              
              <Input
                placeholder="Job Title (optional)"
                value={contactData.jobTitle || ''}
                onChange={(e) => setContactData({ ...contactData, jobTitle: e.target.value })}
              />
              
              <Input
                placeholder="Website (optional)"
                value={contactData.website || ''}
                onChange={(e) => setContactData({ ...contactData, website: e.target.value })}
              />
              
              <Input
                placeholder="Address (optional)"
                value={contactData.address || ''}
                onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
              />
            </div>
          )}

          {/* Socials */}
          {qrType === 'socials' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Platform *</Label>
                <Select value={socialsData.platform || ''} onValueChange={(value) => setSocialsData({ ...socialsData, platform: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="snapchat">Snapchat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Input
                placeholder="Username/Handle (e.g., @username) *"
                value={socialsData.username || ''}
                onChange={(e) => setSocialsData({ ...socialsData, username: e.target.value })}
                required
              />
              
              <Input
                placeholder="Profile URL (optional)"
                value={socialsData.profileUrl || ''}
                onChange={(e) => setSocialsData({ ...socialsData, profileUrl: e.target.value })}
              />
            </div>
          )}

          {/* Plain Text */}
          {qrType === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="text-content">Text Content *</Label>
              <Textarea
                id="text-content"
                placeholder="Enter any text content you want to encode in the QR code..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={4}
                className="rounded-xl"
                required
              />
              <p className="text-xs text-gray-500">
                This text will be displayed when the QR code is scanned
              </p>
            </div>
          )}

          {/* App */}
          {qrType === 'app' && (
            <div className="space-y-4">
              <Label>App Store URLs</Label>
              
              <div className="space-y-2">
                <Label className="text-xs">iOS App Store URL</Label>
                <Input
                  placeholder="https://apps.apple.com/app/..."
                  value={appData.iosUrl || ''}
                  onChange={(e) => setAppData({ ...appData, iosUrl: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Android Play Store URL</Label>
                <Input
                  placeholder="https://play.google.com/store/apps/..."
                  value={appData.androidUrl || ''}
                  onChange={(e) => setAppData({ ...appData, androidUrl: e.target.value })}
                />
              </div>
              
              <p className="text-xs text-gray-500">
                Enter at least one app store URL
              </p>
            </div>
          )}

          {/* Location */}
          {qrType === 'location' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Latitude *</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="40.7128"
                    value={locationData.latitude || ''}
                    onChange={(e) => setLocationData({ ...locationData, latitude: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Longitude *</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="-74.0060"
                    value={locationData.longitude || ''}
                    onChange={(e) => setLocationData({ ...locationData, longitude: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>
              
              <Input
                placeholder="Place Name (optional)"
                value={locationData.placeName || ''}
                onChange={(e) => setLocationData({ ...locationData, placeName: e.target.value })}
              />
            </div>
          )}

          {/* SMS */}
          {qrType === 'sms' && (
            <div className="space-y-4">
              <Input
                placeholder="Phone Number *"
                value={smsData.phone || ''}
                onChange={(e) => setSmsData({ ...smsData, phone: e.target.value })}
                required
              />
              
              <Textarea
                placeholder="Message Body *"
                value={smsData.message || ''}
                onChange={(e) => setSmsData({ ...smsData, message: e.target.value })}
                rows={3}
                required
              />
            </div>
          )}

          {/* Email */}
          {qrType === 'email' && (
            <div className="space-y-4">
              <Input
                placeholder="Recipient Email Address *"
                value={emailData.email || ''}
                onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                required
              />
              
              <Input
                placeholder="Subject *"
                value={emailData.subject || ''}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                required
              />
              
              <Textarea
                placeholder="Body *"
                value={emailData.body || ''}
                onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                rows={4}
                required
              />
            </div>
          )}

          {/* Phone */}
          {qrType === 'phone' && (
            <div className="space-y-2">
              <Label htmlFor="phone-number">Phone Number *</Label>
              <Input
                id="phone-number"
                placeholder="+1234567890"
                value={phoneData.phone || ''}
                onChange={(e) => setPhoneData({ ...phoneData, phone: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500">
                Include country code for international numbers
              </p>
            </div>
          )}

          {/* Context-Aware QR */}
          {qrType === 'context-aware' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fallback-url">Fallback URL *</Label>
                <Input
                  id="fallback-url"
                  placeholder="https://example.com (shown when no rules match)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  This URL will be used when no conditional rules match
                </p>
              </div>
              
              <RuleBuilder 
                rules={qrRules} 
                onRulesChange={setQrRules}
              />
            </div>
          )}

          {/* Multi-Action QR */}
          {qrType === 'multi-action' && (
            <div className="space-y-4">
              <ActionBuilder 
                actions={qrActions} 
                onActionsChange={setQrActions}
              />
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
              
              <div className="space-y-3">
                {/* Primary download options */}
                <div className="flex gap-2 sm:gap-2 mobile-button-group">
                  <Button 
                    onClick={downloadQR} 
                    variant="outline"
                    className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50 mobile-touch"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">PNG</span>
                    <span className="sm:hidden">PNG Image</span>
                  </Button>
                  
                  <Button 
                    onClick={downloadSVG}
                    variant="outline"
                    className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50 mobile-touch"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">SVG</span>
                    <span className="sm:hidden">SVG Vector</span>
                  </Button>
                  
                  <Button 
                    onClick={downloadPDF}
                    variant="outline"
                    className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50 mobile-touch"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">PDF</span>
                    <span className="sm:hidden">PDF Document</span>
                  </Button>
                </div>
                
                {/* Save button */}
                <Button 
                  onClick={saveQR} 
                  disabled={saving}
                  className="w-full bg-secondary hover:bg-secondary-hover text-white rounded-xl shadow-md"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save to Dashboard
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