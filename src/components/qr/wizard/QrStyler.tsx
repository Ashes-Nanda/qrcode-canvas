import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Upload, Palette, RefreshCw, Trash2, Eye, EyeOff } from 'lucide-react';
import { WizardState } from './WizardLayout';

interface QrStylerProps {
  style: WizardState['style'];
  onStyleChange: (style: WizardState['style']) => void;
}

interface PresetTheme {
  name: string;
  fgColor: string;
  bgColor: string;
  description: string;
  category: 'professional' | 'modern' | 'brand' | 'colorful';
}

const presetThemes: PresetTheme[] = [
  // Professional
  { name: 'Classic', fgColor: '#000000', bgColor: '#FFFFFF', description: 'Traditional black on white', category: 'professional' },
  { name: 'Corporate', fgColor: '#1a365d', bgColor: '#f7fafc', description: 'Professional navy blue', category: 'professional' },
  { name: 'Elegant', fgColor: '#2d3748', bgColor: '#f9f9f9', description: 'Sophisticated gray tones', category: 'professional' },
  { name: 'Monochrome', fgColor: '#1a1a1a', bgColor: '#ffffff', description: 'High contrast black', category: 'professional' },
  
  // Modern
  { name: 'Tech Blue', fgColor: '#3182ce', bgColor: '#ebf8ff', description: 'Modern technology feel', category: 'modern' },
  { name: 'Digital', fgColor: '#6b46c1', bgColor: '#f3e8ff', description: 'Digital purple theme', category: 'modern' },
  { name: 'Cyber', fgColor: '#065f46', bgColor: '#d1fae5', description: 'Cyberpunk green', category: 'modern' },
  { name: 'Neon', fgColor: '#db2777', bgColor: '#fce7f3', description: 'Electric pink accent', category: 'modern' },
  
  // Brand
  { name: 'Business', fgColor: '#1e40af', bgColor: '#dbeafe', description: 'Professional blue brand', category: 'brand' },
  { name: 'Premium', fgColor: '#7c2d12', bgColor: '#fef7ed', description: 'Luxury bronze theme', category: 'brand' },
  { name: 'Finance', fgColor: '#15803d', bgColor: '#dcfce7', description: 'Financial services green', category: 'brand' },
  { name: 'Health', fgColor: '#0e7490', bgColor: '#cffafe', description: 'Healthcare teal', category: 'brand' },
  
  // Colorful
  { name: 'Sunset', fgColor: '#ea580c', bgColor: '#fff7ed', description: 'Warm orange sunset', category: 'colorful' },
  { name: 'Ocean', fgColor: '#0891b2', bgColor: '#f0f9ff', description: 'Deep ocean blue', category: 'colorful' },
  { name: 'Forest', fgColor: '#166534', bgColor: '#f0fdf4', description: 'Natural forest green', category: 'colorful' },
  { name: 'Royal', fgColor: '#7c3aed', bgColor: '#f5f3ff', description: 'Royal purple theme', category: 'colorful' },
];

const categoryColors = {
  professional: 'bg-gray-50 text-gray-700 border-gray-200',
  modern: 'bg-blue-50 text-blue-700 border-blue-200',
  brand: 'bg-purple-50 text-purple-700 border-purple-200',
  colorful: 'bg-pink-50 text-pink-700 border-pink-200',
};

