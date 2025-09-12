import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';
import { Loader2, Upload, Palette, Download, Save, RotateCcw, Circle, Square } from 'lucide-react';

interface QREditModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: any;
  onUpdate: () => void;
}

interface QRDesignOptions {
  foregroundColor: string;
  backgroundColor: string;
  logoFile: File | null;
  logoDataUrl: string;
  logoSize: number; // 0-30 (percentage of QR size)
  logoShape: 'circle' | 'rounded-square';
}

export const QREditModal = ({ isOpen, onClose, qrCode, onUpdate }: QREditModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [designOptions, setDesignOptions] = useState<QRDesignOptions>({
    foregroundColor: '#1976D2',
    backgroundColor: '#FFFFFF',
    logoFile: null,
    logoDataUrl: '',
    logoSize: 15,
    logoShape: 'circle',
  });
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (qrCode && isOpen) {
      setTitle(qrCode.title || '');
      setDescription(qrCode.description || '');
      setDestinationUrl(qrCode.destination_url || '');
      
      // Load existing design options if available
      if (qrCode.design_options) {
        setDesignOptions({
          ...designOptions,
          ...qrCode.design_options,
          logoFile: null, // Don't restore file object
        });
      }
      
      generateQRPreview();
    }
  }, [qrCode, isOpen]);

  const generateQRPreview = async () => {
    if (!qrCode) return;
    
    setLoading(true);
    try {
      let qrUrl = '';
      
      // Determine QR URL based on type
      if (qrCode.qr_type === 'static') {
        qrUrl = destinationUrl || qrCode.destination_url || '';
      } else {
        qrUrl = `${window.location.origin}/qr/${qrCode.id}`;
      }

      // Generate base QR code
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, qrUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: designOptions.foregroundColor,
          light: designOptions.backgroundColor
        }
      });

      // If logo is present, overlay it
      if (designOptions.logoDataUrl) {
        await overlayLogo(canvas);
      }

      setQrCodeDataUrl(canvas.toDataURL());
    } catch (error) {
      console.error('Failed to generate QR preview:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code preview",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const overlayLogo = async (canvas: HTMLCanvasElement): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !designOptions.logoDataUrl) {
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
          const logoSizePixels = (canvasSize * designOptions.logoSize) / 100;
          
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
          ctx.fillStyle = designOptions.backgroundColor;
          ctx.beginPath();
          ctx.arc(canvasSize / 2, canvasSize / 2, bgRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Add subtle shadow for depth
          ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;
          
          // Create clipping mask for logo (circular or rounded square)
          ctx.beginPath();
          const logoRadius = logoSizePixels / 2 - 2; // Slight inset from background
          
          if (designOptions.logoShape === 'circle') {
            ctx.arc(canvasSize / 2, canvasSize / 2, logoRadius, 0, 2 * Math.PI);
          } else {
            // Rounded square
            const cornerRadius = logoRadius * 0.2;
            const logoX = x + 2;
            const logoY = y + 2;
            const logoSize = logoSizePixels - 4;
            
            ctx.roundRect(logoX, logoY, logoSize, logoSize, cornerRadius);
          }
          ctx.clip();
          
          // Reset shadow for logo
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Draw the logo with high quality
          const logoX = x + 2; // Slight inset
          const logoY = y + 2;
          const logoSize = logoSizePixels - 4;
          
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
          
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
      logo.src = designOptions.logoDataUrl;
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      setDesignOptions(prev => ({
        ...prev,
        logoFile: file,
        logoDataUrl: dataUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setDesignOptions(prev => ({
      ...prev,
      logoFile: null,
      logoDataUrl: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetDesign = () => {
    setDesignOptions({
      foregroundColor: '#1976D2',
      backgroundColor: '#FFFFFF',
      logoFile: null,
      logoDataUrl: '',
      logoSize: 15,
      logoShape: 'circle',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadQR = async (format: 'png' | 'svg' = 'png', quality: 'standard' | 'high' = 'high') => {
    if (!qrCodeDataUrl && format === 'png') return;
    
    try {
      let filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr`;
      
      if (format === 'svg') {
        // Generate high-quality SVG
        await downloadSVG();
        return;
      }
      
      // PNG Download with quality options
      const canvas = document.createElement('canvas');
      const size = quality === 'high' ? 800 : 400; // High quality = 800px
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Determine QR URL
      let qrUrl = '';
      if (qrCode.qr_type === 'static') {
        qrUrl = destinationUrl || qrCode.destination_url || '';
      } else {
        qrUrl = `${window.location.origin}/qr/${qrCode.id}`;
      }
      
      // Generate base QR code
      await QRCode.toCanvas(canvas, qrUrl, {
        width: size,
        margin: 2,
        color: {
          dark: designOptions.foregroundColor,
          light: designOptions.backgroundColor
        }
      });
      
      // Add logo if present
      if (designOptions.logoDataUrl) {
        await overlayLogo(canvas);
      }
      
      // Download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Downloaded!",
        description: `High-quality PNG (${size}x${size}px) downloaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading the QR code.",
        variant: "destructive",
      });
    }
  };
  
  const downloadSVG = async () => {
    try {
      // For SVG, we need to create a simpler version without logo embedding
      // as SVG generation with embedded images is complex
      let qrUrl = '';
      if (qrCode.qr_type === 'static') {
        qrUrl = destinationUrl || qrCode.destination_url || '';
      } else {
        qrUrl = `${window.location.origin}/qr/${qrCode.id}`;
      }
      
      const svgString = await QRCode.toString(qrUrl, {
        type: 'svg',
        width: 800,
        margin: 2,
        color: {
          dark: designOptions.foregroundColor,
          light: designOptions.backgroundColor
        }
      });
      
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr.svg`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "SVG Downloaded!",
        description: "Vector SVG file downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "SVG download failed",
        description: "There was an error generating the SVG file.",
        variant: "destructive",
      });
    }
  };

  const saveChanges = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        title,
        description,
        design_options: {
          foregroundColor: designOptions.foregroundColor,
          backgroundColor: designOptions.backgroundColor,
          logoSize: designOptions.logoSize,
          hasLogo: !!designOptions.logoDataUrl,
        }
      };

      // Update destination URL for static QRs
      if (qrCode.qr_type === 'static') {
        updateData.destination_url = destinationUrl;
      }

      // Store logo data URL if present (in a real app, you'd upload to storage)
      if (designOptions.logoDataUrl) {
        updateData.design_options.logoDataUrl = designOptions.logoDataUrl;
      }

      const { error } = await supabase
        .from('qr_codes')
        .update(updateData)
        .eq('id', qrCode.id);

      if (error) throw error;

      toast({
        title: "Updated!",
        description: "QR code has been updated successfully.",
      });

      onUpdate();
      onClose();
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

  // Regenerate QR when design options change
  useEffect(() => {
    if (isOpen && qrCode) {
      const timeoutId = setTimeout(() => {
        generateQRPreview();
      }, 300); // Debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [designOptions, destinationUrl]);

  if (!qrCode) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-gray-200 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-2xl font-bold text-gray-900">Edit QR Code</DialogTitle>
          <DialogDescription className="text-gray-600">
            Customize your QR code design and update its details
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Panel - Form */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter QR code title"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description (optional)"
                  className="rounded-xl"
                  rows={3}
                />
              </div>

              {qrCode.qr_type === 'static' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-url">Destination URL</Label>
                  <Input
                    id="edit-url"
                    type="url"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Design Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Design Options
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetDesign}
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fg-color">QR Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="fg-color"
                      type="color"
                      value={designOptions.foregroundColor}
                      onChange={(e) => setDesignOptions(prev => ({
                        ...prev,
                        foregroundColor: e.target.value
                      }))}
                      className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <Input
                      value={designOptions.foregroundColor}
                      onChange={(e) => setDesignOptions(prev => ({
                        ...prev,
                        foregroundColor: e.target.value
                      }))}
                      className="flex-1 rounded-xl text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bg-color">Background Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="bg-color"
                      type="color"
                      value={designOptions.backgroundColor}
                      onChange={(e) => setDesignOptions(prev => ({
                        ...prev,
                        backgroundColor: e.target.value
                      }))}
                      className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <Input
                      value={designOptions.backgroundColor}
                      onChange={(e) => setDesignOptions(prev => ({
                        ...prev,
                        backgroundColor: e.target.value
                      }))}
                      className="flex-1 rounded-xl text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="space-y-3">
                <Label>Logo/Branding</Label>
                
                {!designOptions.logoDataUrl ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-3">
                      Upload your logo or branding image
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl border-gray-200 bg-white hover:bg-gray-50"
                    >
                      Choose Image
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-white">
                      <img
                        src={designOptions.logoDataUrl}
                        alt="Logo preview"
                        className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Logo uploaded</p>
                        <p className="text-xs text-gray-500">
                          {designOptions.logoFile?.name}
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
                          {designOptions.logoSize}%
                        </span>
                      </div>
                      <Slider
                        value={[designOptions.logoSize]}
                        onValueChange={(value) => setDesignOptions(prev => ({
                          ...prev,
                          logoSize: value[0]
                        }))}
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
                    
                    {/* Logo Shape Selector */}
                    <div className="space-y-3">
                      <Label className="text-sm">Logo Shape</Label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDesignOptions(prev => ({ ...prev, logoShape: 'circle' }))}
                          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                            designOptions.logoShape === 'circle'
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Circle className="h-4 w-4" />
                          <span className="text-sm font-medium">Circle</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setDesignOptions(prev => ({ ...prev, logoShape: 'rounded-square' }))}
                          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                            designOptions.logoShape === 'rounded-square'
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Square className="h-4 w-4" />
                          <span className="text-sm font-medium">Rounded</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview</h3>
            
            <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : qrCodeDataUrl ? (
                <div className="text-center space-y-4">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code Preview"
                    className="mx-auto rounded-xl shadow-md border border-gray-100"
                    style={{ maxWidth: '300px', width: '100%' }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => downloadQR('png', 'high')}
                      className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PNG (High-Res)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => downloadQR('svg')}
                      className="flex-1 rounded-xl border-secondary/30 text-secondary hover:bg-secondary/10 hover:border-secondary"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      SVG Vector
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <p>QR code preview will appear here</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={saveChanges}
                disabled={saving}
                className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-xl"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};