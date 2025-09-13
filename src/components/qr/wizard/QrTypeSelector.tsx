import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Link, 
  FileText, 
  User, 
  Type, 
  Smartphone, 
  MapPin, 
  MessageSquare, 
  Mail, 
  Phone,
  Share2,
  Calendar,
  Upload
} from 'lucide-react';

export interface QrTypeConfig {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  category: 'basic' | 'contact' | 'business' | 'advanced';
  popular?: boolean;
}

const qrTypes: QrTypeConfig[] = [
  {
    type: 'url',
    label: 'URL',
    icon: Link,
    description: 'Website or link',
    category: 'basic',
    popular: true,
  },
  {
    type: 'text',
    label: 'Text',
    icon: Type,
    description: 'Plain text content',
    category: 'basic',
    popular: true,
  },
  {
    type: 'contact',
    label: 'Contact',
    icon: User,
    description: 'vCard contact info',
    category: 'contact',
    popular: true,
  },
  {
    type: 'sms',
    label: 'SMS',
    icon: MessageSquare,
    description: 'Text message',
    category: 'contact',
  },
  {
    type: 'email',
    label: 'Email',
    icon: Mail,
    description: 'Email message',
    category: 'contact',
  },
  {
    type: 'phone',
    label: 'Phone',
    icon: Phone,
    description: 'Phone number',
    category: 'contact',
  },
  {
    type: 'location',
    label: 'Location',
    icon: MapPin,
    description: 'GPS coordinates',
    category: 'business',
  },
  {
    type: 'app',
    label: 'App',
    icon: Smartphone,
    description: 'App store link',
    category: 'business',
  },
  {
    type: 'socials',
    label: 'Social',
    icon: Share2,
    description: 'Social media profile',
    category: 'business',
  },
  {
    type: 'pdf',
    label: 'PDF',
    icon: FileText,
    description: 'PDF document',
    category: 'advanced',
  },
  {
    type: 'file',
    label: 'File',
    icon: Upload,
    description: 'File download',
    category: 'advanced',
  },
  {
    type: 'event',
    label: 'Event',
    icon: Calendar,
    description: 'Calendar event',
    category: 'business',
  },
];

const categoryLabels: Record<string, string> = {
  basic: 'Basic',
  contact: 'Contact & Communication',
  business: 'Business & Marketing',
  advanced: 'Advanced',
};

const categoryColors: Record<string, string> = {
  basic: 'bg-blue-50 text-blue-700 border-blue-200',
  contact: 'bg-green-50 text-green-700 border-green-200',
  business: 'bg-purple-50 text-purple-700 border-purple-200',
  advanced: 'bg-orange-50 text-orange-700 border-orange-200',
};

interface QrTypeSelectorProps {
  selectedType: string;
  onTypeSelect: (type: string) => void;
}

export const QrTypeSelector: React.FC<QrTypeSelectorProps> = ({
  selectedType,
  onTypeSelect,
}) => {
  const groupedTypes = qrTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, QrTypeConfig[]>);

  const handleTypeSelect = (type: string) => {
    onTypeSelect(type);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          What type of QR code do you want to create?
        </h3>
        <p className="text-gray-600 text-sm">
          Choose from our collection of QR code types below
        </p>
      </div>

      {/* Popular Types First */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            ⭐ Popular
          </Badge>
          <h4 className="font-medium text-gray-900">Most Used Types</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrTypes
            .filter(type => type.popular)
            .map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.type;
              return (
                <Card
                  key={type.type}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                    isSelected
                      ? 'ring-2 ring-primary shadow-lg bg-primary/5 border-primary'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleTypeSelect(type.type)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 mb-1">
                          {type.label}
                        </h5>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                      {isSelected && (
                        <div className="text-primary">
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      {/* All Types by Category */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900">All Types</h4>
        </div>
        
        {Object.entries(groupedTypes).map(([category, types]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={categoryColors[category]}
              >
                {categoryLabels[category]}
              </Badge>
              <span className="text-xs text-gray-500">
                {types.length} type{types.length > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {types.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.type;
                return (
                  <Card
                    key={type.type}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                      isSelected
                        ? 'ring-2 ring-primary shadow-lg bg-primary/5 border-primary'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => handleTypeSelect(type.type)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded ${
                            isSelected
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h6 className="font-medium text-sm text-gray-900 truncate">
                            {type.label}
                          </h6>
                          <p className="text-xs text-gray-500 truncate">
                            {type.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="text-primary">
                            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selection Summary */}
      {selectedType && (
        <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-white">
              {(() => {
                const selectedTypeConfig = qrTypes.find(t => t.type === selectedType);
                if (selectedTypeConfig) {
                  const Icon = selectedTypeConfig.icon;
                  return <Icon className="h-5 w-5" />;
                }
                return null;
              })()}
            </div>
            <div>
              <h4 className="font-semibold text-primary">
                {qrTypes.find(t => t.type === selectedType)?.label} QR Code Selected
              </h4>
              <p className="text-sm text-gray-600">
                Ready to proceed to the next step
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