export const QrStyler: React.FC<QrStylerProps> = ({ style, onStyleChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  
  const handleColorChange = useCallback((key: 'fgColor' | 'bgColor', color: string) => {
    onStyleChange({ ...style, [key]: color });
  }, [style, onStyleChange]);

  const handleLogoUpload = useCallback(async (file: File) => {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Extract dominant colors from the image
      const colors = await extractColorsFromImage(dataUrl);
      setExtractedColors(colors);

      onStyleChange({
        ...style,
        logo: file,
        logoDataUrl: dataUrl,
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
    }
  }, [style, onStyleChange]);

  const extractColorsFromImage = async (dataUrl: string): Promise<string[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve([]);
          return;
        }

        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(img, 0, 0, 100, 100);

        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        const colorMap = new Map<string, number>();

        for (let i = 0; i < data.length; i += 4) {
          const r = Math.floor(data[i] / 32) * 32;
          const g = Math.floor(data[i + 1] / 32) * 32;
          const b = Math.floor(data[i + 2] / 32) * 32;
          const alpha = data[i + 3];

          if (alpha > 128) {
            const color = `rgb(${r}, ${g}, ${b})`;
            const hex = rgbToHex(r, g, b);
            colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
          }
        }

        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([color]) => color);

        resolve(sortedColors);
      };
      img.src = dataUrl;
    });
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const handleThemeSelect = useCallback((theme: PresetTheme) => {
    onStyleChange({
      ...style,
      fgColor: theme.fgColor,
      bgColor: theme.bgColor,
    });
  }, [style, onStyleChange]);

  const handleLogoSizeChange = useCallback((size: number[]) => {
    onStyleChange({ ...style, logoSize: size[0] });
  }, [style, onStyleChange]);

  const removeLogo = useCallback(() => {
    onStyleChange({
      ...style,
      logo: undefined,
      logoDataUrl: undefined,
    });
    setExtractedColors([]);
  }, [style, onStyleChange]);

  const resetToDefaults = () => {
    onStyleChange({
      fgColor: '#000000',
      bgColor: '#FFFFFF',
      logoSize: 15,
    });
    setExtractedColors([]);
  };

  const groupedThemes = presetThemes.reduce((acc, theme) => {
    if (!acc[theme.category]) {
      acc[theme.category] = [];
    }
    acc[theme.category].push(theme);
    return acc;
  }, {} as Record<string, PresetTheme[]>);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Style & Customize Your QR Code
        </h3>
        <p className="text-gray-600 text-sm">
          Make your QR code stand out with custom colors, themes, and branding
        </p>
      </div>

      {/* Color Customization */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Foreground Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={style.fgColor}
                  onChange={(e) => handleColorChange('fgColor', e.target.value)}
                  className="h-12 w-16 rounded-lg border border-gray-200 cursor-pointer"
                />
                <div className="flex-1">
                  <Input
                    value={style.fgColor}
                    onChange={(e) => handleColorChange('fgColor', e.target.value)}
                    placeholder="#000000"
                    className="uppercase"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">QR code pattern color</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Background Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={style.bgColor}
                  onChange={(e) => handleColorChange('bgColor', e.target.value)}
                  className="h-12 w-16 rounded-lg border border-gray-200 cursor-pointer"
                />
                <div className="flex-1">
                  <Input
                    value={style.bgColor}
                    onChange={(e) => handleColorChange('bgColor', e.target.value)}
                    placeholder="#FFFFFF"
                    className="uppercase"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">QR code background color</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RefreshCw className="h-3 w-3 mr-2" />
              Reset to Default
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? <EyeOff className="h-3 w-3 mr-2" /> : <Eye className="h-3 w-3 mr-2" />}
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Logo & Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!style.logoDataUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h4 className="font-medium text-gray-900 mb-2">Add Your Logo</h4>
              <p className="text-gray-600 text-sm mb-4">
                Upload a logo to embed in your QR code
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary-hover transition-colors">
                <Upload className="h-4 w-4" />
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
              </label>
              <p className="text-xs text-gray-500 mt-3">
                PNG, JPG, SVG • Max 5MB • Square logos work best
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-white">
                <img
                  src={style.logoDataUrl}
                  alt="Logo preview"
                  className="w-16 h-16 object-cover rounded-lg border border-gray-100"
                />
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">Logo Uploaded</h5>
                  <p className="text-sm text-gray-500">{style.logo?.name}</p>
                </div>
                <Button variant="outline" size="sm" onClick={removeLogo}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Logo Size</Label>
                  <span className="text-sm text-gray-500">{style.logoSize}%</span>
                </div>
                <Slider
                  value={[style.logoSize]}
                  onValueChange={handleLogoSizeChange}
                  max={30}
                  min={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Small (5%)</span>
                  <span>Large (30%)</span>
                </div>
              </div>

              {/* Color Extraction from Logo */}
              {extractedColors.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Colors from Your Logo</Label>
                  <div className="grid grid-cols-8 gap-2">
                    {extractedColors.map((color, index) => (
                      <button
                        key={index}
                        className="aspect-square rounded-lg border-2 border-gray-200 hover:border-primary transition-colors cursor-pointer"
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorChange('fgColor', color)}
                        title={`Use color: ${color}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Click any color to use it as foreground</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preset Themes */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Preset Themes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedThemes).map(([category, themes]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={categoryColors[category as keyof typeof categoryColors]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Badge>
                <span className="text-xs text-gray-500">{themes.length} themes</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {themes.map((theme) => {
                  const isSelected = style.fgColor === theme.fgColor && style.bgColor === theme.bgColor;
                  return (
                    <button
                      key={theme.name}
                      onClick={() => handleThemeSelect(theme)}
                      className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${
                        isSelected
                          ? 'ring-2 ring-primary border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: theme.fgColor }}
                        />
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: theme.bgColor }}
                        />
                      </div>
                      <h5 className="font-medium text-sm text-gray-900 mb-1">{theme.name}</h5>
                      <p className="text-xs text-gray-500">{theme.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Advanced Options */}
      {showAdvanced && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Advanced Styling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded">
                  <Eye className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h5 className="font-medium text-blue-900 mb-1">Pro Tip</h5>
                  <p className="text-blue-800 text-sm">
                    For best scanning results, maintain high contrast between foreground and background colors. 
                    Dark colors on light backgrounds work best.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center text-gray-500 text-sm">
              <p>More advanced styling options coming soon...</p>
              <p>• Custom patterns • Rounded corners • Gradient fills</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Style Summary */}
      <div className="p-4 bg-gray-50 rounded-xl border">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Current Style</h4>
            <p className="text-sm text-gray-600">
              {style.logoDataUrl ? 'With logo • ' : ''}Colors: {style.fgColor} / {style.bgColor}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded border" style={{ backgroundColor: style.fgColor }} />
            <div className="w-8 h-8 rounded border" style={{ backgroundColor: style.bgColor }} />
          </div>
        </div>
      </div>
    </div>
  );
};
